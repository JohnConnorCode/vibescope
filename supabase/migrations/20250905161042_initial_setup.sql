-- VibeScope Complete Database Setup
-- Run this entire file in Supabase SQL Editor

-- Step 1: Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Create base tables (from create_tables.sql)
CREATE TABLE IF NOT EXISTS lexicon (
  id bigserial PRIMARY KEY,
  term text UNIQUE NOT NULL,
  freq real DEFAULT 0,
  pos text DEFAULT NULL,
  embedding vector(3072) NOT NULL,
  inserted_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lexicon_embedding_idx
  ON lexicon USING ivfflat (embedding vector_l2_ops) WITH (lists = 200);

CREATE TABLE IF NOT EXISTS vibe_cache (
  term text PRIMARY KEY,
  embedding vector(3072) NOT NULL,
  axes jsonb NOT NULL,
  neighbors jsonb NOT NULL,
  computed_at timestamptz DEFAULT now()
);

-- RPC for fast vector search
CREATE OR REPLACE FUNCTION match_lexicon(
  query_embedding vector,
  match_count int DEFAULT 24,
  min_freq real DEFAULT 0
) RETURNS TABLE(term text, distance real, freq real) 
LANGUAGE sql AS $$
  SELECT l.term, (l.embedding <-> query_embedding) AS distance, l.freq
  FROM lexicon l
  WHERE l.freq >= min_freq
  ORDER BY l.embedding <-> query_embedding
  LIMIT match_count
$$;

-- Step 3: V2 Schema additions
CREATE TABLE IF NOT EXISTS user_axes (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  axis_name text NOT NULL,
  pos_word text NOT NULL,
  neg_word text NOT NULL,
  embedding_pos vector(3072) NOT NULL,
  embedding_neg vector(3072) NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS user_axes_user_idx ON user_axes(user_id);

CREATE TABLE IF NOT EXISTS snapshots (
  id bigserial PRIMARY KEY,
  term text NOT NULL,
  embedding vector(3072) NOT NULL,
  axes jsonb NOT NULL,
  source text DEFAULT 'manual',
  captured_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS snapshots_term_idx ON snapshots(term, captured_at DESC);
CREATE INDEX IF NOT EXISTS snapshots_captured_idx ON snapshots(captured_at DESC);

CREATE TABLE IF NOT EXISTS share_cards (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  term text NOT NULL,
  axes_json jsonb NOT NULL,
  neighbors_json jsonb NOT NULL,
  nano_summary text,
  og_image_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS share_cards_created_idx ON share_cards(created_at DESC);

CREATE TABLE IF NOT EXISTS comparisons (
  id bigserial PRIMARY KEY,
  terms text[] NOT NULL,
  distance_matrix jsonb NOT NULL,
  axes_overlap jsonb NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Update vibe_cache to include narration
ALTER TABLE vibe_cache ADD COLUMN IF NOT EXISTS nano_summary text;
ALTER TABLE vibe_cache ADD COLUMN IF NOT EXISTS custom_axes jsonb;

-- Step 4: V3 Performance optimizations
ALTER TABLE lexicon ADD COLUMN IF NOT EXISTS freq_rank integer;

CREATE INDEX IF NOT EXISTS lexicon_freq_idx ON lexicon(freq DESC) WHERE freq > 0;

CREATE TABLE IF NOT EXISTS anchor_cache (
  term text PRIMARY KEY,
  embedding vector(3072) NOT NULL,
  computed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS vibe_cache_term_idx ON vibe_cache USING hash(term);
CREATE INDEX IF NOT EXISTS vibe_cache_computed_idx ON vibe_cache(computed_at DESC);

CREATE TABLE IF NOT EXISTS precompute_queue (
  id bigserial PRIMARY KEY,
  term text NOT NULL,
  priority integer DEFAULT 0,
  status text DEFAULT 'pending',
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS precompute_queue_status_idx ON precompute_queue(status, priority DESC);

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  terms_searched integer DEFAULT 0,
  comparisons_made integer DEFAULT 0,
  shares_created integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  last_active timestamptz DEFAULT now()
);

-- Optimized RPC for instant search
CREATE OR REPLACE FUNCTION instant_neighbors(
  query_embedding vector,
  match_count int DEFAULT 12,
  min_freq real DEFAULT 0.001
) RETURNS TABLE(term text, distance real) 
LANGUAGE sql 
STABLE
AS $$
  SELECT l.term, (l.embedding <-> query_embedding) AS distance
  FROM lexicon l
  WHERE l.freq >= min_freq
  ORDER BY l.embedding <-> query_embedding
  LIMIT match_count
$$;

-- Function to get trending terms
CREATE OR REPLACE FUNCTION trending_terms(days int DEFAULT 7)
RETURNS TABLE(term text, search_count bigint)
LANGUAGE sql
STABLE
AS $$
  SELECT term, count(*) AS search_count
  FROM vibe_cache
  WHERE computed_at > now() - interval '1 day' * days
  GROUP BY term
  ORDER BY search_count DESC
  LIMIT 20
$$;

-- Update frequency rankings
UPDATE lexicon 
SET freq_rank = ranked.rank
FROM (
  SELECT term, row_number() OVER (ORDER BY freq DESC NULLS LAST) AS rank
  FROM lexicon
) ranked
WHERE lexicon.term = ranked.term;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'VibeScope database setup complete!';
END $$;