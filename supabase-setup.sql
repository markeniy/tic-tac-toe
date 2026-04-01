create extension if not exists pgcrypto;

create table if not exists public.online_rooms (
  id uuid primary key default gen_random_uuid(),
  room_code text not null unique,
  board jsonb not null default '["","","","","","","","",""]'::jsonb,
  board_size integer not null default 3,
  current_player text not null default 'X' check (current_player in ('X', 'O')),
  status text not null default 'waiting' check (status in ('waiting', 'playing', 'finished')),
  winner text null check (winner in ('X', 'O', 'draw')),
  winning_pattern jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_online_rooms_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_online_rooms_updated_at on public.online_rooms;

create trigger set_online_rooms_updated_at
before update on public.online_rooms
for each row
execute function public.set_online_rooms_updated_at();

alter table public.online_rooms enable row level security;

drop policy if exists "online rooms read" on public.online_rooms;
create policy "online rooms read"
on public.online_rooms
for select
using (true);

drop policy if exists "online rooms insert" on public.online_rooms;
create policy "online rooms insert"
on public.online_rooms
for insert
with check (true);

drop policy if exists "online rooms update" on public.online_rooms;
create policy "online rooms update"
on public.online_rooms
for update
using (true)
with check (true);

alter publication supabase_realtime add table public.online_rooms;
