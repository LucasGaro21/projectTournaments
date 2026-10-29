-- Creates a tournament, its competitors, and its fixture in one transaction.
-- The client supplies a deterministic fixture by participant name; ownership,
-- format, and referential integrity are enforced here.

create or replace function public.create_tournament(
  p_name text,
  p_format text,
  p_participant_names jsonb,
  p_fixture jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  created_tournament_id uuid;
  fixture_match jsonb;
  competitor1_id uuid;
  competitor2_id uuid;
  participant_count integer;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if length(trim(p_name)) < 3 or length(trim(p_name)) > 120 then
    raise exception 'Tournament name must contain between 3 and 120 characters';
  end if;

  if p_format not in ('Americano', 'Eliminatoria') then
    raise exception 'Unsupported tournament format';
  end if;

  if jsonb_typeof(p_participant_names) <> 'array'
    or jsonb_array_length(p_participant_names) < 2
    or jsonb_array_length(p_participant_names) > 256 then
    raise exception 'A tournament requires between 2 and 256 participants';
  end if;

  select count(*)
  into participant_count
  from (
    select lower(trim(value #>> '{}')) as normalized_name
    from jsonb_array_elements(p_participant_names)
  ) names
  where normalized_name <> '';

  if participant_count <> jsonb_array_length(p_participant_names) then
    raise exception 'Participant names cannot be empty';
  end if;

  if participant_count <> (
    select count(distinct lower(trim(value #>> '{}')))
    from jsonb_array_elements(p_participant_names)
  ) then
    raise exception 'Participant names must be unique';
  end if;

  insert into public.tournaments (name, format, status, owner_id)
  values (trim(p_name), p_format, 'borrador', auth.uid())
  returning id into created_tournament_id;

  insert into public.competitors (tournament_id, name)
  select created_tournament_id, trim(value #>> '{}')
  from jsonb_array_elements(p_participant_names);

  if jsonb_typeof(p_fixture) <> 'array' or jsonb_array_length(p_fixture) = 0 then
    raise exception 'The fixture cannot be empty';
  end if;

  for fixture_match in select * from jsonb_array_elements(p_fixture)
  loop
    select id into competitor1_id
    from public.competitors
    where tournament_id = created_tournament_id
      and name = fixture_match->>'competitor1_name';

    if competitor1_id is null then
      raise exception 'Fixture references an unknown first participant';
    end if;

    if fixture_match->>'competitor2_name' is not null then
      select id into competitor2_id
      from public.competitors
      where tournament_id = created_tournament_id
        and name = fixture_match->>'competitor2_name';

      if competitor2_id is null or competitor1_id = competitor2_id then
        raise exception 'Fixture contains an invalid participant pairing';
      end if;
    else
      competitor2_id := null;
    end if;

    insert into public.matches (
      tournament_id,
      round_number,
      competitor1_id,
      competitor2_id,
      status
    )
    values (
      created_tournament_id,
      greatest(1, (fixture_match->>'round_number')::integer),
      competitor1_id,
      competitor2_id,
      'pendiente'
    );
  end loop;

  return created_tournament_id;
end;
$$;

comment on function public.create_tournament(text, text, jsonb, jsonb)
  is 'Atomically creates an owned tournament, participants, and fixture.';

revoke all on function public.create_tournament(text, text, jsonb, jsonb)
  from public;
grant execute on function public.create_tournament(text, text, jsonb, jsonb)
  to authenticated;
