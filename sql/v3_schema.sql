-- sql/v3_schema.sql
-- Performance and caching optimizations for v3

-- Add frequency filtering to lexicon
alter table lexicon add column if not exists freq_rank integer;

-- Create index for frequency-based queries
create index if not exists lexicon_freq_idx on lexicon(freq desc) where freq > 0;

-- Anchor embeddings cache
create table if not exists anchor_cache (
  term text primary key,
  embedding vector(3072) not null,
  computed_at timestamptz default now()
);

-- Add indexes for faster cache lookups
create index if not exists vibe_cache_term_idx on vibe_cache using hash(term);
create index if not exists vibe_cache_computed_idx on vibe_cache(computed_at desc);

-- Popular terms precompute queue
create table if not exists precompute_queue (
  id bigserial primary key,
  term text not null,
  priority integer default 0,
  status text default 'pending',
  processed_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists precompute_queue_status_idx on precompute_queue(status, priority desc);

-- Session tracking for analytics (no PII)
create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  terms_searched integer default 0,
  comparisons_made integer default 0,
  shares_created integer default 0,
  started_at timestamptz default now(),
  last_active timestamptz default now()
);

-- Optimized RPC for instant search
create or replace function instant_neighbors(
  query_embedding vector,
  match_count int default 12,
  min_freq real default 0.001
) returns table(term text, distance real) 
language sql 
stable
as $$
  select l.term, (l.embedding <-> query_embedding) as distance
  from lexicon l
  where l.freq >= min_freq
  order by l.embedding <-> query_embedding
  limit match_count
$$;

-- Function to get trending terms
create or replace function trending_terms(days int default 7)
returns table(term text, search_count bigint)
language sql
stable
as $$
  select term, count(*) as search_count
  from vibe_cache
  where computed_at > now() - interval '1 day' * days
  group by term
  order by search_count desc
  limit 20
$$;

-- Update frequency rankings
update lexicon 
set freq_rank = ranked.rank
from (
  select term, row_number() over (order by freq desc nulls last) as rank
  from lexicon
) ranked
where lexicon.term = ranked.term;