-- ============================================================
-- AFTER[DARK] - 06 Park-Spot-Fotos
-- Private Crew-Fotos ueber Supabase Storage
-- ============================================================

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'crew-spot-photos',
  'crew-spot-photos',
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

create table if not exists public.crew_spot_photos (
  id uuid primary key default gen_random_uuid(),
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  object_path text not null,
  sport_name text not null default 'Freestyle',
  created_at timestamptz not null default now(),
  unique (object_path)
);

create index if not exists crew_spot_photos_crew_created_idx
on public.crew_spot_photos (crew_id, created_at desc);

alter table public.crew_spot_photos enable row level security;

drop policy if exists "crew_spot_photos_read_crew" on public.crew_spot_photos;
drop policy if exists "crew_spot_photos_insert_self" on public.crew_spot_photos;
drop policy if exists "crew_spot_photos_delete_self" on public.crew_spot_photos;

create policy "crew_spot_photos_read_crew"
on public.crew_spot_photos
for select to authenticated
using (public.is_crew_member(crew_id));

create policy "crew_spot_photos_insert_self"
on public.crew_spot_photos
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
);

create policy "crew_spot_photos_delete_self"
on public.crew_spot_photos
for delete to authenticated
using (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
);

drop policy if exists "crew_spot_storage_read" on storage.objects;
drop policy if exists "crew_spot_storage_insert" on storage.objects;
drop policy if exists "crew_spot_storage_delete" on storage.objects;

create policy "crew_spot_storage_read"
on storage.objects
for select to authenticated
using (
  bucket_id = 'crew-spot-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and public.is_crew_member((storage.foldername(name))[1]::uuid)
);

create policy "crew_spot_storage_insert"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'crew-spot-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_crew_member((storage.foldername(name))[1]::uuid)
);

create policy "crew_spot_storage_delete"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'crew-spot-photos'
  and array_length(storage.foldername(name), 1) >= 2
  and (storage.foldername(name))[2] = auth.uid()::text
  and public.is_crew_member((storage.foldername(name))[1]::uuid)
);

create or replace function public.add_crew_spot_photo(
  p_crew_id uuid,
  p_object_path text,
  p_sport_name text
)
returns public.crew_spot_photos
language plpgsql
security definer
set search_path = public
as $$
declare
  v_result public.crew_spot_photos;
  v_expected_prefix text;
begin
  if auth.uid() is null then
    raise exception 'Nicht angemeldet';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Du bist kein Mitglied dieser Crew';
  end if;

  v_expected_prefix :=
    p_crew_id::text || '/' || auth.uid()::text || '/';

  if p_object_path is null
     or p_object_path not like v_expected_prefix || '%' then
    raise exception 'Ungueltiger Foto-Pfad';
  end if;

  insert into public.crew_spot_photos (
    crew_id,
    user_id,
    object_path,
    sport_name
  )
  values (
    p_crew_id,
    auth.uid(),
    p_object_path,
    coalesce(nullif(trim(p_sport_name), ''), 'Freestyle')
  )
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.get_crew_spot_photos(
  p_crew_id uuid
)
returns table (
  id uuid,
  user_id uuid,
  nickname text,
  object_path text,
  sport_name text,
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

  return query
  select
    csp.id,
    csp.user_id,
    coalesce(p.nickname, 'Rider')::text,
    csp.object_path,
    csp.sport_name,
    csp.created_at
  from public.crew_spot_photos csp
  left join public.profiles p on p.id = csp.user_id
  where csp.crew_id = p_crew_id
  order by csp.created_at desc
  limit 50;
end;
$$;

create or replace function public.delete_my_crew_spot_photo(
  p_photo_id uuid
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

  select object_path
  into v_path
  from public.crew_spot_photos
  where id = p_photo_id
    and user_id = auth.uid();

  if v_path is null then
    raise exception 'Foto nicht gefunden oder nicht dein Foto';
  end if;

  delete from public.crew_spot_photos
  where id = p_photo_id
    and user_id = auth.uid();

  return v_path;
end;
$$;

revoke all on function public.add_crew_spot_photo(uuid, text, text) from public;
revoke all on function public.get_crew_spot_photos(uuid) from public;
revoke all on function public.delete_my_crew_spot_photo(uuid) from public;

grant execute on function public.add_crew_spot_photo(uuid, text, text) to authenticated;
grant execute on function public.get_crew_spot_photos(uuid) to authenticated;
grant execute on function public.delete_my_crew_spot_photo(uuid) to authenticated;
