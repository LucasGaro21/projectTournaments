-- Run this migration in the Supabase SQL Editor before using the protected dashboard.
-- Existing tournaments without an owner remain publicly readable but are not writable
-- through the authenticated dashboard until they are assigned an owner_id.

alter table public.tournaments
  add column if not exists owner_id uuid references auth.users(id) on delete cascade;

create index if not exists tournaments_owner_id_idx
  on public.tournaments(owner_id);

alter table public.matches
  drop constraint if exists matches_scores_non_negative_integers;

alter table public.matches
  add constraint matches_scores_non_negative_integers
  check (
    (score1 is null or (score1 between 0 and 999 and score1 = floor(score1)))
    and (score2 is null or (score2 between 0 and 999 and score2 = floor(score2)))
  );

create or replace function public.validate_magic_link(
  p_tournament_id uuid,
  p_token text
)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.tournaments
    where id = p_tournament_id
      and magic_link_token = p_token
      and is_premium = true
  );
$$;

comment on function public.validate_magic_link(uuid, text)
  is 'Validates a Premium tournament magic link without exposing the stored token.';

revoke all on function public.validate_magic_link(uuid, text)
  from public;
grant execute on function public.validate_magic_link(uuid, text)
  to anon, authenticated;

create or replace function public.publish_tournament(p_tournament_id uuid)
returns public.tournaments
language plpgsql
security definer
set search_path = public
as $$
declare
  tournament_row public.tournaments;
  competitor_count integer;
  match_count integer;
begin
  select *
  into tournament_row
  from public.tournaments
  where id = p_tournament_id
    and owner_id = (select auth.uid())
  for update;

  if not found then
    raise exception 'Tournament not found or not owned by current user';
  end if;

  if tournament_row.status <> 'borrador' then
    raise exception 'Tournament is already published';
  end if;

  select count(*)
  into competitor_count
  from public.competitors
  where tournament_id = p_tournament_id;

  if competitor_count < 2 then
    raise exception 'At least two competitors are required';
  end if;

  select count(*)
  into match_count
  from public.matches
  where tournament_id = p_tournament_id;

  if match_count = 0 then
    raise exception 'At least one match is required';
  end if;

  update public.tournaments
  set status = 'activo'
  where id = p_tournament_id;

  select *
  into tournament_row
  from public.tournaments
  where id = p_tournament_id;

  return tournament_row;
end;
$$;

comment on function public.publish_tournament(uuid)
  is 'Publishes an owned tournament only when its competitor and fixture prerequisites are met.';

revoke all on function public.publish_tournament(uuid)
  from public;
grant execute on function public.publish_tournament(uuid)
  to authenticated;

alter table public.tournaments enable row level security;
alter table public.competitors enable row level security;
alter table public.matches enable row level security;

drop policy if exists "Public can read tournaments" on public.tournaments;
drop policy if exists "Owners can read tournaments" on public.tournaments;
create policy "Owners can read tournaments"
  on public.tournaments
  for select
  to authenticated
  using ((select auth.uid()) = owner_id);

create or replace view public.public_tournaments
with (security_invoker = false)
as
select
  id,
  name,
  format,
  status,
  is_premium,
  created_at
from public.tournaments
where status <> 'borrador';

grant select on public.public_tournaments to anon, authenticated;

create or replace view public.public_competitors
with (security_invoker = false)
as
select
  competitors.id,
  competitors.tournament_id,
  competitors.name
from public.competitors
join public.tournaments
  on tournaments.id = competitors.tournament_id
where tournaments.status <> 'borrador';

grant select on public.public_competitors to anon, authenticated;

create or replace view public.public_matches
with (security_invoker = false)
as
select
  matches.id,
  matches.tournament_id,
  matches.round_number,
  matches.competitor1_id,
  matches.competitor2_id,
  matches.status,
  matches.score1,
  matches.score2
from public.matches
join public.tournaments
  on tournaments.id = matches.tournament_id
where tournaments.status <> 'borrador';

grant select on public.public_matches to anon, authenticated;

drop policy if exists "Owners can create tournaments" on public.tournaments;
create policy "Owners can create tournaments"
  on public.tournaments
  for insert
  to authenticated
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can update tournaments" on public.tournaments;
create policy "Owners can update tournaments"
  on public.tournaments
  for update
  to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

drop policy if exists "Owners can delete tournaments" on public.tournaments;
create policy "Owners can delete tournaments"
  on public.tournaments
  for delete
  to authenticated
  using ((select auth.uid()) = owner_id);

drop policy if exists "Public can read competitors" on public.competitors;
drop policy if exists "Owners can read competitors" on public.competitors;
create policy "Owners can read competitors"
  on public.competitors
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = competitors.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can create competitors" on public.competitors;
create policy "Tournament owners can create competitors"
  on public.competitors
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = competitors.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can update competitors" on public.competitors;
create policy "Tournament owners can update competitors"
  on public.competitors
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = competitors.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = competitors.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can delete competitors" on public.competitors;
create policy "Tournament owners can delete competitors"
  on public.competitors
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = competitors.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Public can read matches" on public.matches;
drop policy if exists "Owners can read matches" on public.matches;
create policy "Owners can read matches"
  on public.matches
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = matches.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can create matches" on public.matches;
create policy "Tournament owners can create matches"
  on public.matches
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = matches.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can update matches" on public.matches;
create policy "Tournament owners can update matches"
  on public.matches
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = matches.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  )
  with check (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = matches.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );

drop policy if exists "Tournament owners can delete matches" on public.matches;
create policy "Tournament owners can delete matches"
  on public.matches
  for delete
  to authenticated
  using (
    exists (
      select 1
      from public.tournaments
      where tournaments.id = matches.tournament_id
        and tournaments.owner_id = (select auth.uid())
    )
  );
