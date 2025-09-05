# Quick Database Setup

## One-Click Setup

1. **Click this link to open SQL Editor:**
   👉 https://supabase.com/dashboard/project/swgqbjubarqpsdiubdnv/sql/new

2. **Copy ALL the content from:** `sql/setup-all.sql`

3. **Paste in the SQL Editor and click RUN**

That's it! The database will be fully configured.

## What This Creates:
- ✅ pgvector extension for embeddings
- ✅ lexicon table with 3072-dim vectors
- ✅ vibe_cache for fast lookups
- ✅ All supporting tables (user_axes, snapshots, share_cards, etc.)
- ✅ Optimized indexes and functions
- ✅ Performance enhancements for instant search

## Verify Setup:
After running, you should see:
```
NOTICE: VibeScope database setup complete!
```

Your app will now work at:
https://vibescope-lzsorls2m-john-connors-projects-d9df1dfe.vercel.app