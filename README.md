# VibeScope v3

A lightning-fast, beautiful, and genuinely useful tool to explore the semantic "vibe" of any word. Now with instant search, visual enhancements, and frictionless UX that makes it a daily-use tool.

## 🚀 v3: Streamlined & Useful

### What's New in v3
- **⚡ Instant Search**: Debounced input with results appearing as you type
- **📊 Visual Clarity**: Bar sliders alongside radar charts for intuitive understanding
- **🎯 Compare Basket**: Drag-and-drop word comparison with visual distance metrics
- **💾 Local History**: Favorites and search history (no login required)
- **🎨 Mobile-First**: Responsive design that looks crisp on any screen
- **🔥 Blazing Fast**: Precomputed embeddings, smart caching, edge functions
- **🎭 Onboarding**: Demo vibes on first visit for instant engagement

### Previous Features (v1-v2)
- **AI Narration**: GPT-powered interpretations
- **Multi-Word Comparison**: Overlay and analyze multiple terms
- **Shareable Cards**: Beautiful OG images for social
- **Temporal Tracking**: Monitor vibe drift over time
- **Semantic Analysis**: 6 psychological axes projection
- **Nearest Neighbors**: Find semantically similar terms

## Quick Start

1. **Install dependencies**
```bash
npm install
```

2. **Environment setup**
```env
# Required
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
SUPABASE_ANON_KEY=...
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

3. **Database setup**
```bash
# Run all schemas in order
psql "$SUPABASE_DB_URL" -f sql/create_tables.sql
psql "$SUPABASE_DB_URL" -f sql/v2_schema.sql
psql "$SUPABASE_DB_URL" -f sql/v3_schema.sql
```

4. **Seed lexicon**
```bash
npm run seed
```

5. **Deploy edge function** (optional, for background processing)
```bash
supabase functions deploy precompute-vibes
```

6. **Start development**
```bash
npm run dev
# Visit http://localhost:3000/v3 for the new experience
```

## Architecture

### Frontend Routes
- `/v3` - Main instant search interface
- `/v3/compare` - Multi-term comparison view
- `/vibes/[id]` - Shareable vibe cards
- `/` - Original v2 interface (preserved)

### API Endpoints
- `GET /api/vibe/instant` - Ultra-fast vibe analysis with smart caching
- `POST /api/vibe/compare` - Multi-term comparison
- `POST /api/vibe/narrate` - GPT narration (async)
- `POST /api/vibe/share` - Generate share cards
- `GET /api/og` - OG image generation

### Performance Optimizations
- **Debounced Search**: 400ms debounce for smooth typing
- **Smart Caching**: Memory cache for anchors, DB cache for results
- **Background Workers**: Supabase edge functions for precomputation
- **Frequency Filtering**: Skip ultra-rare words (freq < 0.001)
- **Optimized Indexes**: Hash indexes on hot paths
- **CDN Headers**: Cache-Control for static assets

## Key Features Deep Dive

### 🎯 Instant Feedback
- Results appear as you type (400ms debounce)
- Visual loading states
- Cached results served immediately
- Background narration generation

### 📊 Enhanced Visualization
- Color-coded radar chart axes
- Mini bar sliders with numeric values
- Mobile-optimized responsive layouts
- Smooth animations and transitions

### 🗂️ Compare Basket
- Add terms to basket while browsing
- Visual basket counter
- One-click comparison
- Distance matrix visualization

### 💾 Local Persistence
- Search history (last 20)
- Favorites collection
- No login required
- localStorage with graceful fallbacks

### 🎭 First-Time Experience
- Demo vibes immediately visible
- Guided placeholder text
- One-click examples
- Progressive disclosure

## Database Schema

### Core Tables
- `lexicon` - 20k+ terms with embeddings
- `vibe_cache` - Cached results with TTL
- `anchor_cache` - Precomputed axis anchors
- `precompute_queue` - Background job queue

### Performance Indexes
- `ivfflat` on embeddings (lists=200)
- Hash index on cache lookups
- B-tree on frequency rankings

## Deployment

### Vercel (Recommended)
```bash
vercel deploy
```

### Environment Variables
Set all variables from `.env.local` in your deployment platform

### Edge Functions
Deploy Supabase functions for background processing:
```bash
supabase functions deploy precompute-vibes
supabase functions deploy cleanup-cache
```

## Performance Metrics

- **First Paint**: < 1s
- **Time to Interactive**: < 2s
- **Search Response**: < 300ms (cached), < 800ms (computed)
- **Comparison Generation**: < 1.5s
- **Mobile Score**: 95+ (Lighthouse)

## Roadmap

### Completed ✅
- [x] Instant search with debouncing
- [x] Visual bar sliders
- [x] Compare basket
- [x] Local history/favorites
- [x] Mobile optimization
- [x] Onboarding flow
- [x] Background precomputation

### Next Up
- [ ] Trending vibes dashboard
- [ ] Domain-specific lexicons
- [ ] Export visualizations
- [ ] Public vibe collections
- [ ] API for third-party apps

## Contributing

Areas for contribution:
- Additional vibe axes
- Language support
- Performance optimizations
- UI/UX improvements

## Tech Stack

- **Next.js 14** (App Router)
- **TypeScript** 
- **Tailwind CSS**
- **Supabase** (Postgres + pgvector)
- **OpenAI** (embeddings + narration)
- **Recharts** (visualizations)
- **Edge Runtime** (Vercel/Supabase)

## License

MIT

---

**Try it live**: Visit `/v3` for the streamlined experience that turns VibeScope from "cool demo" into a tool you'll actually use daily.