-- Sicherheits-Erweiterungen
-- 1. max_teams-Limit in config (Anmeldestopp bei Überfüllung)
-- 2. Eingabevalidierung in register_team: Längen serverseitig prüfen + max_teams-Check
-- 3. Spam-Schutz in submit_match: max. 50 gleichzeitig offene Spiele

-- ---------------------------------------------------------------------------
-- 1. config: max_teams
-- ---------------------------------------------------------------------------

alter table public.config
  add column if not exists max_teams int not null default 200;

-- ---------------------------------------------------------------------------
-- 2. register_team: Längenvalidierung + max_teams-Check
-- ---------------------------------------------------------------------------

create or replace function public.register_team(
  p_name text,
  p_vorname1 text,
  p_vorname2 text
)
returns table (id uuid, confirm_token uuid)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_token uuid;
  v_max_teams int;
  v_current_teams int;
begin
  -- Pflichtfelder
  if coalesce(btrim(p_name), '') = ''
     or coalesce(btrim(p_vorname1), '') = ''
     or coalesce(btrim(p_vorname2), '') = '' then
    raise exception 'Bitte Teamname und beide Vornamen ausfüllen.';
  end if;

  -- Längenbegrenzungen
  if length(btrim(p_name)) < 2 then
    raise exception 'Teamname muss mindestens 2 Zeichen haben.';
  end if;
  if length(btrim(p_name)) > 24 then
    raise exception 'Teamname darf maximal 24 Zeichen haben.';
  end if;
  if length(btrim(p_vorname1)) > 20 then
    raise exception 'Vorname 1 darf maximal 20 Zeichen haben.';
  end if;
  if length(btrim(p_vorname2)) > 20 then
    raise exception 'Vorname 2 darf maximal 20 Zeichen haben.';
  end if;

  -- Max-Teams-Grenze prüfen
  select max_teams into v_max_teams from public.config where id = 1;
  select count(*) into v_current_teams from public.teams where hidden = false;
  if v_current_teams >= v_max_teams then
    raise exception 'Die maximale Teamanzahl von % wurde erreicht. Bitte beim Schiedsrichter nachfragen.', v_max_teams;
  end if;

  begin
    insert into public.teams (name, vorname1, vorname2, status, created_by)
    values (btrim(p_name), btrim(p_vorname1), btrim(p_vorname2), 'yellow', 'player')
    returning teams.id, teams.confirm_token into v_id, v_token;
  exception when unique_violation then
    raise exception 'Dieser Teamname ist bereits vergeben. Bitte einen anderen wählen.';
  end;

  return query select v_id, v_token;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. submit_match: Spam-Schutz
-- ---------------------------------------------------------------------------

drop function if exists public.submit_match(uuid, uuid, uuid, uuid);

create function public.submit_match(
  p_table_token uuid,
  p_team_a uuid,
  p_team_b uuid,
  p_winner uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table uuid;
  v_id uuid;
  v_existing record;
begin
  if p_team_a = p_team_b then
    raise exception 'Bitte zwei verschiedene Teams wählen.';
  end if;
  if p_winner is null or p_winner not in (p_team_a, p_team_b) then
    raise exception 'Bitte den Sieger wählen.';
  end if;
  if (select count(*) from public.teams
      where id in (p_team_a, p_team_b) and status = 'green') <> 2 then
    raise exception 'Beide Teams müssen vom Schiedsrichter bestätigt sein.';
  end if;

  -- Spam-Schutz: max. 50 offene Spiele gleichzeitig
  if (select count(*) from public.matches where status = 'pending') >= 50 then
    raise exception 'Zu viele offene Spiele. Bitte warte, bis der Schiedsrichter die aktuellen Spiele bearbeitet hat.';
  end if;

  -- Offene (pending) Meldung derselben Paarung suchen
  select m.id,
         ta.name  as team_a_name,
         tb.name  as team_b_name,
         tw.name  as winner_name,
         tbl.name as table_name
    into v_existing
  from public.matches m
  join public.teams ta on ta.id = m.team_a_id
  join public.teams tb on tb.id = m.team_b_id
  join public.teams tw on tw.id = m.winner_id
  left join public.tables tbl on tbl.id = m.table_id
  where m.status = 'pending'
    and ((m.team_a_id = p_team_a and m.team_b_id = p_team_b)
      or (m.team_a_id = p_team_b and m.team_b_id = p_team_a))
  order by m.created_at desc
  limit 1;

  if v_existing.id is not null then
    return jsonb_build_object(
      'match_id',    v_existing.id,
      'duplicate',   true,
      'team_a_name', v_existing.team_a_name,
      'team_b_name', v_existing.team_b_name,
      'winner_name', v_existing.winner_name,
      'table_name',  v_existing.table_name
    );
  end if;

  select id into v_table from public.tables where token = p_table_token and active = true;

  insert into public.matches (table_id, team_a_id, team_b_id, winner_id, status)
  values (v_table, p_team_a, p_team_b, p_winner, 'pending')
  returning id into v_id;

  return jsonb_build_object('match_id', v_id, 'duplicate', false);
end;
$$;

grant execute on function public.submit_match(uuid, uuid, uuid, uuid) to anon, authenticated;
