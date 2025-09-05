-- sql/v2_schema.sql
-- Additional tables for VibeScope v2 features

-- User-defined custom axes
create table if not exists user_axes (
  id bigserial primary key,
  user_id uuid references auth.users(id),
  axis_name text not null,
  pos_word text not null,
  neg_word text not null,
  embedding_pos vector(3072) not null,
  embedding_neg vector(3072) not null,
  created_at timestamptz default now()
);

create index if not exists user_axes_user_idx on user_axes(user_id);

-- Temporal snapshots for trend tracking
create table if not exists snapshots (
  id bigserial primary key,
  term text not null,
  embedding vector(3072) not null,
  axes jsonb not null,
  source text default 'manual',
  captured_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists snapshots_term_idx on snapshots(term, captured_at desc);
create index if not exists snapshots_captured_idx on snapshots(captured_at desc);

-- Share cards for social sharing
create table if not exists share_cards (
  id text primary key default gen_random_uuid()::text,
  term text not null,
  axes_json jsonb not null,
  neighbors_json jsonb not null,
  nano_summary text,
  og_image_url text,
  created_at timestamptz default now()
);

create index if not exists share_cards_created_idx on share_cards(created_at desc);

-- Comparisons tracking
create table if not exists comparisons (
  id bigserial primary key,
  terms text[] not null,
  distance_matrix jsonb not null,
  axes_overlap jsonb not null,
  user_id uuid references auth.users(id),
  created_at timestamptz default now()
);

-- Update vibe_cache to include narration
alter table vibe_cache add column if not exists nano_summary text;
alter table vibe_cache add column if not exists custom_axes jsonb;