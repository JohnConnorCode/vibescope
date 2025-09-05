// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey) {
  throw new Error('Missing SUPABASE_ANON_KEY environment variable')
}

// Client-side Supabase client (uses anon key)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'x-application-name': 'vibescope',
    },
  },
})

// Server-side Supabase client (uses service role key)
export const supabaseAdmin = () => {
  if (!supabaseServiceRole) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE environment variable')
  }
  
  return createClient(supabaseUrl, supabaseServiceRole, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'x-application-name': 'vibescope-admin',
      },
    },
  })
}

// Helper functions for vector search
export async function searchSimilarTerms(embedding: number[], limit = 24, minFreq = 0) {
  const { data, error } = await supabase.rpc('match_lexicon', {
    query_embedding: embedding,
    match_count: limit,
    min_freq: minFreq,
  })
  
  if (error) throw error
  return data
}

export async function getInstantNeighbors(embedding: number[], limit = 12, minFreq = 0.001) {
  const { data, error } = await supabase.rpc('instant_neighbors', {
    query_embedding: embedding,
    match_count: limit,
    min_freq: minFreq,
  })
  
  if (error) throw error
  return data
}

export async function getTrendingTerms(days = 7) {
  const { data, error } = await supabase.rpc('trending_terms', { days })
  
  if (error) throw error
  return data
}

// Health check for Vercel deployment
export async function checkDatabaseHealth() {
  const { data, error } = await supabase.rpc('health_check')
  
  if (error) throw error
  return data
}