-- AFTER[DARK] – Wer ist gerade draußen?
create table if not exists public.crew_presence (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  spot text not null check (char_length(trim(spot)) between 1 and 120),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '3 hours'),
  primary key (crew_id, user_id)
);
create index if not exists crew_presence_expires_idx on public.crew_presence(expires_at);
alter table public.crew_presence enable row level security;

drop policy if exists "presence_read_crew" on public.crew_presence;
drop policy if exists "presence_insert_self" on public.crew_presence;
drop policy if exists "presence_update_self" on public.crew_presence;
drop policy if exists "presence_delete_self" on public.crew_presence;

create policy "presence_read_crew" on public.crew_presence for select to authenticated using (public.is_crew_member(crew_id));
create policy "presence_insert_self" on public.crew_presence for insert to authenticated with check (user_id = auth.uid() and public.is_crew_member(crew_id));
create policy "presence_update_self" on public.crew_presence for update to authenticated using (user_id = auth.uid() and public.is_crew_member(crew_id)) with check (user_id = auth.uid() and public.is_crew_member(crew_id));
create policy "presence_delete_self" on public.crew_presence for delete to authenticated using (user_id = auth.uid() and public.is_crew_member(crew_id));

create or replace function public.set_my_spot(p_crew_id uuid, p_spot text)
returns public.crew_presence language plpgsql security definer set search_path = public as $$
declare result public.crew_presence;
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if not public.is_crew_member(p_crew_id) then raise exception 'Du bist kein Mitglied dieser Crew'; end if;
  if char_length(trim(p_spot)) < 1 then raise exception 'Bitte einen Spot eingeben'; end if;
  if char_length(trim(p_spot)) > 120 then raise exception 'Spot ist zu lang'; end if;
  insert into public.crew_presence (crew_id,user_id,spot,updated_at,expires_at)
  values (p_crew_id,auth.uid(),trim(p_spot),now(),now()+interval '3 hours')
  on conflict (crew_id,user_id) do update set spot=excluded.spot,updated_at=now(),expires_at=now()+interval '3 hours'
  returning * into result;
  return result;
end; $$;

create or replace function public.clear_my_spot(p_crew_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  delete from public.crew_presence where crew_id=p_crew_id and user_id=auth.uid();
end; $$;

create or replace function public.get_active_crew_spots(p_crew_id uuid)
returns table(user_id uuid,nickname text,spot text,updated_at timestamptz,expires_at timestamptz)
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'Nicht angemeldet'; end if;
  if not public.is_crew_member(p_crew_id) then raise exception 'Du bist kein Mitglied dieser Crew'; end if;
  return query select cp.user_id,coalesce(p.nickname,'Rider'),cp.spot,cp.updated_at,cp.expires_at
  from public.crew_presence cp left join public.profiles p on p.id=cp.user_id
  where cp.crew_id=p_crew_id and cp.expires_at>now() order by cp.updated_at desc;
end; $$;

revoke all on function public.set_my_spot(uuid,text) from public;
revoke all on function public.clear_my_spot(uuid) from public;
revoke all on function public.get_active_crew_spots(uuid) from public;
grant execute on function public.set_my_spot(uuid,text) to authenticated;
grant execute on function public.clear_my_spot(uuid) to authenticated;
grant execute on function public.get_active_crew_spots(uuid) to authenticated;
