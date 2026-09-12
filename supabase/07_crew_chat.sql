-- ============================================================
-- AFTER[DARK] - 07 Crew-Chat
-- Gemeinsame Chat-Raeume und Nachrichten fuer jede Crew
-- ============================================================

create table if not exists public.crew_chat_rooms (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (crew_id, name),
  check (char_length(trim(name)) between 1 and 40)
);

create index if not exists crew_chat_rooms_crew_idx
on public.crew_chat_rooms (crew_id, created_at);

create table if not exists public.crew_chat_messages (
  id bigint generated always as identity primary key,
  room_id uuid not null references public.crew_chat_rooms(id) on delete cascade,
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  created_at timestamptz not null default now(),
  check (char_length(trim(message)) between 1 and 1000)
);

create index if not exists crew_chat_messages_room_created_idx
on public.crew_chat_messages (room_id, created_at desc);

alter table public.crew_chat_rooms enable row level security;
alter table public.crew_chat_messages enable row level security;

drop policy if exists "crew_chat_rooms_read" on public.crew_chat_rooms;
drop policy if exists "crew_chat_rooms_insert" on public.crew_chat_rooms;
drop policy if exists "crew_chat_messages_read" on public.crew_chat_messages;
drop policy if exists "crew_chat_messages_insert" on public.crew_chat_messages;
drop policy if exists "crew_chat_messages_delete_own" on public.crew_chat_messages;

create policy "crew_chat_rooms_read"
on public.crew_chat_rooms
for select to authenticated
using (public.is_crew_member(crew_id));

create policy "crew_chat_rooms_insert"
on public.crew_chat_rooms
for insert to authenticated
with check (
  created_by = auth.uid()
  and public.is_crew_member(crew_id)
);

create policy "crew_chat_messages_read"
on public.crew_chat_messages
for select to authenticated
using (public.is_crew_member(crew_id));

create policy "crew_chat_messages_insert"
on public.crew_chat_messages
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
  and exists (
    select 1
    from public.crew_chat_rooms r
    where r.id = room_id
      and r.crew_id = crew_chat_messages.crew_id
  )
);

create policy "crew_chat_messages_delete_own"
on public.crew_chat_messages
for delete to authenticated
using (user_id = auth.uid());

create or replace function public.ensure_default_chat_room(
  p_crew_id uuid
)
returns public.crew_chat_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.crew_chat_rooms;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  insert into public.crew_chat_rooms (
    crew_id,
    name,
    created_by
  )
  values (
    p_crew_id,
    'Crew',
    auth.uid()
  )
  on conflict (crew_id, name)
  do nothing;

  select *
  into v_room
  from public.crew_chat_rooms
  where crew_id = p_crew_id
    and name = 'Crew'
  limit 1;

  return v_room;
end;
$$;

create or replace function public.create_crew_chat_room(
  p_crew_id uuid,
  p_name text
)
returns public.crew_chat_rooms
language plpgsql
security definer
set search_path = public
as $$
declare
  v_room public.crew_chat_rooms;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  if char_length(trim(coalesce(p_name, ''))) < 1 then
    raise exception 'Raumname fehlt';
  end if;

  insert into public.crew_chat_rooms (
    crew_id,
    name,
    created_by
  )
  values (
    p_crew_id,
    trim(p_name),
    auth.uid()
  )
  returning * into v_room;

  return v_room;

exception
  when unique_violation then
    raise exception 'Dieser Raum existiert bereits';
end;
$$;

create or replace function public.get_crew_chat_rooms(
  p_crew_id uuid
)
returns table (
  id uuid,
  name text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  perform public.ensure_default_chat_room(p_crew_id);

  return query
  select
    r.id,
    r.name,
    r.created_at
  from public.crew_chat_rooms r
  where r.crew_id = p_crew_id
  order by
    case when r.name = 'Crew' then 0 else 1 end,
    r.created_at asc;
end;
$$;

create or replace function public.send_crew_chat_message(
  p_room_id uuid,
  p_message text
)
returns public.crew_chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_crew_id uuid;
  v_message public.crew_chat_messages;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select crew_id
  into v_crew_id
  from public.crew_chat_rooms
  where id = p_room_id;

  if v_crew_id is null then
    raise exception 'Chat-Raum nicht gefunden';
  end if;

  if not public.is_crew_member(v_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  if char_length(trim(coalesce(p_message, ''))) < 1 then
    raise exception 'Nachricht ist leer';
  end if;

  insert into public.crew_chat_messages (
    room_id,
    crew_id,
    user_id,
    message
  )
  values (
    p_room_id,
    v_crew_id,
    auth.uid(),
    trim(p_message)
  )
  returning * into v_message;

  return v_message;
end;
$$;

create or replace function public.get_crew_chat_messages(
  p_room_id uuid,
  p_limit integer default 100
)
returns table (
  id bigint,
  user_id uuid,
  nickname text,
  message text,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_crew_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select crew_id
  into v_crew_id
  from public.crew_chat_rooms
  where id = p_room_id;

  if v_crew_id is null then
    raise exception 'Chat-Raum nicht gefunden';
  end if;

  if not public.is_crew_member(v_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  return query
  select
    m.id,
    m.user_id,
    coalesce(p.nickname, 'Rider')::text,
    m.message,
    m.created_at
  from public.crew_chat_messages m
  left join public.profiles p
    on p.id = m.user_id
  where m.room_id = p_room_id
  order by m.created_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 200);
end;
$$;

create or replace function public.delete_my_chat_message(
  p_message_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  delete from public.crew_chat_messages
  where id = p_message_id
    and user_id = auth.uid();

  return found;
end;
$$;

revoke all on function public.ensure_default_chat_room(uuid) from public;
revoke all on function public.create_crew_chat_room(uuid, text) from public;
revoke all on function public.get_crew_chat_rooms(uuid) from public;
revoke all on function public.send_crew_chat_message(uuid, text) from public;
revoke all on function public.get_crew_chat_messages(uuid, integer) from public;
revoke all on function public.delete_my_chat_message(bigint) from public;

grant execute on function public.ensure_default_chat_room(uuid) to authenticated;
grant execute on function public.create_crew_chat_room(uuid, text) to authenticated;
grant execute on function public.get_crew_chat_rooms(uuid) to authenticated;
grant execute on function public.send_crew_chat_message(uuid, text) to authenticated;
grant execute on function public.get_crew_chat_messages(uuid, integer) to authenticated;
grant execute on function public.delete_my_chat_message(bigint) to authenticated;
