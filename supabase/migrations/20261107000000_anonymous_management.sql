-- Free tournaments without an account.
--
-- Anyone can create a tournament. Instead of a login, the creator receives a
-- secret admin link; only a SHA-256 hash of its token is stored here. An
-- account is only needed for Premium: the creator "claims" the tournament,
-- which sets owner_id, and from then on either the owner or the link can
-- manage it.
--
-- All writes are performed by the Next.js server with the service role after
-- checking the request (rate limit, honeypot, session). The browser can only
-- read public views and count page views.

------------------------------------------------------------------------------
-- 1. Columns
------------------------------------------------------------------------------

alter table public.tournaments
  add column if not exists admin_token_hash text,
  add column if not exists description text,
  add column if not exists is_listed boolean not null default true,
  add column if not exists creator_ip_hash text,
  add column if not exists updated_at timestamptz not null default now();

alter table public.tournaments drop constraint if exists tournaments_description_length;
alter table public.tournaments
  add constraint tournaments_description_length
  check (description is null or char_length(description) <= 600) not valid;

create index if not exists tournaments_creator_ip_idx
  on public.tournaments (creator_ip_hash, created_at desc)
  where creator_ip_hash is not null;
create index if not exists tournaments_owner_id_idx on public.tournaments (owner_id);

------------------------------------------------------------------------------
-- 2. Page views per day (sellable metric for organizers, input for Premium)
------------------------------------------------------------------------------

create table if not exists public.tournament_daily_views (
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  day date not null default current_date,
  views integer not null default 0,
  primary key (tournament_id, day)
);

alter table public.tournament_daily_views enable row level security;
revoke all on public.tournament_daily_views from anon, authenticated;

create or replace function public.record_tournament_view(p_tournament_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.tournament_daily_views (tournament_id, day, views)
  select id, current_date, 1
  from public.tournaments
  where id = p_tournament_id and status <> 'borrador'
  on conflict (tournament_id, day)
  do update set views = tournament_daily_views.views + 1;
$$;

revoke all on function public.record_tournament_view(uuid) from public;
grant execute on function public.record_tournament_view(uuid) to anon, authenticated, service_role;

------------------------------------------------------------------------------
-- 3. Authorization helper
------------------------------------------------------------------------------

create or replace function public._can_manage(
  p_tournament public.tournaments,
  p_actor uuid,
  p_token text
)
returns boolean
language sql
stable
set search_path = public
as $$
  select
    (p_actor is not null and p_tournament.owner_id = p_actor)
    or (
      p_token is not null
      and p_tournament.admin_token_hash is not null
      and p_tournament.admin_token_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex')
    );
$$;

revoke all on function public._can_manage(public.tournaments, uuid, text)
  from public, anon, authenticated;

-- Loads a tournament for update and checks access, raising stable codes.
create or replace function public._lock_managed_tournament(
  p_tournament_id uuid,
  p_actor uuid,
  p_token text
)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  select * into v_tournament
  from public.tournaments
  where id = p_tournament_id
  for update;

  if not found or not public._can_manage(v_tournament, p_actor, p_token) then
    raise exception 'tournament_not_found';
  end if;

  return v_tournament;
end;
$$;

revoke all on function public._lock_managed_tournament(uuid, uuid, text)
  from public, anon, authenticated;

------------------------------------------------------------------------------
-- 4. Replace the account-only functions
------------------------------------------------------------------------------

drop function if exists public.create_tournament(text, text, jsonb, jsonb);
drop function if exists public.create_tournament(text, text, text, text, jsonb, jsonb);
drop function if exists public.publish_tournament(uuid);
drop function if exists public.finish_tournament(uuid);
drop function if exists public.reopen_tournament(uuid);
drop function if exists public.delete_tournament(uuid);
drop function if exists public.record_match_result(uuid, integer, integer);

create or replace function public.create_tournament(
  p_name text,
  p_format text,
  p_sport text,
  p_location text,
  p_description text,
  p_participant_names jsonb,
  p_fixture jsonb,
  p_admin_token text,
  p_owner uuid default null,
  p_creator_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_id uuid;
  v_participant_count integer;
  v_bracket_size integer := 1;
  v_round_count integer := 0;
  v_round integer;
  v_item jsonb;
  v_round_number integer;
  v_position integer;
  v_competitor1 uuid;
  v_competitor2 uuid;
  v_location text := nullif(trim(coalesce(p_location, '')), '');
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  if p_admin_token is null or char_length(p_admin_token) < 32 then
    raise exception 'invalid_admin_token';
  end if;

  if p_creator_ip_hash is not null and (
    select count(*)
    from public.tournaments
    where creator_ip_hash = p_creator_ip_hash
      and created_at > now() - interval '1 day'
  ) >= 30 then
    raise exception 'rate_limited';
  end if;

  if p_name is null or char_length(trim(p_name)) not between 3 and 120 then
    raise exception 'invalid_name';
  end if;

  if p_format not in ('Americano', 'Eliminatoria') then
    raise exception 'invalid_format';
  end if;

  if p_sport not in ('Fútbol', 'Pádel', 'Tenis', 'Básquet', 'Vóley', 'Ping pong',
                     'eSports', 'Truco', 'Ajedrez', 'Otro') then
    raise exception 'invalid_sport';
  end if;

  if v_location is not null and char_length(v_location) > 120 then
    raise exception 'invalid_location';
  end if;

  if v_description is not null and char_length(v_description) > 600 then
    raise exception 'invalid_description';
  end if;

  if jsonb_typeof(p_participant_names) <> 'array'
    or jsonb_array_length(p_participant_names) not between 2 and 128 then
    raise exception 'invalid_participant_count';
  end if;

  v_participant_count := jsonb_array_length(p_participant_names);

  if exists (
    select 1
    from jsonb_array_elements(p_participant_names) as names(value)
    where jsonb_typeof(value) <> 'string'
      or char_length(trim(value #>> '{}')) not between 1 and 60
  ) then
    raise exception 'invalid_participant_name';
  end if;

  if (
    select count(distinct lower(trim(value #>> '{}')))
    from jsonb_array_elements(p_participant_names) as names(value)
  ) <> v_participant_count then
    raise exception 'duplicate_participants';
  end if;

  if jsonb_typeof(p_fixture) <> 'array' or jsonb_array_length(p_fixture) = 0 then
    raise exception 'invalid_fixture';
  end if;

  insert into public.tournaments (
    name, format, sport, location, description, status, published_at,
    owner_id, admin_token_hash, creator_ip_hash
  )
  values (
    trim(p_name), p_format, p_sport, v_location, v_description, 'activo', now(),
    p_owner, encode(sha256(convert_to(p_admin_token, 'UTF8')), 'hex'), p_creator_ip_hash
  )
  returning id into v_tournament_id;

  insert into public.competitors (tournament_id, name)
  select v_tournament_id, trim(value #>> '{}')
  from jsonb_array_elements(p_participant_names) as names(value);

  if p_format = 'Eliminatoria' then
    while v_bracket_size < v_participant_count loop
      v_bracket_size := v_bracket_size * 2;
      v_round_count := v_round_count + 1;
    end loop;

    if jsonb_array_length(p_fixture) <> v_bracket_size / 2 then
      raise exception 'invalid_fixture';
    end if;
  end if;

  for v_item in select value from jsonb_array_elements(p_fixture)
  loop
    v_round_number := (v_item->>'round_number')::integer;
    v_position := (v_item->>'position')::integer;

    if v_round_number is null or v_round_number < 1
      or v_position is null or v_position < 0
      or (p_format = 'Eliminatoria' and (v_round_number <> 1 or v_position >= v_bracket_size / 2)) then
      raise exception 'invalid_fixture';
    end if;

    select id into v_competitor1
    from public.competitors
    where tournament_id = v_tournament_id
      and name = v_item->>'competitor1_name';

    v_competitor2 := null;
    if v_item->>'competitor2_name' is not null then
      select id into v_competitor2
      from public.competitors
      where tournament_id = v_tournament_id
        and name = v_item->>'competitor2_name';

      if v_competitor2 is null then
        raise exception 'invalid_fixture';
      end if;
    end if;

    if v_competitor1 is null
      or v_competitor1 = v_competitor2
      or (p_format = 'Americano' and v_competitor2 is null) then
      raise exception 'invalid_fixture';
    end if;

    insert into public.matches (
      tournament_id, round_number, position,
      competitor1_id, competitor2_id, status, winner_id
    )
    values (
      v_tournament_id, v_round_number, v_position,
      v_competitor1, v_competitor2,
      case when v_competitor2 is null then 'bye' else 'pendiente' end,
      case when v_competitor2 is null then v_competitor1 end
    );
  end loop;

  if exists (
    select 1
    from (
      select round_number, competitor1_id as competitor_id
      from public.matches where tournament_id = v_tournament_id
      union all
      select round_number, competitor2_id
      from public.matches where tournament_id = v_tournament_id and competitor2_id is not null
    ) appearances
    group by round_number, competitor_id
    having count(*) > 1
  ) then
    raise exception 'invalid_fixture';
  end if;

  if p_format = 'Americano' then
    if exists (
      select 1
      from public.matches
      where tournament_id = v_tournament_id
      group by least(competitor1_id, competitor2_id), greatest(competitor1_id, competitor2_id)
      having count(*) > 1
    ) then
      raise exception 'invalid_fixture';
    end if;
  else
    if (
      select count(*)
      from (
        select competitor1_id from public.matches
        where tournament_id = v_tournament_id
        union all
        select competitor2_id from public.matches
        where tournament_id = v_tournament_id and competitor2_id is not null
      ) entrants
    ) <> v_participant_count then
      raise exception 'invalid_fixture';
    end if;

    for v_round in 2..v_round_count loop
      insert into public.matches (tournament_id, round_number, position, status)
      select v_tournament_id, v_round, slot, 'pendiente'
      from generate_series(0, (v_bracket_size >> v_round) - 1) as slot;
    end loop;

    for v_item in
      select jsonb_build_object('position', position, 'winner_id', winner_id)
      from public.matches
      where tournament_id = v_tournament_id
        and round_number = 1
        and status = 'bye'
      order by position
    loop
      perform public._place_in_next_match(
        v_tournament_id, 1, (v_item->>'position')::integer, (v_item->>'winner_id')::uuid
      );
    end loop;
  end if;

  return v_tournament_id;
end;
$$;

create or replace function public.record_match_result(
  p_match_id uuid,
  p_score1 integer,
  p_score2 integer,
  p_actor uuid,
  p_token text
)
returns public.matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches;
  v_tournament public.tournaments;
  v_next public.matches;
  v_winner uuid;
begin
  if p_score1 is null or p_score2 is null
    or p_score1 not between 0 and 999
    or p_score2 not between 0 and 999 then
    raise exception 'invalid_score';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'match_not_found';
  end if;

  v_tournament := public._lock_managed_tournament(v_match.tournament_id, p_actor, p_token);

  if v_tournament.status <> 'activo' then
    raise exception 'tournament_not_active';
  end if;

  if v_match.status = 'bye'
    or v_match.competitor1_id is null
    or v_match.competitor2_id is null then
    raise exception 'match_not_ready';
  end if;

  if p_score1 = p_score2 then
    if v_tournament.format = 'Eliminatoria' then
      raise exception 'draw_not_allowed';
    end if;
    v_winner := null;
  elsif p_score1 > p_score2 then
    v_winner := v_match.competitor1_id;
  else
    v_winner := v_match.competitor2_id;
  end if;

  if v_tournament.format = 'Eliminatoria' then
    select * into v_next
    from public.matches
    where tournament_id = v_tournament.id
      and round_number = v_match.round_number + 1
      and position = v_match.position / 2
    for update;

    if found then
      if v_next.status = 'finalizado' and v_match.winner_id is distinct from v_winner then
        raise exception 'next_match_already_played';
      end if;

      perform public._place_in_next_match(
        v_tournament.id, v_match.round_number, v_match.position, v_winner
      );
    end if;
  end if;

  update public.matches
  set score1 = p_score1,
      score2 = p_score2,
      status = 'finalizado',
      winner_id = v_winner,
      updated_at = now()
  where id = p_match_id
  returning * into v_match;

  update public.tournaments set updated_at = now() where id = v_tournament.id;

  return v_match;
end;
$$;

create or replace function public.publish_tournament(p_tournament_id uuid, p_actor uuid, p_token text)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  v_tournament := public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  if v_tournament.status <> 'borrador' then
    raise exception 'tournament_already_published';
  end if;

  update public.tournaments
  set status = 'activo', published_at = now(), updated_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

create or replace function public.finish_tournament(p_tournament_id uuid, p_actor uuid, p_token text)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  v_tournament := public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  if v_tournament.status <> 'activo' then
    raise exception 'tournament_not_active';
  end if;

  if exists (
    select 1 from public.matches
    where tournament_id = p_tournament_id and status = 'pendiente'
  ) then
    raise exception 'matches_pending';
  end if;

  update public.tournaments
  set status = 'finalizado', finished_at = now(), updated_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

create or replace function public.reopen_tournament(p_tournament_id uuid, p_actor uuid, p_token text)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  v_tournament := public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  if v_tournament.status <> 'finalizado' then
    raise exception 'tournament_not_finished';
  end if;

  update public.tournaments
  set status = 'activo', finished_at = null, updated_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

create or replace function public.update_tournament_details(
  p_tournament_id uuid,
  p_actor uuid,
  p_token text,
  p_name text,
  p_location text,
  p_description text,
  p_is_listed boolean
)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
  v_location text := nullif(trim(coalesce(p_location, '')), '');
  v_description text := nullif(trim(coalesce(p_description, '')), '');
begin
  v_tournament := public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  if p_name is null or char_length(trim(p_name)) not between 3 and 120 then
    raise exception 'invalid_name';
  end if;
  if v_location is not null and char_length(v_location) > 120 then
    raise exception 'invalid_location';
  end if;
  if v_description is not null and char_length(v_description) > 600 then
    raise exception 'invalid_description';
  end if;

  update public.tournaments
  set name = trim(p_name),
      location = v_location,
      description = v_description,
      is_listed = coalesce(p_is_listed, true),
      updated_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

create or replace function public.delete_tournament(p_tournament_id uuid, p_actor uuid, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  delete from public.tournament_daily_views where tournament_id = p_tournament_id;
  delete from public.matches where tournament_id = p_tournament_id;
  delete from public.competitors where tournament_id = p_tournament_id;
  delete from public.tournaments where id = p_tournament_id;
end;
$$;

-- Links a tournament created anonymously to the signed-in account.
create or replace function public.claim_tournament(p_tournament_id uuid, p_actor uuid, p_token text)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  if p_actor is null then
    raise exception 'auth_required';
  end if;

  v_tournament := public._lock_managed_tournament(p_tournament_id, p_actor, p_token);

  if v_tournament.owner_id is not null and v_tournament.owner_id <> p_actor then
    raise exception 'already_claimed';
  end if;

  update public.tournaments
  set owner_id = p_actor, updated_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

do $$
declare
  v_signature text;
begin
  foreach v_signature in array array[
    'public.create_tournament(text, text, text, text, text, jsonb, jsonb, text, uuid, text)',
    'public.record_match_result(uuid, integer, integer, uuid, text)',
    'public.publish_tournament(uuid, uuid, text)',
    'public.finish_tournament(uuid, uuid, text)',
    'public.reopen_tournament(uuid, uuid, text)',
    'public.update_tournament_details(uuid, uuid, text, text, text, text, boolean)',
    'public.delete_tournament(uuid, uuid, text)',
    'public.claim_tournament(uuid, uuid, text)'
  ]
  loop
    execute format('revoke all on function %s from public, anon, authenticated', v_signature);
    execute format('grant execute on function %s to service_role', v_signature);
  end loop;
end;
$$;

------------------------------------------------------------------------------
-- 5. Public read model (adds description, listing flag and total views)
------------------------------------------------------------------------------

drop view if exists public.public_tournaments;

create view public.public_tournaments
with (security_invoker = false)
as
select
  t.id,
  t.name,
  t.format,
  t.sport,
  t.location,
  t.description,
  t.status,
  t.is_premium,
  t.is_listed,
  t.created_at,
  t.published_at,
  t.finished_at,
  t.updated_at,
  (select count(*) from public.competitors c where c.tournament_id = t.id)::integer
    as participant_count,
  (select count(*) from public.matches m
    where m.tournament_id = t.id and m.status = 'finalizado')::integer
    as played_count,
  (select count(*) from public.matches m
    where m.tournament_id = t.id and m.status <> 'bye')::integer
    as match_count,
  coalesce((select sum(v.views) from public.tournament_daily_views v
    where v.tournament_id = t.id), 0)::integer
    as view_count
from public.tournaments t
where t.status <> 'borrador';

grant select on public.public_tournaments to anon, authenticated;

------------------------------------------------------------------------------
-- 6. Migration bookkeeping table used by scripts/db-migrate.mjs
------------------------------------------------------------------------------

create table if not exists public.app_migrations (
  name text primary key,
  applied_at timestamptz not null default now()
);
alter table public.app_migrations enable row level security;
revoke all on public.app_migrations from anon, authenticated;
