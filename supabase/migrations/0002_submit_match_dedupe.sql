-- Edge-Case-Härtung: Doppel-Meldungen abfangen.
-- Wird dieselbe Paarung (ungeordnet) innerhalb von 90 s erneut gemeldet
-- (beide Teamkollegen / Doppel-Tap / Retry nach Netzabbruch), wird KEIN
-- zweites Spiel angelegt, sondern die bestehende Match-ID zurückgegeben.
create or replace function public.submit_match(
  p_table_token uuid,
  p_team_a uuid,
  p_team_b uuid,
  p_winner uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_table uuid;
  v_id uuid;
  v_existing uuid;
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

  select id into v_existing
  from public.matches
  where status = 'pending'
    and created_at > now() - interval '90 seconds'
    and ((team_a_id = p_team_a and team_b_id = p_team_b)
      or (team_a_id = p_team_b and team_b_id = p_team_a))
  order by created_at desc
  limit 1;
  if v_existing is not null then
    return v_existing;
  end if;

  select id into v_table from public.tables where token = p_table_token and active = true;

  insert into public.matches (table_id, team_a_id, team_b_id, winner_id, status)
  values (v_table, p_team_a, p_team_b, p_winner, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;
