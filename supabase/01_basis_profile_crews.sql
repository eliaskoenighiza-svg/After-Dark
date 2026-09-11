create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 2 and 24),
  created_at timestamptz not null default now()
);

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 40),
  join_code text not null unique,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.crew_members (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (crew_id, user_id)
);

create index if not exists crew_members_user_idx on public.crew_members(user_id);
create index if not exists crews_join_code_idx on public.crews(join_code);

create or replace function public.is_crew_member(p_crew_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.crew_members
    where crew_id = p_crew_id and user_id = auth.uid()
  );
$$;

create or replace function public.shares_crew(p_other_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1
    from public.crew_members a
    join public.crew_members b on a.crew_id = b.crew_id
    where a.user_id = auth.uid() and b.user_id = p_other_user_id
  );
$$;

create or replace function public.add_crew_owner()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.crew_members (crew_id, user_id, role)
  values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;

drop trigger if exists crew_add_owner_trigger on public.crews;
create trigger crew_add_owner_trigger
after insert on public.crews
for each row execute function public.add_crew_owner();

create or replace function public.create_crew(p_name text)
returns public.crews language plpgsql security definer set search_path = public as $$
declare
  new_crew public.crews;
  new_code text;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  loop
    new_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
    begin
      insert into public.crews (name, join_code, owner_id)
      values (trim(p_name), new_code, auth.uid())
      returning * into new_crew;
      exit;
    exception when unique_violation then
    end;
  end loop;
  return new_crew;
end;
$$;

create or replace function public.join_crew_by_code(p_code text)
returns public.crews language plpgsql security definer set search_path = public as $$
declare
  found_crew public.crews;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  select * into found_crew from public.crews
  where upper(join_code) = upper(trim(p_code));
  if not found then raise exception 'Crew-Code nicht gefunden'; end if;
  insert into public.crew_members (crew_id, user_id, role)
  values (found_crew.id, auth.uid(), 'member')
  on conflict (crew_id, user_id) do nothing;
  return found_crew;
end;
$$;

alter table public.profiles enable row level security;
alter table public.crews enable row level security;
alter table public.crew_members enable row level security;

drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_read_crew" on public.profiles;
drop policy if exists "crews_read_members" on public.crews;
drop policy if exists "crews_insert_self" on public.crews;
drop policy if exists "crews_update_owner" on public.crews;
drop policy if exists "crews_delete_owner" on public.crews;
drop policy if exists "crew_members_read_members" on public.crew_members;

create policy "profiles_insert_self" on public.profiles
for insert to authenticated with check (id = auth.uid());

create policy "profiles_update_self" on public.profiles
for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "profiles_read_crew" on public.profiles
for select to authenticated using (id = auth.uid() or public.shares_crew(id));

create policy "crews_read_members" on public.crews
for select to authenticated using (public.is_crew_member(id));

create policy "crews_insert_self" on public.crews
for insert to authenticated with check (owner_id = auth.uid());

create policy "crews_update_owner" on public.crews
for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());

create policy "crews_delete_owner" on public.crews
for delete to authenticated using (owner_id = auth.uid());

create policy "crew_members_read_members" on public.crew_members
for select to authenticated using (public.is_crew_member(crew_id));

revoke all on function public.create_crew(text) from public;
revoke all on function public.join_crew_by_code(text) from public;
grant execute on function public.create_crew(text) to authenticated;
grant execute on function public.join_crew_by_code(text) to authenticated;
