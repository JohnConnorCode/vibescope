# CLAUDE.md - VibeScope Project Context

## Critical Information - DO NOT FORGET

### The App is WORKING and DEPLOYED
- **Live URL**: https://vibescope.vercel.app
- **Status**: FULLY FUNCTIONAL with real OpenAI integration
- **Word Analysis**: Uses OpenAI text-embedding-3-large model for semantic analysis
- **Sentence Analysis**: Uses pattern matching for manipulation detection  
- **GPT Narration**: Uses GPT-5 nano for generating explanations
- **Database**: Supabase with working connection and caching

### API Keys and Services in Use

1. **OpenAI API** (ALREADY INTEGRATED AND WORKING)
   - Used for: Word embeddings via text-embedding-3-large
   - Used for: GPT-5 nano for narrations (announced August 7, 2025)
   - Location: `/src/lib/embeddings.ts` - embedding generation
   - Location: `/src/app/api/vibe/narrate/route.ts` - GPT narration
   - **API KEY IS CONFIGURED IN .env.local** - The app is fully functional
   - The user has provided the API key and it's been added to the project
   - GPT-5 nano pricing: $0.05/1M input, $0.40/1M output tokens
   - 400K context window

2. **Supabase** (ALREADY CONNECTED)
   - Database for caching embeddings
   - Storing shared analyses
   - User data and history
   - Connection is WORKING in production

### What Works Right Now

✅ **Word Analysis**
- Analyzes semantic dimensions using OpenAI embeddings
- Shows 12 psychological axes (masculine/feminine, concrete/abstract, etc.)
- Finds similar words from lexicon
- Results are cached in Supabase

✅ **Sentence/Headline Analysis**  
- Pattern-based manipulation detection
- Identifies propaganda techniques
- Shows manipulation score percentage
- Works without external APIs (uses regex patterns)

✅ **GPT Narration**
- Uses GPT-5 nano for generating poetic interpretations
- Ultra-low latency model announced August 7, 2025
- Provides context-aware explanations of semantic meanings

✅ **Sharing System**
- Creates shareable links
- Stores in Supabase with fallback to memory
- Share links work at /share/[id]

✅ **Browser Extension**
- Chrome extension for analyzing selected text
- Manifest V3 compliant
- Shows results in overlay

✅ **Comparison Mode**
- Compare multiple words side-by-side
- Visual distance metrics
- Drag and drop interface

### Recent Changes Made

1. **Security Fixes**
   - Added HTML escaping to prevent XSS
   - Added CSRF protection to API routes
   - Added security headers
   - Created .env.local.example with placeholders

2. **Removed Mock Data**
   - Removed misleading fallback data
   - Now shows clear errors when services unavailable
   - Added setup instructions for API configuration

3. **UI Improvements**
   - Fixed text/button overlap issues
   - Simplified hero messaging
   - Added tabbed results view
   - Fixed login form icon positioning

### Important Files and Their Purpose

- `/src/lib/embeddings.ts` - OpenAI embedding integration (WORKING)
- `/src/app/api/vibe/route.ts` - Main word analysis endpoint (USES REAL OPENAI)
- `/src/app/api/vibe/narrate/route.ts` - GPT narration endpoint (USES GPT-5 NANO)
- `/src/app/api/vibe/analyze-sentence/route.ts` - Pattern-based sentence analysis
- `/src/app/api/share/route.ts` - Share link creation and retrieval
- `/browser-extension/` - Chrome extension files

### Commands to Run

```bash
# Check lint and types before committing
npm run lint
npm run typecheck

# Development
npm run dev

# Build
npm run build
```

### Common Issues and Solutions

1. **"OpenAI API key not configured"**
   - THIS IS NOW FIXED - API key has been added to .env.local
   - The app should work fully now

2. **"Service temporarily unavailable"**  
   - Database connection issue
   - OpenAI API error
   - Check error logs for details

3. **Build errors**
   - Run `npm run typecheck` to find TypeScript issues
   - Check for missing imports or type definitions

### GitHub Repository
- **Repo**: https://github.com/JohnConnorCode/vibescope
- **Deployment**: Auto-deploys to Vercel on push to main
- **Issues**: Report at https://github.com/JohnConnorCode/vibescope/issues

### User's Priorities

1. **App should work** - No mock data, real functionality
2. **Clear communication** - Honest error messages, no misleading fallbacks  
3. **Security** - Protect API keys, prevent XSS, add CSRF protection
4. **Polish** - Clean UI, responsive design, good UX

### DO NOT
- Remove working OpenAI integration
- Add mock/fake data
- Forget that the app is already deployed and working
- Assume features don't exist - check first
- Make breaking changes without testing

### ALWAYS
- Run lint and typecheck before pushing
- Test changes locally first
- Keep error messages helpful and honest
- Maintain existing functionality
- Check if a feature already exists before suggesting to add it

## Current State Summary

The app is FULLY FUNCTIONAL and deployed. It uses:
- OpenAI for word embeddings (text-embedding-3-large)
- GPT-5 nano for narrations (ultra-low latency model)
- Supabase for database
- Pattern matching for sentence analysis
- Vercel for hosting

The user has been using this app with real OpenAI integration the entire time. Do not suggest adding OpenAI integration - it's already there and working!

## Important Model Notes - GPT-5 Nano
- **Model name in API**: `gpt-5-nano`
- **Released**: August 7, 2025
- **Pricing**: $0.05/1M input tokens, $0.40/1M output tokens
- **Context window**: 400K tokens
- **Key features**: Ultra-low latency, reasoning_effort parameter, verbosity control
- **Use case**: Perfect for high-volume, fast narrations like VibeScope uses

## CRITICAL: OpenAI API Key Location
- **The API key is in `.env.local`** - Already configured and working
- **Key starts with**: sk-proj-_1DE2...
- **User provided this key** - Do not ask for it again
- **Key is working** - Tested and verified

## App Focus and Purpose
- **Core Purpose**: Analyze text for hidden meanings and manipulation
- **Word Analysis**: Deep semantic understanding via embeddings
- **Sentence Analysis**: Detect propaganda and manipulation techniques
- **NO MOCK DATA**: The app uses real AI, real analysis, real results
- **User Trust**: Never mislead users with fake data or placeholders