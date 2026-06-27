-- MFA serverseitig erzwingen (nicht nur in der Middleware).
-- Problem: authenticated-Sessions auf AAL1 (nur Passwort) hatten vollen
-- Tabellen- und RPC-Zugriff. Ein Angreifer mit dem Passwort konnte direkt
-- gegen Supabase eine Session erzeugen und MFA komplett umgehen.
--
-- Lösung:
--  1. Helper referee_has_completed_mfa(): true, wenn Session AAL2 ist ODER der
--     User (noch) keinen verifizierten Faktor hat (damit MFA-Einrichtung bei
--     AAL1 möglich bleibt -> sonst Selbst-Aussperrung).
--  2. Restriktive RLS-Policies auf teams/matches/tables/config, die den Helper
--     erzwingen. Restriktive Policies UND-verknüpfen mit den bestehenden.
--  3. AAL-Guard in den SECURITY-DEFINER-RPCs reset_tournament & remove_team,
--     da diese RLS umgehen.

-- ---------------------------------------------------------------------------
-- 1. Helper
-- ---------------------------------------------------------------------------

create or replace function public.referee_has_completed_mfa()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select
    (select auth.jwt() ->> 'aal') = 'aal2'
    or not exists (
      select 1
      from auth.mfa_factors
      where user_id = (select auth.uid())
        and status = 'verified'
    );
$$;

revoke all on function public.referee_has_completed_mfa() from public;
grant execute on function public.referee_has_completed_mfa() to authenticated;

-- ---------------------------------------------------------------------------
-- 2. Restriktive AAL2-Policies
-- ---------------------------------------------------------------------------

drop policy if exists "mfa_required" on public.teams;
create policy "mfa_required" on public.teams
  as restrictive for all to authenticated
  using ((select public.referee_has_completed_mfa()))
  with check ((select public.referee_has_completed_mfa()));

drop policy if exists "mfa_required" on public.matches;
create policy "mfa_required" on public.matches
  as restrictive for all to authenticated
  using ((select public.referee_has_completed_mfa()))
  with check ((select public.referee_has_completed_mfa()));

drop policy if exists "mfa_required" on public.tables;
create policy "mfa_required" on public.tables
  as restrictive for all to authenticated
  using ((select public.referee_has_completed_mfa()))
  with check ((select public.referee_has_completed_mfa()));

drop policy if exists "mfa_required" on public.config;
create policy "mfa_required" on public.config
  as restrictive for all to authenticated
  using ((select public.referee_has_completed_mfa()))
  with check ((select public.referee_has_completed_mfa()));

-- ---------------------------------------------------------------------------
-- 3. AAL-Guard in den Admin-RPCs (umgehen RLS, daher eigener Check)
-- ---------------------------------------------------------------------------

create or replace function public.reset_tournament(p_delete_teams boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.referee_has_completed_mfa() then
    raise exception 'MFA erforderlich.' using errcode = 'insufficient_privilege';
  end if;

  delete from public.matches;
  if p_delete_teams then
    delete from public.teams;
  end if;
  update public.config set updated_at = now() where id = 1;
end;
$$;

create or replace function public.remove_team(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_matches boolean;
begin
  if not public.referee_has_completed_mfa() then
    raise exception 'MFA erforderlich.' using errcode = 'insufficient_privilege';
  end if;

  select exists(
    select 1 from public.matches
    where team_a_id = p_team_id or team_b_id = p_team_id
  ) into v_has_matches;

  if v_has_matches then
    update public.teams set hidden = true where id = p_team_id;
    return 'hidden';
  else
    delete from public.teams where id = p_team_id;
    return 'deleted';
  end if;
end;
$$;
