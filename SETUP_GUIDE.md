# VibeScope Setup Guide

Welcome to VibeScope! This guide will help you get the application up and running.

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- An OpenAI API key

## Quick Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.local.example` to `.env.local`
   - Add your actual API keys:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
     SUPABASE_SERVICE_ROLE=your_service_role_key
     OPENAI_API_KEY=your_openai_api_key
     ```

3. **Set up the database:**
   - Run the Supabase migrations (see SETUP_DATABASE.md)
   - Or use the provided SQL files in the `sql/` directory

4. **Seed the lexicon (optional but recommended):**
   ```bash
   npm run seed
   ```
   This will populate the database with word embeddings for faster similar word searches.

5. **Start the development server:**
   ```bash
   npm run dev
   ```

6. **Visit http://localhost:3000**

## Important Notes

- **The app works even without seeded data!** If the lexicon is empty, VibeScope will still analyze words on-demand using AI embeddings.
- Seeding improves the "similar words" feature by providing a curated vocabulary.
- The first time you analyze a word, it may take a few seconds to compute embeddings.

## Features

✅ **AI-Powered Word Analysis**: Uses OpenAI's embeddings to understand semantic meaning
✅ **Six Psychological Dimensions**: Valence, arousal, concreteness, formality, novelty, and trust
✅ **Beautiful Visual Interface**: Radar charts and interactive sliders
✅ **Smart Caching**: Results are cached for instant re-access
✅ **Similar Words Discovery**: Find semantically related terms
✅ **AI Narratives**: Creative interpretations of word "vibes"
✅ **History & Favorites**: Track and save your favorite analyses
✅ **Compare Mode**: Side-by-side comparison of multiple words
✅ **Responsive Design**: Works great on desktop and mobile

## Troubleshooting

**"Failed to analyze word"**: Check your OpenAI API key and internet connection
**"Database connection issue"**: Verify your Supabase credentials
**"No similar words found"**: Run `npm run seed` to populate the lexicon

## What Makes VibeScope Special?

VibeScope reveals the hidden psychological dimensions of language. Every word has a "vibe" - an emotional and semantic fingerprint that affects how we perceive and react to it. By using advanced AI embeddings and psychological research, VibeScope makes these invisible patterns visible and interactive.

Perfect for:
- Writers exploring word choice impact
- Researchers studying language psychology  
- Anyone curious about how words "feel"
- Brand strategists choosing the right tone
- Students learning about semantics and NLP

Enjoy exploring the hidden dimensions of language! 🔍✨