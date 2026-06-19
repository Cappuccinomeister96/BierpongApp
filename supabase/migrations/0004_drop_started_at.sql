-- "started_at" war ein nie genutztes Feld (kein Lese-/Schreibzugriff in der App).
-- Spalte entfernen und reset_tournament ohne den toten Schreibvorgang neu anlegen.

alter table public.config drop column if exists started_at;

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
  update public.config set updated_at = now() where id = 1;
end;
$$;
