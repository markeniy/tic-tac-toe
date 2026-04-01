alter table public.online_rooms
add column if not exists score_x integer not null default 0;

alter table public.online_rooms
add column if not exists score_o integer not null default 0;

alter table public.online_rooms
add column if not exists score_draw integer not null default 0;
