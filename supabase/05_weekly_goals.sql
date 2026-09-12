-- AFTER[DARK] - 05 weekly goals
-- One goal per crew member and week. Week starts on Monday.

create table if not exists public.weekly_goals (
  crew_id uuid not null references public.crews(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start date not null,
  goal_name text not null check (char_length(trim(goal_name)) between 1 and 120),
  sport_name text not null default 'Freestyle',
  done boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (crew_id, user_id, week_start)
);

create index if not exists weekly_goals_crew_week_idx
on public.weekly_goals (crew_id, week_start);

alter table public.weekly_goals enable row level security;

drop policy if exists "weekly_goals_read_crew" on public.weekly_goals;
drop policy if exists "weekly_goals_insert_self" on public.weekly_goals;
drop policy if exists "weekly_goals_update_self" on public.weekly_goals;
drop policy if exists "weekly_goals_delete_self" on public.weekly_goals;

create policy "weekly_goals_read_crew"
on public.weekly_goals
for select to authenticated
using (public.is_crew_member(crew_id));

create policy "weekly_goals_insert_self"
on public.weekly_goals
for insert to authenticated
with check (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
);

create policy "weekly_goals_update_self"
on public.weekly_goals
for update to authenticated
using (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
)
with check (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
);

create policy "weekly_goals_delete_self"
on public.weekly_goals
for delete to authenticated
using (
  user_id = auth.uid()
  and public.is_crew_member(crew_id)
);

create or replace function public.set_my_weekly_goal(
  p_crew_id uuid,
  p_goal_name text,
  p_sport_name text
)
returns public.weekly_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date;
  v_result public.weekly_goals;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Not a member of this crew';
  end if;

  if char_length(trim(coalesce(p_goal_name, ''))) < 1 then
    raise exception 'Goal is empty';
  end if;

  v_week_start :=
    current_date -
    (extract(isodow from current_date)::integer - 1);

  insert into public.weekly_goals (
    crew_id, user_id, week_start, goal_name, sport_name, done, updated_at
  )
  values (
    p_crew_id,
    auth.uid(),
    v_week_start,
    trim(p_goal_name),
    coalesce(nullif(trim(p_sport_name), ''), 'Freestyle'),
    false,
    now()
  )
  on conflict (crew_id, user_id, week_start)
  do update set
    goal_name = excluded.goal_name,
    sport_name = excluded.sport_name,
    done = false,
    updated_at = now()
  returning * into v_result;

  return v_result;
end;
$$;

create or replace function public.set_my_weekly_goal_done(
  p_crew_id uuid,
  p_done boolean
)
returns public.weekly_goals
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date;
  v_result public.weekly_goals;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Not a member of this crew';
  end if;

  v_week_start :=
    current_date -
    (extract(isodow from current_date)::integer - 1);

  update public.weekly_goals
  set
    done = coalesce(p_done, false),
    updated_at = now()
  where crew_id = p_crew_id
    and user_id = auth.uid()
    and week_start = v_week_start
  returning * into v_result;

  if not found then
    raise exception 'No goal exists for this week';
  end if;

  return v_result;
end;
$$;

create or replace function public.delete_my_weekly_goal(
  p_crew_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Not a member of this crew';
  end if;

  v_week_start :=
    current_date -
    (extract(isodow from current_date)::integer - 1);

  delete from public.weekly_goals
  where crew_id = p_crew_id
    and user_id = auth.uid()
    and week_start = v_week_start;

  return true;
end;
$$;

create or replace function public.get_weekly_goals(
  p_crew_id uuid
)
returns table (
  user_id uuid,
  nickname text,
  goal_name text,
  sport_name text,
  done boolean,
  updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_week_start date;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  if not public.is_crew_member(p_crew_id) then
    raise exception 'Not a member of this crew';
  end if;

  v_week_start :=
    current_date -
    (extract(isodow from current_date)::integer - 1);

  return query
  select
    wg.user_id,
    coalesce(p.nickname, 'Rider')::text,
    wg.goal_name,
    wg.sport_name,
    wg.done,
    wg.updated_at
  from public.weekly_goals wg
  left join public.profiles p on p.id = wg.user_id
  where wg.crew_id = p_crew_id
    and wg.week_start = v_week_start
  order by wg.done asc, wg.updated_at desc;
end;
$$;

revoke all on function public.set_my_weekly_goal(uuid, text, text) from public;
revoke all on function public.set_my_weekly_goal_done(uuid, boolean) from public;
revoke all on function public.delete_my_weekly_goal(uuid) from public;
revoke all on function public.get_weekly_goals(uuid) from public;

grant execute on function public.set_my_weekly_goal(uuid, text, text) to authenticated;
grant execute on function public.set_my_weekly_goal_done(uuid, boolean) to authenticated;
grant execute on function public.delete_my_weekly_goal(uuid) to authenticated;
grant execute on function public.get_weekly_goals(uuid) to authenticated;
