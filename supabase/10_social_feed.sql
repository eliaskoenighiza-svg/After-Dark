-- After[Dark V16 – Social Feed, Stories, Likes, Kommentare, Reports, Blocks
-- Voraussetzung: 01_basis_profile_crews.sql wurde bereits ausgeführt.

create extension if not exists pgcrypto;

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'post' check (kind in ('post', 'story')),
  media_type text not null check (media_type in ('image', 'video')),
  object_path text not null,
  caption text not null default '' check (char_length(caption) <= 600),
  sport_id text,
  trick_name text check (trick_name is null or char_length(trick_name) <= 80),
  spot_name text check (spot_name is null or char_length(spot_name) <= 120),
  spot_lat double precision,
  spot_lon double precision,
  visibility text not null default 'crew' check (visibility in ('crew', 'public')),
  crew_id uuid references public.crews(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  constraint social_crew_visibility check (
    (visibility = 'public' and crew_id is null)
    or (visibility = 'crew' and crew_id is not null)
  ),
  constraint social_story_expiry check (
    (kind = 'post' and expires_at is null)
    or (kind = 'story' and expires_at is not null)
  )
);

create index if not exists social_posts_feed_idx on public.social_posts(kind, created_at desc);
create index if not exists social_posts_user_idx on public.social_posts(user_id, created_at desc);
create index if not exists social_posts_crew_idx on public.social_posts(crew_id, created_at desc);

create table if not exists public.social_likes (
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.social_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists social_comments_post_idx on public.social_comments(post_id, created_at asc);

create table if not exists public.social_reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.social_posts(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default 'Gemeldet' check (char_length(reason) between 1 and 300),
  created_at timestamptz not null default now(),
  unique(post_id, reporter_id)
);

create table if not exists public.social_blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

create or replace function public.can_view_social_post(p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.social_posts p
    where p.id = p_post_id
      and auth.uid() is not null
      and (p.kind <> 'story' or p.expires_at > now())
      and not exists (
        select 1 from public.social_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
           or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
      )
      and (
        p.user_id = auth.uid()
        or p.visibility = 'public'
        or (p.visibility = 'crew' and public.is_crew_member(p.crew_id))
      )
  );
$$;

create or replace function public.get_social_feed(p_kind text default 'post', p_limit integer default 20)
returns table (
  post_id uuid,
  user_id uuid,
  nickname text,
  kind text,
  media_type text,
  object_path text,
  caption text,
  sport_id text,
  trick_name text,
  spot_name text,
  spot_lat double precision,
  spot_lon double precision,
  visibility text,
  crew_id uuid,
  created_at timestamptz,
  expires_at timestamptz,
  like_count bigint,
  comment_count bigint,
  liked_by_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id as post_id,
    p.user_id,
    coalesce(pr.nickname, 'Rider') as nickname,
    p.kind,
    p.media_type,
    p.object_path,
    p.caption,
    p.sport_id,
    p.trick_name,
    p.spot_name,
    p.spot_lat,
    p.spot_lon,
    p.visibility,
    p.crew_id,
    p.created_at,
    p.expires_at,
    (select count(*) from public.social_likes l where l.post_id = p.id) as like_count,
    (select count(*) from public.social_comments c where c.post_id = p.id) as comment_count,
    exists (
      select 1 from public.social_likes l
      where l.post_id = p.id and l.user_id = auth.uid()
    ) as liked_by_me
  from public.social_posts p
  left join public.profiles pr on pr.id = p.user_id
  where auth.uid() is not null
    and p.kind = case when p_kind = 'story' then 'story' else 'post' end
    and (p.kind <> 'story' or p.expires_at > now())
    and not exists (
      select 1 from public.social_blocks b
      where (b.blocker_id = auth.uid() and b.blocked_id = p.user_id)
         or (b.blocker_id = p.user_id and b.blocked_id = auth.uid())
    )
    and (
      p.user_id = auth.uid()
      or p.visibility = 'public'
      or (p.visibility = 'crew' and public.is_crew_member(p.crew_id))
    )
  order by p.created_at desc
  limit least(50, greatest(1, coalesce(p_limit, 20)));
$$;

create or replace function public.toggle_social_like(p_post_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if not public.can_view_social_post(p_post_id) then raise exception 'Beitrag nicht verfügbar'; end if;

  if exists (select 1 from public.social_likes where post_id = p_post_id and user_id = auth.uid()) then
    delete from public.social_likes where post_id = p_post_id and user_id = auth.uid();
    return false;
  end if;

  insert into public.social_likes(post_id, user_id) values (p_post_id, auth.uid());
  return true;
end;
$$;

create or replace function public.get_social_comments(p_post_id uuid, p_limit integer default 80)
returns table (
  comment_id uuid,
  post_id uuid,
  user_id uuid,
  nickname text,
  body text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.can_view_social_post(p_post_id) then raise exception 'Beitrag nicht verfügbar'; end if;
  return query
    select c.id, c.post_id, c.user_id, coalesce(p.nickname, 'Rider'), c.body, c.created_at
    from public.social_comments c
    left join public.profiles p on p.id = c.user_id
    where c.post_id = p_post_id
      and not exists (
        select 1 from public.social_blocks b
        where (b.blocker_id = auth.uid() and b.blocked_id = c.user_id)
           or (b.blocker_id = c.user_id and b.blocked_id = auth.uid())
      )
    order by c.created_at asc
    limit least(100, greatest(1, coalesce(p_limit, 80)));
end;
$$;

create or replace function public.add_social_comment(p_post_id uuid, p_body text)
returns public.social_comments
language plpgsql
security definer
set search_path = public
as $$
declare
  row_out public.social_comments;
  clean text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if not public.can_view_social_post(p_post_id) then raise exception 'Beitrag nicht verfügbar'; end if;
  clean := trim(coalesce(p_body, ''));
  if char_length(clean) < 1 or char_length(clean) > 500 then raise exception 'Kommentar muss 1 bis 500 Zeichen haben'; end if;
  insert into public.social_comments(post_id, user_id, body)
  values (p_post_id, auth.uid(), clean)
  returning * into row_out;
  return row_out;
end;
$$;

create or replace function public.report_social_post(p_post_id uuid, p_reason text default 'Gemeldet')
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  report_id uuid;
  clean text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if not public.can_view_social_post(p_post_id) then raise exception 'Beitrag nicht verfügbar'; end if;
  clean := left(coalesce(nullif(trim(p_reason), ''), 'Gemeldet'), 300);
  insert into public.social_reports(post_id, reporter_id, reason)
  values (p_post_id, auth.uid(), clean)
  on conflict (post_id, reporter_id) do update set reason = excluded.reason, created_at = now()
  returning id into report_id;
  return report_id;
end;
$$;

create or replace function public.block_social_user(p_blocked_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if p_blocked_id is null or p_blocked_id = auth.uid() then raise exception 'Ungültiger Nutzer'; end if;
  insert into public.social_blocks(blocker_id, blocked_id)
  values (auth.uid(), p_blocked_id)
  on conflict (blocker_id, blocked_id) do nothing;
  return true;
end;
$$;

create or replace function public.delete_my_social_post(p_post_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  path_out text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  delete from public.social_posts
  where id = p_post_id and user_id = auth.uid()
  returning object_path into path_out;
  if path_out is null then raise exception 'Beitrag nicht gefunden'; end if;
  return path_out;
end;
$$;

alter table public.social_posts enable row level security;
alter table public.social_likes enable row level security;
alter table public.social_comments enable row level security;
alter table public.social_reports enable row level security;
alter table public.social_blocks enable row level security;

-- Posts: lesen nur wenn sichtbar, schreiben nur selbst.
drop policy if exists social_posts_read on public.social_posts;
create policy social_posts_read on public.social_posts
for select to authenticated
using (public.can_view_social_post(id));

drop policy if exists social_posts_insert on public.social_posts;
create policy social_posts_insert on public.social_posts
for insert to authenticated
with check (
  user_id = auth.uid()
  and (
    visibility = 'public'
    or (visibility = 'crew' and public.is_crew_member(crew_id))
  )
);

drop policy if exists social_posts_update on public.social_posts;
create policy social_posts_update on public.social_posts
for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists social_posts_delete on public.social_posts;
create policy social_posts_delete on public.social_posts
for delete to authenticated
using (user_id = auth.uid());

-- Likes.
drop policy if exists social_likes_read on public.social_likes;
create policy social_likes_read on public.social_likes
for select to authenticated using (public.can_view_social_post(post_id));

drop policy if exists social_likes_insert on public.social_likes;
create policy social_likes_insert on public.social_likes
for insert to authenticated with check (user_id = auth.uid() and public.can_view_social_post(post_id));

drop policy if exists social_likes_delete on public.social_likes;
create policy social_likes_delete on public.social_likes
for delete to authenticated using (user_id = auth.uid());

-- Kommentare.
drop policy if exists social_comments_read on public.social_comments;
create policy social_comments_read on public.social_comments
for select to authenticated using (public.can_view_social_post(post_id));

drop policy if exists social_comments_insert on public.social_comments;
create policy social_comments_insert on public.social_comments
for insert to authenticated with check (user_id = auth.uid() and public.can_view_social_post(post_id));

drop policy if exists social_comments_delete on public.social_comments;
create policy social_comments_delete on public.social_comments
for delete to authenticated using (user_id = auth.uid());

-- Reports sind nur für den Melder selbst sichtbar; später kann ein Admin-Dashboard mit Service Role darauf zugreifen.
drop policy if exists social_reports_insert on public.social_reports;
create policy social_reports_insert on public.social_reports
for insert to authenticated with check (reporter_id = auth.uid());

drop policy if exists social_reports_read_self on public.social_reports;
create policy social_reports_read_self on public.social_reports
for select to authenticated using (reporter_id = auth.uid());

-- Blocks nur selbst verwalten.
drop policy if exists social_blocks_self on public.social_blocks;
create policy social_blocks_self on public.social_blocks
for all to authenticated
using (blocker_id = auth.uid())
with check (blocker_id = auth.uid());

-- Private Storage-Bucket. Abruf erfolgt über kurzlebige Signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  false,
  83886080,
  array['image/jpeg','image/png','image/webp','video/mp4','video/quicktime']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage Policies.
drop policy if exists social_media_read on storage.objects;
create policy social_media_read on storage.objects
for select to authenticated
using (bucket_id = 'social-media');

drop policy if exists social_media_insert on storage.objects;
create policy social_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'social-media'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists social_media_update on storage.objects;
create policy social_media_update on storage.objects
for update to authenticated
using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text)
with check (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists social_media_delete on storage.objects;
create policy social_media_delete on storage.objects
for delete to authenticated
using (bucket_id = 'social-media' and (storage.foldername(name))[1] = auth.uid()::text);

revoke all on function public.can_view_social_post(uuid) from public;
revoke all on function public.get_social_feed(text, integer) from public;
revoke all on function public.toggle_social_like(uuid) from public;
revoke all on function public.get_social_comments(uuid, integer) from public;
revoke all on function public.add_social_comment(uuid, text) from public;
revoke all on function public.report_social_post(uuid, text) from public;
revoke all on function public.block_social_user(uuid) from public;
revoke all on function public.delete_my_social_post(uuid) from public;

grant execute on function public.can_view_social_post(uuid) to authenticated;
grant execute on function public.get_social_feed(text, integer) to authenticated;
grant execute on function public.toggle_social_like(uuid) to authenticated;
grant execute on function public.get_social_comments(uuid, integer) to authenticated;
grant execute on function public.add_social_comment(uuid, text) to authenticated;
grant execute on function public.report_social_post(uuid, text) to authenticated;
grant execute on function public.block_social_user(uuid) to authenticated;
grant execute on function public.delete_my_social_post(uuid) to authenticated;
