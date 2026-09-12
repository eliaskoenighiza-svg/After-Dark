-- ============================================================
-- AFTER[DARK] - 08 Memories
-- Private + Crew-Bilder, Likes und Daily Crown
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'memories',
  'memories',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ]
)
on conflict (id)
do update set
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = array[
    'image/jpeg',
    'image/png',
    'image/webp'
  ];

create table if not exists public.memories (
  id uuid primary key default gen_random_uuid(),
  scope text not null check (scope in ('private', 'crew')),
  crew_id uuid references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null unique,
  day date not null default current_date,
  created_at timestamptz not null default now(),
  check (
    (scope = 'private' and crew_id is null)
    or
    (scope = 'crew' and crew_id is not null)
  )
);

create index if not exists memories_user_created_idx
on public.memories (user_id, created_at desc);

create index if not exists memories_crew_created_idx
on public.memories (crew_id, created_at desc);

create table if not exists public.memory_likes (
  memory_id uuid not null references public.memories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (memory_id, user_id)
);

alter table public.memories enable row level security;
alter table public.memory_likes enable row level security;

drop policy if exists "memories_read" on public.memories;
drop policy if exists "memories_insert" on public.memories;
drop policy if exists "memories_delete_own" on public.memories;

create policy "memories_read"
on public.memories
for select to authenticated
using (
  (scope = 'private' and user_id = auth.uid())
  or
  (
    scope = 'crew'
    and crew_id is not null
    and public.is_crew_member(crew_id)
  )
);

create policy "memories_insert"
on public.memories
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    (scope = 'private' and crew_id is null)
    or
    (
      scope = 'crew'
      and crew_id is not null
      and public.is_crew_member(crew_id)
    )
  )
);

create policy "memories_delete_own"
on public.memories
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "memory_likes_read" on public.memory_likes;
drop policy if exists "memory_likes_insert" on public.memory_likes;
drop policy if exists "memory_likes_delete_own" on public.memory_likes;

create policy "memory_likes_read"
on public.memory_likes
for select to authenticated
using (
  exists (
    select 1
    from public.memories m
    where m.id = memory_likes.memory_id
      and (
        (m.scope = 'private' and m.user_id = auth.uid())
        or
        (
          m.scope = 'crew'
          and m.crew_id is not null
          and public.is_crew_member(m.crew_id)
        )
      )
  )
);

create policy "memory_likes_insert"
on public.memory_likes
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.memories m
    where m.id = memory_likes.memory_id
      and m.scope = 'crew'
      and m.crew_id is not null
      and public.is_crew_member(m.crew_id)
  )
);

create policy "memory_likes_delete_own"
on public.memory_likes
for delete to authenticated
using (user_id = auth.uid());

drop policy if exists "memories_storage_read" on storage.objects;
drop policy if exists "memories_storage_insert" on storage.objects;
drop policy if exists "memories_storage_delete" on storage.objects;

create policy "memories_storage_read"
on storage.objects
for select to authenticated
using (
  bucket_id = 'memories'
  and (
    (
      (storage.foldername(name))[1] = 'private'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or
    (
      (storage.foldername(name))[1] = 'crew'
      and exists (
        select 1
        from public.crews c
        where c.id::text = (storage.foldername(name))[2]
          and public.is_crew_member(c.id)
      )
    )
  )
);

create policy "memories_storage_insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'memories'
  and (
    (
      (storage.foldername(name))[1] = 'private'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or
    (
      (storage.foldername(name))[1] = 'crew'
      and (storage.foldername(name))[3] = auth.uid()::text
      and exists (
        select 1
        from public.crews c
        where c.id::text = (storage.foldername(name))[2]
          and public.is_crew_member(c.id)
      )
    )
  )
);

create policy "memories_storage_delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'memories'
  and (
    (
      (storage.foldername(name))[1] = 'private'
      and (storage.foldername(name))[2] = auth.uid()::text
    )
    or
    (
      (storage.foldername(name))[1] = 'crew'
      and (storage.foldername(name))[3] = auth.uid()::text
    )
  )
);

create or replace function public.add_memory(
  p_scope text,
  p_crew_id uuid,
  p_object_path text
)
returns public.memories
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope text;
  v_expected_prefix text;
  v_result public.memories;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  v_scope := lower(trim(coalesce(p_scope, '')));

  if v_scope not in ('private', 'crew') then
    raise exception 'Ungueltiger Memory-Typ';
  end if;

  if v_scope = 'private' then
    v_expected_prefix :=
      'private/' || auth.uid()::text || '/';

    if p_object_path is null
       or p_object_path not like v_expected_prefix || '%' then
      raise exception 'Ungueltiger privater Datei-Pfad';
    end if;

    insert into public.memories (
      scope,
      crew_id,
      user_id,
      object_path
    )
    values (
      'private',
      null,
      auth.uid(),
      p_object_path
    )
    returning * into v_result;

    return v_result;
  end if;

  if p_crew_id is null then
    raise exception 'Crew fehlt';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  v_expected_prefix :=
    'crew/' || p_crew_id::text || '/' || auth.uid()::text || '/';

  if p_object_path is null
     or p_object_path not like v_expected_prefix || '%' then
    raise exception 'Ungueltiger Crew-Datei-Pfad';
  end if;

  insert into public.memories (
    scope,
    crew_id,
    user_id,
    object_path
  )
  values (
    'crew',
    p_crew_id,
    auth.uid(),
    p_object_path
  )
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.get_memories(
  p_scope text,
  p_crew_id uuid,
  p_limit integer default 50
)
returns table (
  id uuid,
  user_id uuid,
  nickname text,
  object_path text,
  memory_scope text,
  memory_day date,
  created_at timestamptz,
  likes bigint,
  liked_by_me boolean,
  daily_crown boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope text;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  v_scope := lower(trim(coalesce(p_scope, '')));

  if v_scope not in ('private', 'crew') then
    raise exception 'Ungueltiger Memory-Typ';
  end if;

  if v_scope = 'crew' then
    if p_crew_id is null then
      raise exception 'Crew fehlt';
    end if;

    if not public.is_crew_member(p_crew_id) then
      raise exception 'Du bist kein Mitglied dieser Crew';
    end if;
  end if;

  return query
  select
    m.id,
    m.user_id,
    coalesce(p.nickname, 'Rider')::text,
    m.object_path,
    m.scope,
    m.day,
    m.created_at,
    (
      select count(*)
      from public.memory_likes ml
      where ml.memory_id = m.id
    )::bigint,
    exists (
      select 1
      from public.memory_likes ml2
      where ml2.memory_id = m.id
        and ml2.user_id = auth.uid()
    ),
    (
      m.scope = 'crew'
      and m.day = current_date
      and m.id = (
        select m2.id
        from public.memories m2
        where m2.scope = 'crew'
          and m2.crew_id = p_crew_id
          and m2.day = current_date
        order by
          (
            select count(*)
            from public.memory_likes ml3
            where ml3.memory_id = m2.id
          ) desc,
          m2.created_at asc
        limit 1
      )
    )
  from public.memories m
  left join public.profiles p
    on p.id = m.user_id
  where
    (
      v_scope = 'private'
      and m.scope = 'private'
      and m.user_id = auth.uid()
    )
    or
    (
      v_scope = 'crew'
      and m.scope = 'crew'
      and m.crew_id = p_crew_id
    )
  order by m.created_at desc
  limit least(
    greatest(coalesce(p_limit, 50), 1),
    100
  );
end;
$$;

create or replace function public.toggle_memory_like(
  p_memory_id uuid
)
returns boolean
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

  select m.crew_id
  into v_crew_id
  from public.memories m
  where m.id = p_memory_id
    and m.scope = 'crew';

  if v_crew_id is null then
    raise exception 'Crew-Memory nicht gefunden';
  end if;

  if not public.is_crew_member(v_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  if exists (
    select 1
    from public.memory_likes ml
    where ml.memory_id = p_memory_id
      and ml.user_id = auth.uid()
  ) then
    delete from public.memory_likes
    where memory_id = p_memory_id
      and user_id = auth.uid();

    return false;
  end if;

  insert into public.memory_likes (
    memory_id,
    user_id
  )
  values (
    p_memory_id,
    auth.uid()
  );

  return true;
end;
$$;

create or replace function public.delete_my_memory(
  p_memory_id uuid
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  select m.object_path
  into v_path
  from public.memories m
  where m.id = p_memory_id
    and m.user_id = auth.uid();

  if v_path is null then
    raise exception 'Memory nicht gefunden oder nicht dein Memory';
  end if;

  delete from public.memories
  where id = p_memory_id
    and user_id = auth.uid();

  return v_path;
end;
$$;

revoke all on function public.add_memory(text, uuid, text) from public;
revoke all on function public.get_memories(text, uuid, integer) from public;
revoke all on function public.toggle_memory_like(uuid) from public;
revoke all on function public.delete_my_memory(uuid) from public;

grant execute on function public.add_memory(text, uuid, text) to authenticated;
grant execute on function public.get_memories(text, uuid, integer) to authenticated;
grant execute on function public.toggle_memory_like(uuid) to authenticated;
grant execute on function public.delete_my_memory(uuid) to authenticated;
