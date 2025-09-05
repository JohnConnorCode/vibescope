# Deployment Guide for VibeScope

## 🎉 GitHub Setup Complete!

Your code is now live at: https://github.com/JohnConnorCode/vibescope

## 🚀 Deploy to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Visit Vercel**: https://vercel.com/new

2. **Import GitHub Repository**:
   - Click "Import Git Repository"
   - Select `JohnConnorCode/vibescope`
   - Click "Import"

3. **Configure Environment Variables**:
   Add these in the Vercel dashboard:
   ```
   OPENAI_API_KEY=your_openai_api_key
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   PROVIDER=openai
   EMBEDDING_MODEL=openai:text-embedding-3-large
   EMBEDDING_DIM=3072
   ```

4. **Deploy**: Click "Deploy" and wait ~2 minutes

### Option 2: Deploy via CLI

1. **Login to Vercel**:
   ```bash
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked about linking to existing project, select "No"
   - Set up as new project
   - Copy environment variables from `.env.local`

3. **Production Deploy**:
   ```bash
   vercel --prod
   ```

## 📊 Set Up Supabase

1. **Create Supabase Project**: https://app.supabase.com

2. **Enable pgvector**:
   - Go to SQL Editor
   - Run: `CREATE EXTENSION IF NOT EXISTS vector;`

3. **Run Schema Files**:
   - Copy contents of `sql/create_tables.sql`
   - Paste and run in SQL Editor
   - Repeat for `sql/v2_schema.sql`
   - Repeat for `sql/v3_schema.sql`

4. **Get API Keys**:
   - Settings → API
   - Copy `URL`, `anon public`, and `service_role` keys

## 🔑 Required API Keys

### OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create new secret key
3. Copy as `OPENAI_API_KEY`

### Supabase
1. Create project at https://app.supabase.com
2. Go to Settings → API
3. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon key → `SUPABASE_ANON_KEY`
   - Service role → `SUPABASE_SERVICE_ROLE`

## 🌱 Seed Initial Data

After deployment, seed your lexicon:

1. **Local seeding**:
   ```bash
   npm run seed
   ```

2. **Or use Supabase Dashboard**:
   - Upload `data/lexicon.txt` via Table Editor
   - Run embedding generation via edge function

## 🎯 Post-Deployment Checklist

- [ ] Verify environment variables in Vercel
- [ ] Test search functionality at `/v3`
- [ ] Check database connection
- [ ] Verify OpenAI API is working
- [ ] Test share cards generation
- [ ] Check mobile responsiveness

## 🔗 Your Deployment URLs

- **GitHub**: https://github.com/JohnConnorCode/vibescope
- **Vercel**: Will be `https://vibescope.vercel.app` (or custom domain)
- **API Endpoints**:
  - `/api/vibe/instant` - Fast search
  - `/api/vibe/compare` - Multi-term comparison
  - `/api/og` - Social cards

## 📈 Monitor Performance

1. **Vercel Analytics**: Enable in Vercel dashboard
2. **Supabase Metrics**: Monitor in Supabase dashboard
3. **Error Tracking**: Consider adding Sentry

## 🆘 Troubleshooting

### "Database connection failed"
- Check Supabase URL and keys
- Ensure pgvector extension is enabled
- Verify schema is created

### "OpenAI API error"
- Verify API key is valid
- Check API quota/credits
- Ensure model name is correct

### "Slow performance"
- Check Vercel function regions
- Verify database indexes are created
- Enable Vercel Edge caching

## 🎉 Success!

Once deployed, your app will be live at your Vercel URL. Share the `/v3` route for the best experience!

Need help? Check the issues at: https://github.com/JohnConnorCode/vibescope/issues