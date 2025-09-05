// src/app/api/vibe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { supabaseAdmin } from '@/lib/supabase'

let cachedAnchors: Record<string, { pos: number[]; neg: number[] }> | null = null

// Mock data for testing when API is not configured
function getMockVibeData(term: string) {
  // Simple hash-based mock generation for consistent results
  const hash = Array.from(term).reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const random = (seed: number) => Math.abs(Math.sin(seed)) * 2 - 1
  
  return {
    term,
    axes: {
      masculine_feminine: random(hash * 1),
      concrete_abstract: random(hash * 2), 
      active_passive: random(hash * 3),
      positive_negative: random(hash * 4),
      serious_playful: random(hash * 5),
      complex_simple: random(hash * 6),
      intense_mild: random(hash * 7),
      natural_artificial: random(hash * 8),
      private_public: random(hash * 9),
      high_status_low_status: random(hash * 10),
      ordered_chaotic: random(hash * 11),
      future_past: random(hash * 12)
    },
    neighbors: [] // Remove dummy data
  }
}

export async function GET(req: NextRequest) {
  try {
    const term = (req.nextUrl.searchParams.get('term') || '').trim()
    if (!term) {
      return NextResponse.json({ error: 'Missing required parameter: term' }, { status: 400 })
    }

    // Check if environment is properly configured
    if (!process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not found, returning mock data for testing')
      return NextResponse.json(getMockVibeData(term))
    }

    try {
      const supabase = supabaseAdmin()

      // 1) cache hit
      const { data: hit, error: cacheError } = await supabase
        .from('vibe_cache')
        .select('*')
        .eq('term', term)
        .maybeSingle()
      
      if (cacheError && cacheError.code !== 'PGRST116') {
        console.error('Cache lookup error:', cacheError)
      }
      
      if (hit) {
        return NextResponse.json({ term, axes: hit.axes, neighbors: hit.neighbors })
      }

      // 2) compute embedding
      const e = await embed(term)

      // 3) axes
      if (!cachedAnchors) {
        cachedAnchors = await anchorEmbeddings()
      }
      const axes = await axisScores(e, cachedAnchors)

      // 4) neighbors (L2 by default) - handle empty lexicon gracefully
      let neighbors: any[] = []
      try {
        const { data: neighborsData, error: rpcError } = await supabase
          .rpc('match_lexicon', { query_embedding: e, match_count: 24 })
        
        if (rpcError) {
          console.warn('Neighbors search failed (likely empty lexicon):', rpcError.message)
          // Continue without neighbors if lexicon is empty
        } else {
          neighbors = neighborsData || []
        }
      } catch (error) {
        console.warn('Neighbors search failed:', error)
        // Continue without neighbors - app still functions for on-demand analysis
      }

      // 5) persist
      try {
        const { error: upsertError } = await supabase
          .from('vibe_cache')
          .upsert({ term, embedding: e, axes, neighbors })
        
        if (upsertError) {
          console.error('Failed to cache vibe:', upsertError)
        }
      } catch (error) {
        console.warn('Failed to persist to cache:', error)
        // Continue without caching
      }

      return NextResponse.json({ term, axes, neighbors })
    } catch (dbError) {
      console.warn('Database/embedding service unavailable, using mock data:', dbError)
      return NextResponse.json(getMockVibeData(term))
    }
  } catch (error) {
    console.error('Error processing vibe:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to analyze word'
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API configuration issue - please check your API key in .env.local'
      } else if (error.message.includes('embedding')) {
        errorMessage = 'Failed to generate word embedding - please try again'
      } else if (error.message.includes('supabase') || error.message.includes('database')) {
        errorMessage = 'Database connection issue - please try again'
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error : undefined 
      },
      { status: 500 }
    )
  }
}