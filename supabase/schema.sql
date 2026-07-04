-- Supabase setup for the wedding site.
-- Run this in the Supabase SQL editor after creating the project.

create extension if not exists "pgcrypto";

create table if not exists public.gifts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  external_link text,
  price numeric(10, 2),
  reserved_by text,
  reserved_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.gifts add column if not exists description text;
alter table public.gifts add column if not exists image_url text;
alter table public.gifts add column if not exists external_link text;
alter table public.gifts add column if not exists price numeric(10, 2);
alter table public.gifts add column if not exists reserved_by text;
alter table public.gifts add column if not exists reserved_at timestamptz;
alter table public.gifts add column if not exists created_at timestamptz not null default now();

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  storage_path text,
  thumbnail_path text,
  uploaded_by text not null,
  body text,
  created_at timestamptz not null default now(),
  constraint photos_has_image_or_body check (
    storage_path is not null
    or thumbnail_path is not null
    or nullif(btrim(body), '') is not null
  ),
  constraint photos_body_length check (body is null or char_length(body) <= 700)
);

alter table public.photos add column if not exists thumbnail_path text;
alter table public.photos add column if not exists body text;
alter table public.photos add column if not exists created_at timestamptz not null default now();
alter table public.photos alter column storage_path drop not null;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  body text not null check (char_length(body) <= 500),
  author text not null,
  created_at timestamptz not null default now()
);

create index if not exists comments_photo_id_idx on public.comments(photo_id);
create index if not exists photos_created_at_idx on public.photos(created_at desc);

create table if not exists public.photo_likes (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  guest_name text not null,
  created_at timestamptz not null default now(),
  constraint photo_likes_guest_once unique (photo_id, guest_name)
);

create index if not exists photo_likes_photo_id_idx on public.photo_likes(photo_id);

create table if not exists public.menu_responses (
  id uuid primary key default gen_random_uuid(),
  guest_name text not null,
  vegan boolean not null default false,
  vegetarian boolean not null default false,
  gluten_free boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_responses_guest_name_key unique (guest_name)
);

alter table public.menu_responses add column if not exists vegan boolean not null default false;
alter table public.menu_responses add column if not exists vegetarian boolean not null default false;
alter table public.menu_responses add column if not exists gluten_free boolean not null default false;
alter table public.menu_responses add column if not exists notes text;
alter table public.menu_responses add column if not exists created_at timestamptz not null default now();
alter table public.menu_responses add column if not exists updated_at timestamptz not null default now();

-- Multi-person support: account_name tracks who submitted; guest_name is the individual person.
alter table public.menu_responses add column if not exists account_name text;
update public.menu_responses set account_name = guest_name where account_name is null;
alter table public.menu_responses alter column account_name set not null;
alter table public.menu_responses alter column account_name set default '';

-- Replace the single-column unique constraint with a per-account+person constraint.
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'menu_responses_guest_name_key' and conrelid = 'public.menu_responses'::regclass
  ) then
    alter table public.menu_responses drop constraint menu_responses_guest_name_key;
  end if;
end $$;

drop index if exists menu_responses_guest_name_idx;

create unique index if not exists menu_responses_account_guest_idx
  on public.menu_responses(account_name, guest_name);

alter table public.gifts enable row level security;
alter table public.photos enable row level security;
alter table public.comments enable row level security;
alter table public.photo_likes enable row level security;
alter table public.menu_responses enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gifts' and policyname = 'public read gifts'
  ) then
    create policy "public read gifts" on public.gifts for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'photos' and policyname = 'public read photos'
  ) then
    create policy "public read photos" on public.photos for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'comments' and policyname = 'public read comments'
  ) then
    create policy "public read comments" on public.comments for select using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'photo_likes' and policyname = 'public read photo_likes'
  ) then
    create policy "public read photo_likes" on public.photo_likes for select using (true);
  end if;
end $$;

-- Divideable gifts: allow group contributions
alter table public.gifts add column if not exists divideable boolean not null default false;

create table if not exists public.gift_contributions (
  id uuid primary key default gen_random_uuid(),
  gift_id uuid not null references public.gifts(id) on delete cascade,
  contributed_by text not null,
  amount numeric(10, 2) not null check (amount > 0),
  created_at timestamptz not null default now()
);

create index if not exists gift_contributions_gift_id_idx on public.gift_contributions(gift_id);

alter table public.gift_contributions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'gift_contributions' and policyname = 'public read gift_contributions'
  ) then
    create policy "public read gift_contributions" on public.gift_contributions for select using (true);
  end if;
end $$;

-- The app writes through the service-role client, so no anonymous write policies are needed.
-- menu_responses is intentionally not publicly readable because it contains guest dietary details.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'wedding-photos',
  'wedding-photos',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Guest profiles: optional bio and avatar photo uploaded before the feed opens.
create table if not exists public.guest_profiles (
  guest_name text primary key,
  bio text check (bio is null or char_length(bio) <= 500),
  photo_path text,
  updated_at timestamptz not null default now()
);

alter table public.guest_profiles enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'guest_profiles' and policyname = 'public read guest_profiles'
  ) then
    create policy "public read guest_profiles" on public.guest_profiles for select using (true);
  end if;
end $$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Per-guest invite links: admin-managed, each slug pre-bound to one guest name.
-- No public policy — only adminSupabase (service role) touches this table.
create table if not exists public.guests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  guest_name text not null,
  party_label text,
  revoked boolean not null default false,
  created_at timestamptz not null default now(),
  redeemed_at timestamptz,
  last_visited_at timestamptz
);

create index if not exists guests_slug_idx on public.guests(slug);

alter table public.guests enable row level security;

-- Manual admin override for the photo feed, independent of the scheduled open/close window.
-- Singleton row: override is null (automatic, follows the schedule), 'open', or 'closed'.
-- No public policy — only adminSupabase (service role) touches this table.
create table if not exists public.gallery_settings (
  id smallint primary key default 1,
  override text check (override in ('open', 'closed')),
  updated_at timestamptz not null default now(),
  constraint gallery_settings_singleton check (id = 1)
);

insert into public.gallery_settings (id, override)
values (1, null)
on conflict (id) do nothing;

alter table public.gallery_settings enable row level security;
