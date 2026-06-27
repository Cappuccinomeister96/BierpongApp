-- ---------------------------------------------------------------------------
-- Fix: "column reference \"id\" is ambiguous" in register_team
--
-- register_team deklariert via RETURNS TABLE (id uuid, confirm_token uuid) eine
-- Ausgabespalte namens "id". In der mit Migration 0007 ergaenzten max_teams-
-- Pruefung referenzierte "where id = 1" damit mehrdeutig sowohl diese
-- Ausgabespalte als auch config.id -> Postgres bricht mit SQLSTATE 42702 ab,
-- und zwar vor dem INSERT. Dadurch schlug JEDE Team-Anmeldung fehl.
--
-- Fix: config.id explizit qualifizieren. Funktion ansonsten unveraendert.
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

  -- Max-Teams-Grenze prüfen (config.id qualifiziert -> nicht mehr mehrdeutig
  -- gegen die gleichnamige RETURNS-TABLE-Ausgabespalte "id").
  select max_teams into v_max_teams from public.config where config.id = 1;
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
