# Database Setup Instructions

## Quick Setup

1. **Go to your Supabase SQL Editor:**
   https://supabase.com/dashboard/project/swgqbjubarqpsdiubdnv/sql/new

2. **Copy the entire contents of `sql/setup-all.sql`**

3. **Paste in SQL Editor and click "RUN"**

## What This Creates

- **Tables:**
  - `lexicon` - Word embeddings and frequency data
  - `vibe_cache` - Cached search results for performance
  - `user_axes` - Custom axes for users
  - `snapshots` - Historical term snapshots
  - `share_cards` - Shareable vibe cards
  - `comparisons` - Term comparison data
  - `anchor_cache` - Cached anchor embeddings
  - `precompute_queue` - Background processing queue
  - `sessions` - User session tracking

- **Functions:**
  - `match_lexicon()` - Fast vector similarity search
  - `instant_neighbors()` - Optimized instant search
  - `trending_terms()` - Get popular search terms

- **Indexes:**
  - Vector indexes for fast similarity search
  - Performance indexes on all key fields

## Verify Setup

After running the SQL, test by visiting:
https://vibescope-lzsorls2m-john-connors-projects-d9df1dfe.vercel.app

Try searching for "punk" or "zen" to verify everything works!

## Troubleshooting

If you see errors:
1. Make sure pgvector extension is enabled
2. Check that all tables were created successfully
3. Verify your Supabase project URL and keys in `.env.local`