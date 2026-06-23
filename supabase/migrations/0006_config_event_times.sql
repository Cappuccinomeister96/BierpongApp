-- Endzeit des Turniers und Uhrzeit der Siegerehrung (Format hh:mm, im Schiri-Config einstellbar)
alter table public.config
  add column if not exists end_time text,
  add column if not exists siegerehrung_time text;
