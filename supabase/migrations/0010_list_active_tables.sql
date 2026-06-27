-- ---------------------------------------------------------------------------
-- list_active_tables: öffentliche Liste der aktiven Tische (Token + Name) für
-- das Tisch-Dropdown auf der "Ergebnis melden"-Seite (Hauptansicht-Flow).
--
-- Anon hat keinen direkten Lesezugriff auf public.tables (revoke all). Diese
-- SECURITY-DEFINER-RPC gibt nur die unkritischen Felder aktiver Tische heraus –
-- dieselben Tokens stecken ohnehin in den ausgehängten QR-Codes.
-- ---------------------------------------------------------------------------

create or replace function public.list_active_tables()
returns table (token uuid, name text)
language sql
security definer
set search_path = public
stable
as $$
  select token, name from public.tables where active = true order by name;
$$;

grant execute on function public.list_active_tables() to anon, authenticated;
