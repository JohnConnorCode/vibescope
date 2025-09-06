# VibeScope Setup Guide

## Prerequisites

- Node.js 18+ installed
- OpenAI API key
- Supabase account (free tier works)

## Quick Start

### 1. Clone and Install

```bash
git clone https://github.com/JohnConnorCode/vibescope.git
cd vibescope
npm install
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your real API keys:

#### Required: OpenAI API Key

Get your OpenAI API key from [platform.openai.com](https://platform.openai.com/api-keys)

```env
OPENAI_API_KEY=sk-proj-YOUR_ACTUAL_KEY_HERE
```

**Important:** Replace `placeholder_openai_key` with your actual OpenAI API key. The app will not work without a valid key.

#### Optional: Supabase (for persistence)

The Supabase keys in the example file are already configured for the production database. Only change these if you want to use your own Supabase instance.

### 3. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Features

### Word Analysis
- Analyzes individual words using OpenAI embeddings
- Shows semantic dimensions and relationships
- Requires valid OpenAI API key

### Sentence Analysis  
- Detects manipulation techniques using pattern matching
- Works without API keys (uses local pattern detection)
- Identifies propaganda techniques like fear tactics, loaded language, etc.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `OPENAI_API_KEY` - Your OpenAI API key
   - All other variables from `.env.local`

## Troubleshooting

### "OpenAI API key not configured" Error
- Make sure you've added your actual OpenAI API key to `.env.local`
- The key should start with `sk-proj-` or `sk-`
- Restart the development server after changing environment variables

### "Service temporarily unavailable" Error
- Check your OpenAI API key is valid
- Ensure you have credits in your OpenAI account
- Check your internet connection

## Cost Considerations

- OpenAI charges per API call
- Text-embedding-3-large model: ~$0.00013 per 1K tokens
- Average word analysis: ~$0.0001 per request
- Consider implementing caching to reduce costs

## Support

Report issues at: https://github.com/JohnConnorCode/vibescope/issues