-- Punkte-Historie schützen: Das Löschen/Ändern eines Teams darf NIE die
-- bereits erfassten Punkte (insbesondere der Gegner) verändern.
--  * Editieren (Name/Vornamen) wirkt nie auf Punkte, da Spiele Teams per ID
--    referenzieren, nicht per Name.
--  * Entfernen erfolgt als Soft-Delete (hidden=true), wenn das Team Spiele hat
--    -> alle Matches und damit alle Gegner-Punkte bleiben erhalten.
--    Teams ohne Spiele werden hart gelöscht (Liste bleibt sauber, Name frei).

alter table public.teams add column if not exists hidden boolean not null default false;

-- FKs von CASCADE auf RESTRICT (DB-seitiger Schutz gegen versehentliche
-- Match-Löschung). reset_tournament löscht Matches zuerst und bleibt gültig.
alter table public.matches drop constraint if exists matches_team_a_id_fkey;
alter table public.matches drop constraint if exists matches_team_b_id_fkey;
alter table public.matches drop constraint if exists matches_winner_id_fkey;
alter table public.matches
  add constraint matches_team_a_id_fkey foreign key (team_a_id)
    references public.teams (id) on delete restrict;
alter table public.matches
  add constraint matches_team_b_id_fkey foreign key (team_b_id)
    references public.teams (id) on delete restrict;
alter table public.matches
  add constraint matches_winner_id_fkey foreign key (winner_id)
    references public.teams (id) on delete restrict;

create or replace view public.teams_public as
select id, name from public.teams where status = 'green' and hidden = false;

create or replace view public.leaderboard_view as
with played as (
  select
    t.id as team_id, t.name as team, t.vorname1, t.vorname2,
    count(m.id) as games,
    count(m.id) filter (where m.winner_id = t.id) as wins
  from public.teams t
  left join public.matches m
    on m.status = 'approved' and (m.team_a_id = t.id or m.team_b_id = t.id)
  where t.status = 'green' and t.hidden = false
  group by t.id, t.name, t.vorname1, t.vorname2
)
select
  p.team_id, p.team, p.vorname1, p.vorname2, p.games, p.wins,
  (p.games - p.wins) as losses,
  (p.wins * c.sieg_punkte + (p.games - p.wins) * c.niederlage_punkte) as points,
  rank() over (
    order by (p.wins * c.sieg_punkte + (p.games - p.wins) * c.niederlage_punkte) desc,
      p.wins desc, p.games asc
  ) as rank
from played p
cross join public.config c
where c.id = 1
order by points desc, wins desc, games asc, lower(p.team) asc;

create or replace function public.remove_team(p_team_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_has_matches boolean;
begin
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

revoke all on function public.remove_team(uuid) from public;
revoke all on function public.remove_team(uuid) from anon;
grant execute on function public.remove_team(uuid) to authenticated;
