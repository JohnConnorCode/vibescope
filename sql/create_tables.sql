-- sql/create_tables.sql
create extension if not exists vector;

-- Choose ONE that matches EMBEDDING_DIM
-- Example for 3072 dims (OpenAI text-embedding-3-large)
create table if not exists lexicon (
  id bigserial primary key,
  term text unique not null,
  freq real default 0,
  pos text default null,
  embedding vector(3072) not null,
  inserted_at timestamptz default now()
);

create index if not exists lexicon_embedding_idx
  on lexicon using ivfflat (embedding vector_l2_ops) with (lists = 200);

create table if not exists vibe_cache (
  term text primary key,
  embedding vector(3072) not null,
  axes jsonb not null,
  neighbors jsonb not null,
  computed_at timestamptz default now()
);

-- RPC for fast vector search
create or replace function match_lexicon(
  query_embedding vector,
  match_count int default 24,
  min_freq real default 0
) returns table(term text, distance real, freq real) language sql as $$
  select l.term, (l.embedding <-> query_embedding) as distance, l.freq
  from lexicon l
  where l.freq >= min_freq
  order by l.embedding <-> query_embedding
  limit match_count
$$;