-- Bierpong-Turnier – Initiales Schema, RLS, RPCs und Views
-- Sicherheitsmodell:
--  * anon (Spieler): KEIN direkter Tabellenzugriff. Nur 3 RPCs + 2 öffentliche Views.
--  * authenticated (Schiedsrichter, geteilter Account): voller Zugriff auf alle Tabellen.
--  * Punkte werden nie gespeichert, sondern in einer View aus freigegebenen Matches berechnet.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tabellen
-- ---------------------------------------------------------------------------

-- Singleton-Konfiguration (Punktwerte etc.)
create table if not exists public.config (
  id int primary key default 1,
  tournament_name text not null default 'Bierpong-Turnier',
  sieg_punkte int not null default 3,
  niederlage_punkte int not null default -1,
  started_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint config_singleton check (id = 1)
);
insert into public.config (id) values (1) on conflict do nothing;

-- Bierpong-Tische (je ein laminierter QR-Code mit token)
create table if not exists public.tables (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  token uuid not null default gen_random_uuid() unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Teams (Spielernamen = nur Vornamen)
create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  vorname1 text not null,
  vorname2 text not null,
  status text not null default 'yellow' check (status in ('yellow', 'green')),
  confirm_token uuid not null default gen_random_uuid() unique,
  created_by text not null default 'player' check (created_by in ('player', 'referee')),
  created_at timestamptz not null default now()
);
-- Teamname eindeutig (case-insensitive)
create unique index if not exists teams_name_unique on public.teams (lower(name));

-- Spiele
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  table_id uuid references public.tables (id) on delete set null,
  team_a_id uuid not null references public.teams (id) on delete cascade,
  team_b_id uuid not null references public.teams (id) on delete cascade,
  winner_id uuid not null references public.teams (id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  note text,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid,
  constraint teams_distinct check (team_a_id <> team_b_id),
  constraint winner_valid check (winner_id in (team_a_id, team_b_id))
);
create index if not exists matches_status_idx on public.matches (status);
create index if not exists matches_created_idx on public.matches (created_at desc);

-- ---------------------------------------------------------------------------
-- Views
-- ---------------------------------------------------------------------------

-- Öffentliche Team-Liste für die Ergebniseingabe (nur bestätigte Teams, OHNE Vornamen)
create or replace view public.teams_public as
select id, name
from public.teams
where status = 'green';

-- Vollständiges Leaderboard (für Schiri-Dashboard, inkl. Vornamen)
create or replace view public.leaderboard_view as
with played as (
  select
    t.id as team_id,
    t.name as team,
    t.vorname1,
    t.vorname2,
    count(m.id) as games,
    count(m.id) filter (where m.winner_id = t.id) as wins
  from public.teams t
  left join public.matches m
    on m.status = 'approved'
    and (m.team_a_id = t.id or m.team_b_id = t.id)
  where t.status = 'green'
  group by t.id, t.name, t.vorname1, t.vorname2
)
select
  p.team_id,
  p.team,
  p.vorname1,
  p.vorname2,
  p.games,
  p.wins,
  (p.games - p.wins) as losses,
  (p.wins * c.sieg_punkte + (p.games - p.wins) * c.niederlage_punkte) as points,
  rank() over (
    order by
      (p.wins * c.sieg_punkte + (p.games - p.wins) * c.niederlage_punkte) desc,
      p.wins desc,
      p.games asc
  ) as rank
from played p
cross join public.config c
where c.id = 1
order by points desc, wins desc, games asc, lower(p.team) asc;

-- Öffentliches Leaderboard (nur Teamname + Kennzahlen, KEINE Vornamen)
create or replace view public.leaderboard_public as
select team, games, wins, losses, points, rank
from public.leaderboard_view;

-- Angereicherte Spiele für das Schiri-Dashboard
create or replace view public.matches_detailed as
select
  m.*,
  ta.name as team_a_name,
  tb.name as team_b_name,
  tw.name as winner_name,
  tbl.name as table_name
from public.matches m
join public.teams ta on ta.id = m.team_a_id
join public.teams tb on tb.id = m.team_b_id
join public.teams tw on tw.id = m.winner_id
left join public.tables tbl on tbl.id = m.table_id;

-- ---------------------------------------------------------------------------
-- RPC-Funktionen (SECURITY DEFINER) – einziger Schreibweg für Spieler
-- ---------------------------------------------------------------------------

-- Team-Anmeldung durch Spieler -> Status gelb
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
begin
  if coalesce(btrim(p_name), '') = ''
     or coalesce(btrim(p_vorname1), '') = ''
     or coalesce(btrim(p_vorname2), '') = '' then
    raise exception 'Bitte Teamname und beide Vornamen ausfüllen.';
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

-- Ergebnis-Meldung durch Spieler -> Status pending (wartet auf Schiri)
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

  select id into v_table from public.tables where token = p_table_token and active = true;

  insert into public.matches (table_id, team_a_id, team_b_id, winner_id, status)
  values (v_table, p_team_a, p_team_b, p_winner, 'pending')
  returning id into v_id;

  return v_id;
end;
$$;

-- Tisch-Infos anhand des QR-Tokens (für die Anzeige auf der Ergebnis-Seite)
create or replace function public.get_table(p_token uuid)
returns table (id uuid, name text)
language sql
security definer
set search_path = public
as $$
  select id, name from public.tables where token = p_token and active = true;
$$;

-- Turnier zurücksetzen (nur Schiri)
create or replace function public.reset_tournament(p_delete_teams boolean default false)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.matches;
  if p_delete_teams then
    delete from public.teams;
  end if;
  update public.config set started_at = null, updated_at = now() where id = 1;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.config enable row level security;
alter table public.tables enable row level security;
alter table public.teams enable row level security;
alter table public.matches enable row level security;

-- Config darf von allen gelesen werden (Punktwerte für Regelanzeige), Schreiben nur Schiri
drop policy if exists "config read" on public.config;
create policy "config read" on public.config
  for select to anon, authenticated using (true);

drop policy if exists "config write" on public.config;
create policy "config write" on public.config
  for all to authenticated using (true) with check (true);

-- Schiedsrichter (authenticated) dürfen alles
drop policy if exists "referee tables" on public.tables;
create policy "referee tables" on public.tables
  for all to authenticated using (true) with check (true);

drop policy if exists "referee teams" on public.teams;
create policy "referee teams" on public.teams
  for all to authenticated using (true) with check (true);

drop policy if exists "referee matches" on public.matches;
create policy "referee matches" on public.matches
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Rechte
-- ---------------------------------------------------------------------------

-- Anon hat KEINEN direkten Tabellenzugriff (nur RPC + öffentliche Views).
revoke all on public.teams from anon;
revoke all on public.matches from anon;
revoke all on public.tables from anon;

grant select on public.teams_public to anon, authenticated;
grant select on public.leaderboard_public to anon, authenticated;
grant select on public.leaderboard_view to authenticated;
grant select on public.matches_detailed to authenticated;

grant execute on function public.register_team(text, text, text) to anon, authenticated;
grant execute on function public.submit_match(uuid, uuid, uuid, uuid) to anon, authenticated;
grant execute on function public.get_table(uuid) to anon, authenticated;
grant execute on function public.reset_tournament(boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.matches;
alter publication supabase_realtime add table public.teams;

-- ---------------------------------------------------------------------------
-- Seed: zwei Beispiel-Tische
-- ---------------------------------------------------------------------------

insert into public.tables (name) values ('Tisch 1'), ('Tisch 2')
on conflict do nothing;
