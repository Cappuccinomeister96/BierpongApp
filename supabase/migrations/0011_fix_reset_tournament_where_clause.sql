-- Fix: reset_tournament schlug mit HTTP 400 fehl ("DELETE requires a WHERE clause").
-- Ursache: Die pg-safeupdate-Extension ist für die authenticator-Rolle aktiv und
-- blockiert DELETE/UPDATE ohne WHERE-Klausel. Die unqualifizierten DELETEs in der
-- RPC wurden daher abgewiesen. Lösung: immer-wahre WHERE-Klausel ergaenzen.

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

  delete from public.matches where true;
  if p_delete_teams then
    delete from public.teams where true;
  end if;
  update public.config set updated_at = now() where id = 1;
end;
$$;
