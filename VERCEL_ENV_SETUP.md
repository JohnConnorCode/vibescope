# Vercel Environment Variables Setup Guide

## Best Practices ✅

**IMPORTANT**: Never commit sensitive keys to your repository. All environment variables should be set directly in Vercel's dashboard.

## Setting Environment Variables in Vercel

### 1. Go to your Vercel Project Settings
- Navigate to: https://vercel.com/[your-team]/[your-project]/settings/environment-variables
- Or: Dashboard → Select Project → Settings → Environment Variables

### 2. Add These Environment Variables

Click "Add New" and add each variable with the appropriate environment scope:

| Variable Name | Value | Environment | Description |
|--------------|--------|------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://swgqbjubarqpsdiubdnv.supabase.co` | Production, Preview, Development | Your Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3Z3FianViYXJxcHNkaXViZG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwNTcwNjEsImV4cCI6MjA3MjYzMzA2MX0.CUyp7HHbUwfsCM47S2uiLIGnnlLClKFw2Uzund15_k4` | Production, Preview, Development | Supabase anonymous key (public) |
| `SUPABASE_SERVICE_ROLE` | Get from Supabase Dashboard → Settings → API → Service Role Key | Production only | **SENSITIVE** - Service role key |
| `OPENAI_API_KEY` | Your OpenAI API key | Production only | **SENSITIVE** - OpenAI API key |
| `NEXT_PUBLIC_APP_URL` | `https://your-app.vercel.app` | Production | Your production URL |
| `PROVIDER` | `openai` | Production, Preview, Development | Embedding provider |
| `EMBEDDING_MODEL` | `openai:text-embedding-3-large` | Production, Preview, Development | Embedding model |
| `EMBEDDING_DIM` | `3072` | Production, Preview, Development | Embedding dimensions |

### 3. Environment Scopes Explained

- **Production**: Used for your main deployment (your-app.vercel.app)
- **Preview**: Used for pull request preview deployments
- **Development**: Used when running `vercel dev` locally

### Security Best Practices

1. **Service Role Key**: 
   - Only set for Production environment
   - Never expose in client-side code
   - Never commit to repository

2. **OpenAI API Key**:
   - Only set for Production environment
   - Consider using different keys for dev/prod
   - Set spending limits in OpenAI dashboard

3. **Public Keys** (NEXT_PUBLIC_*):
   - Safe to expose to client
   - Still should not be committed to repo
   - Set in all environments

## Local Development Setup

For local development, create `.env.local` (this file is gitignored):

```bash
# Copy the example file
cp .env.local.example .env.local

# Edit with your development values
# These values will NOT be committed to git
```

## Verifying Your Setup

### 1. Check in Vercel Dashboard
After deployment, verify variables are loaded:
- Go to Functions tab → Select a function → Check "Environment Variables" section

### 2. Use the Health Check Endpoint
```bash
curl https://your-app.vercel.app/api/health
```

Should return:
```json
{
  "status": "ok",
  "database": {
    "status": "healthy",
    "tables": 9,
    "vector_extension": true
  },
  "environment": {
    "hasSupabaseUrl": true,
    "hasSupabaseKey": true,
    "hasOpenAIKey": true
  }
}
```

## Getting Your Keys

### Supabase Service Role Key
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to Settings → API
4. Find "Service Role Key" under "Project API keys"
5. Copy the key (starts with `eyJ...`)

### OpenAI API Key
1. Go to https://platform.openai.com/api-keys
2. Create new secret key
3. Copy immediately (you won't see it again)

## Important Notes

1. **Never commit `.env.local` or `.env.production`** - These should be in `.gitignore`
2. **Use `.env.local.example`** as a template for other developers
3. **Rotate keys regularly** for security
4. **Use different keys** for development vs production when possible
5. **Monitor usage** in both Supabase and OpenAI dashboards

## Deployment Checklist

- [ ] All environment variables added in Vercel dashboard
- [ ] Service role key is Production-only
- [ ] OpenAI key is Production-only  
- [ ] Public URLs use NEXT_PUBLIC_ prefix
- [ ] No sensitive keys in repository
- [ ] Health check endpoint returns success
- [ ] Test vector search functionality works

## Troubleshooting

### "Missing environment variable" errors
- Check variable names match exactly (case-sensitive)
- Ensure no trailing spaces in values
- Redeploy after adding variables

### Database connection issues
- Verify Supabase project is not paused
- Check service role key is valid
- Ensure RLS policies allow access

### Vector search not working
- Confirm OpenAI API key is valid
- Check embedding dimensions match (3072)
- Verify lexicon table has data