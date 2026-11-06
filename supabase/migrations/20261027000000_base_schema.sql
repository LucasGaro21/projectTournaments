-- Base schema. Earlier migrations assumed these tables already existed in the
-- Supabase project; this file makes a fresh project reproducible. Every
-- statement is idempotent so it is safe on projects that already have them.

create extension if not exists pgcrypto;

create table if not exists public.tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  format text not null,
  status text not null default 'borrador',
  is_premium boolean not null default false,
  magic_link_token text,
  created_at timestamptz not null default now()
);

create table if not exists public.competitors (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id) on delete cascade,
  round_number integer not null,
  competitor1_id uuid references public.competitors(id) on delete cascade,
  competitor2_id uuid references public.competitors(id) on delete cascade,
  score1 integer,
  score2 integer,
  status text not null default 'pendiente',
  created_at timestamptz not null default now()
);
