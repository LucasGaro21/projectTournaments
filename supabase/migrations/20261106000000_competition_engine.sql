-- Competition engine.
--
-- * Knockout brackets are created complete (every round) and winners advance
--   automatically, including first-round byes.
-- * Results, publishing, closing and deleting go through SECURITY DEFINER
--   functions that check ownership and tournament state. Authenticated users
--   no longer have direct INSERT/UPDATE/DELETE privileges, which closes the
--   hole where an owner could set is_premium = true from the browser.
-- * Tournaments gain sport/location metadata used by public discovery pages.
-- * Mercado Pago payments are recorded in a private ledger.
-- * The unused "magic link" mechanism is removed: public pages are already
--   readable without a token, so the token protected nothing.
--
-- Errors are raised with stable snake_case messages that the application maps
-- to user-facing text (see src/lib/tournament/errors.ts).

------------------------------------------------------------------------------
-- 1. Tournaments
------------------------------------------------------------------------------

alter table public.tournaments
  add column if not exists sport text not null default 'Otro',
  add column if not exists location text,
  add column if not exists published_at timestamptz,
  add column if not exists finished_at timestamptz,
  add column if not exists premium_activated_at timestamptz;

update public.tournaments
set published_at = coalesce(published_at, created_at)
where status <> 'borrador';

alter table public.tournaments drop constraint if exists tournaments_status_check;
alter table public.tournaments
  add constraint tournaments_status_check
  check (status in ('borrador', 'activo', 'finalizado')) not valid;

alter table public.tournaments drop constraint if exists tournaments_format_check;
alter table public.tournaments
  add constraint tournaments_format_check
  check (format in ('Americano', 'Eliminatoria')) not valid;

alter table public.tournaments drop constraint if exists tournaments_sport_check;
alter table public.tournaments
  add constraint tournaments_sport_check
  check (sport in ('Fútbol', 'Pádel', 'Tenis', 'Básquet', 'Vóley', 'Ping pong',
                   'eSports', 'Truco', 'Ajedrez', 'Otro')) not valid;

alter table public.tournaments drop constraint if exists tournaments_location_length;
alter table public.tournaments
  add constraint tournaments_location_length
  check (location is null or char_length(location) <= 120) not valid;

drop function if exists public.validate_magic_link(uuid, text);
alter table public.tournaments drop column if exists magic_link_token;

create index if not exists tournaments_public_listing_idx
  on public.tournaments (status, is_premium desc, published_at desc);

------------------------------------------------------------------------------
-- 2. Matches
------------------------------------------------------------------------------

alter table public.matches
  add column if not exists position integer,
  add column if not exists winner_id uuid references public.competitors(id) on delete set null,
  add column if not exists updated_at timestamptz not null default now();

alter table public.matches alter column competitor1_id drop not null;

with numbered as (
  select
    id,
    row_number() over (partition by tournament_id, round_number order by id) - 1 as pos
  from public.matches
  where position is null
)
update public.matches
set position = numbered.pos
from numbered
where matches.id = numbered.id;

alter table public.matches alter column position set not null;

-- Legacy single-competitor rows were byes stored as pending matches.
update public.matches
set status = 'bye', winner_id = competitor1_id
where competitor2_id is null
  and competitor1_id is not null
  and status = 'pendiente';

update public.matches
set winner_id = case
  when score1 > score2 then competitor1_id
  when score2 > score1 then competitor2_id
end
where status = 'finalizado' and winner_id is null;

alter table public.matches drop constraint if exists matches_status_check;
alter table public.matches
  add constraint matches_status_check
  check (status in ('pendiente', 'finalizado', 'bye')) not valid;

create unique index if not exists matches_round_position_idx
  on public.matches (tournament_id, round_number, position);
create index if not exists competitors_tournament_idx
  on public.competitors (tournament_id);

------------------------------------------------------------------------------
-- 3. Privileges: reads through RLS, writes only through functions
------------------------------------------------------------------------------

revoke insert, update, delete on public.tournaments, public.competitors, public.matches
  from anon, authenticated;
revoke select on public.tournaments, public.competitors, public.matches from anon;
grant select on public.tournaments, public.competitors, public.matches to authenticated;

drop policy if exists "Owners can create tournaments" on public.tournaments;
drop policy if exists "Owners can update tournaments" on public.tournaments;
drop policy if exists "Owners can delete tournaments" on public.tournaments;
drop policy if exists "Tournament owners can create competitors" on public.competitors;
drop policy if exists "Tournament owners can update competitors" on public.competitors;
drop policy if exists "Tournament owners can delete competitors" on public.competitors;
drop policy if exists "Tournament owners can create matches" on public.matches;
drop policy if exists "Tournament owners can update matches" on public.matches;
drop policy if exists "Tournament owners can delete matches" on public.matches;

------------------------------------------------------------------------------
-- 4. Internal helper: place a winner in the following knockout match
------------------------------------------------------------------------------

create or replace function public._place_in_next_match(
  p_tournament_id uuid,
  p_round_number integer,
  p_position integer,
  p_competitor_id uuid
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.matches
  set
    competitor1_id = case when p_position % 2 = 0 then p_competitor_id else competitor1_id end,
    competitor2_id = case when p_position % 2 = 1 then p_competitor_id else competitor2_id end,
    updated_at = now()
  where tournament_id = p_tournament_id
    and round_number = p_round_number + 1
    and position = p_position / 2;
$$;

revoke all on function public._place_in_next_match(uuid, integer, integer, uuid)
  from public, anon, authenticated;

------------------------------------------------------------------------------
-- 5. create_tournament
------------------------------------------------------------------------------

drop function if exists public.create_tournament(text, text, jsonb, jsonb);

create or replace function public.create_tournament(
  p_name text,
  p_format text,
  p_sport text,
  p_location text,
  p_participant_names jsonb,
  p_fixture jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid := auth.uid();
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
begin
  if v_owner is null then
    raise exception 'auth_required';
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

  insert into public.tournaments (name, format, sport, location, status, owner_id)
  values (trim(p_name), p_format, p_sport, v_location, 'borrador', v_owner)
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

  -- Nobody may appear twice in the same round.
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
    -- Every pairing is played at most once.
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
    -- Every participant starts in the first round.
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

comment on function public.create_tournament(text, text, text, text, jsonb, jsonb)
  is 'Atomically creates an owned draft tournament, its participants and full fixture.';

revoke all on function public.create_tournament(text, text, text, text, jsonb, jsonb)
  from public, anon;
grant execute on function public.create_tournament(text, text, text, text, jsonb, jsonb)
  to authenticated;

------------------------------------------------------------------------------
-- 6. publish / finish / reopen / delete
------------------------------------------------------------------------------

create or replace function public.publish_tournament(p_tournament_id uuid)
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
  where id = p_tournament_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'tournament_not_found';
  end if;

  if v_tournament.status <> 'borrador' then
    raise exception 'tournament_already_published';
  end if;

  if (select count(*) from public.competitors where tournament_id = p_tournament_id) < 2
    or not exists (select 1 from public.matches where tournament_id = p_tournament_id) then
    raise exception 'tournament_incomplete';
  end if;

  update public.tournaments
  set status = 'activo', published_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

revoke all on function public.publish_tournament(uuid) from public, anon;
grant execute on function public.publish_tournament(uuid) to authenticated;

create or replace function public.finish_tournament(p_tournament_id uuid)
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
  where id = p_tournament_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'tournament_not_found';
  end if;

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
  set status = 'finalizado', finished_at = now()
  where id = p_tournament_id
  returning * into v_tournament;

  return v_tournament;
end;
$$;

revoke all on function public.finish_tournament(uuid) from public, anon;
grant execute on function public.finish_tournament(uuid) to authenticated;

create or replace function public.reopen_tournament(p_tournament_id uuid)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament public.tournaments;
begin
  update public.tournaments
  set status = 'activo', finished_at = null
  where id = p_tournament_id
    and owner_id = auth.uid()
    and status = 'finalizado'
  returning * into v_tournament;

  if not found then
    raise exception 'tournament_not_found';
  end if;

  return v_tournament;
end;
$$;

revoke all on function public.reopen_tournament(uuid) from public, anon;
grant execute on function public.reopen_tournament(uuid) to authenticated;

create or replace function public.delete_tournament(p_tournament_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform 1 from public.tournaments
  where id = p_tournament_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'tournament_not_found';
  end if;

  delete from public.matches where tournament_id = p_tournament_id;
  delete from public.competitors where tournament_id = p_tournament_id;
  delete from public.tournaments where id = p_tournament_id;
end;
$$;

revoke all on function public.delete_tournament(uuid) from public, anon;
grant execute on function public.delete_tournament(uuid) to authenticated;

------------------------------------------------------------------------------
-- 7. record_match_result
------------------------------------------------------------------------------

create or replace function public.record_match_result(
  p_match_id uuid,
  p_score1 integer,
  p_score2 integer
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
  if auth.uid() is null then
    raise exception 'auth_required';
  end if;

  if p_score1 is null or p_score2 is null
    or p_score1 not between 0 and 999
    or p_score2 not between 0 and 999 then
    raise exception 'invalid_score';
  end if;

  select * into v_match from public.matches where id = p_match_id for update;
  if not found then
    raise exception 'match_not_found';
  end if;

  select * into v_tournament
  from public.tournaments
  where id = v_match.tournament_id and owner_id = auth.uid()
  for update;

  if not found then
    raise exception 'match_not_found';
  end if;

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

  return v_match;
end;
$$;

revoke all on function public.record_match_result(uuid, integer, integer) from public, anon;
grant execute on function public.record_match_result(uuid, integer, integer) to authenticated;

------------------------------------------------------------------------------
-- 8. Public read model
------------------------------------------------------------------------------

drop view if exists public.public_matches;
drop view if exists public.public_competitors;
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
  t.status,
  t.is_premium,
  t.created_at,
  t.published_at,
  t.finished_at,
  (select count(*) from public.competitors c where c.tournament_id = t.id)::integer
    as participant_count,
  (select count(*) from public.matches m
    where m.tournament_id = t.id and m.status = 'finalizado')::integer
    as played_count,
  (select count(*) from public.matches m
    where m.tournament_id = t.id and m.status <> 'bye')::integer
    as match_count
from public.tournaments t
where t.status <> 'borrador';

create view public.public_competitors
with (security_invoker = false)
as
select c.id, c.tournament_id, c.name
from public.competitors c
join public.tournaments t on t.id = c.tournament_id
where t.status <> 'borrador';

create view public.public_matches
with (security_invoker = false)
as
select
  m.id,
  m.tournament_id,
  m.round_number,
  m.position,
  m.competitor1_id,
  m.competitor2_id,
  m.status,
  m.score1,
  m.score2,
  m.winner_id,
  m.updated_at
from public.matches m
join public.tournaments t on t.id = m.tournament_id
where t.status <> 'borrador';

grant select on public.public_tournaments, public.public_competitors, public.public_matches
  to anon, authenticated;

------------------------------------------------------------------------------
-- 9. Payments ledger (service role only)
------------------------------------------------------------------------------

create table if not exists public.payments (
  id text primary key,
  tournament_id uuid references public.tournaments(id) on delete set null,
  status text not null,
  amount numeric(12, 2),
  currency text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.payments enable row level security;
revoke all on public.payments from anon, authenticated;
