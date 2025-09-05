# 🚀 Deploy VibeScope to Vercel - Quick Guide

## ✅ GitHub Repository Ready!
Your code is live at: **https://github.com/JohnConnorCode/vibescope**

## 🎯 Deploy to Vercel in 3 Minutes

### Step 1: Go to Vercel
👉 **https://vercel.com/new/clone?repository-url=https://github.com/JohnConnorCode/vibescope**

### Step 2: Import & Configure

1. **Click "Import"** when it shows your repository
2. **Add Environment Variables** (REQUIRED):

```env
OPENAI_API_KEY=sk-...your-key...
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE=eyJ...your-service-role...
SUPABASE_ANON_KEY=eyJ...your-anon-key...
NEXT_PUBLIC_APP_URL=https://vibescope.vercel.app
PROVIDER=openai
EMBEDDING_MODEL=openai:text-embedding-3-large
EMBEDDING_DIM=3072
```

### Step 3: Deploy
Click **"Deploy"** - takes ~2 minutes

## 🔑 Get Your API Keys

### OpenAI (Required)
1. Go to: https://platform.openai.com/api-keys
2. Click "Create new secret key"
3. Copy the `sk-...` key

### Supabase (Required)
1. Create free project: https://app.supabase.com/new/project
2. Once created, go to **Settings → API**
3. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `SUPABASE_ANON_KEY`  
   - **service_role** → `SUPABASE_SERVICE_ROLE`

## 📊 Set Up Database (2 minutes)

1. In Supabase dashboard, click **SQL Editor**
2. Run these commands one by one:

**First - Enable pgvector:**
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Second - Create tables:**
Copy everything from `sql/create_tables.sql` and run it

**Third - Add v2 features:**
Copy everything from `sql/v2_schema.sql` and run it

**Fourth - Add v3 optimizations:**
Copy everything from `sql/v3_schema.sql` and run it

## 🌱 Seed Initial Data

After deployment, in your project directory:

```bash
# Make sure your .env.local has all the keys
npm run seed
```

Or manually add terms in Supabase Table Editor.

## ✨ Your App URLs

Once deployed:
- **Main App**: `https://vibescope.vercel.app/v3`
- **Compare**: `https://vibescope.vercel.app/v3/compare`
- **Original**: `https://vibescope.vercel.app/`

## 🎉 Success Checklist

After deployment:
- [ ] Visit `/v3` - should show search interface
- [ ] Try searching "punk" - should show vibe analysis
- [ ] Click a neighbor word - should navigate
- [ ] Add to favorites - should persist locally
- [ ] Try compare mode - should overlay charts

## 🆘 Common Issues & Fixes

### "Invalid environment variables"
→ Double-check all keys are added in Vercel dashboard

### "Database connection failed"  
→ Make sure you ran all SQL files in order

### "OpenAI API error"
→ Check you have credits/quota on OpenAI

### Build fails on Vercel
→ Already fixed in the code! Should work now.

## 📈 Next Steps

1. **Custom Domain**: Add in Vercel settings
2. **Analytics**: Enable Vercel Analytics
3. **Seed More Data**: Add more terms to lexicon
4. **Share**: Send people to `/v3` for best experience

## 🔗 Quick Links

- **Your GitHub**: https://github.com/JohnConnorCode/vibescope
- **Deploy URL**: https://vercel.com/new/clone?repository-url=https://github.com/JohnConnorCode/vibescope
- **Supabase**: https://app.supabase.com
- **OpenAI**: https://platform.openai.com

---

**Ready to go viral!** Once deployed, share the `/v3` URL for the streamlined experience. 🚀