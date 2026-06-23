-- Doppel-Meldungen über die gesamte Pending-Phase abfangen (statt nur 90 s).
-- Solange für eine (ungeordnete) Paarung ein 'pending'-Match existiert, wird KEIN
-- zweites Match angelegt. submit_match meldet dem Client per JSON, ob es sich um eine
-- Erstmeldung ('duplicate' = false) oder ein bereits eingereichtes Ergebnis handelt
-- ('duplicate' = true, inkl. der Namen/Tisch der Originalmeldung für den Hinweistext).
-- Sobald der Schiri das Match freigibt/ablehnt (Status <> 'pending'), kann die Paarung
-- erneut gemeldet werden.

-- Rückgabetyp ändert sich von uuid -> jsonb, daher zwingend drop + neu anlegen.
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

  -- Offene (pending) Meldung derselben Paarung suchen – ohne Zeitlimit.
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
