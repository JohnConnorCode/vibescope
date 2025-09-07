// src/app/api/vibe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit, rateLimits } from '@/lib/rate-limit'

let cachedAnchors: Record<string, { pos: number[]; neg: number[] }> | null = null

// NO MOCK DATA - Real API only

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const term = (req.nextUrl.searchParams.get('term') || '').trim()
      if (!term) {
        return NextResponse.json(
          { error: 'Missing required parameter: term' }, 
          { 
            status: 400,
            headers: {
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block'
            }
          }
        )
      }

    // Check if environment is properly configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured in environment variables' },
        {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      )
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
        return NextResponse.json(
          { term, axes: hit.axes, neighbors: hit.neighbors },
          {
            headers: {
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block'
            }
          }
        )
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
          // Continue without neighbors if lexicon is empty
        } else {
          neighbors = neighborsData || []
        }
      } catch (error) {
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

      return NextResponse.json(
        { term, axes, neighbors },
        {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      )
    } catch (dbError) {
      console.error('Database/embedding service error:', dbError)
      const errorMessage = dbError instanceof Error ? dbError.message : 'Unknown error'
      return NextResponse.json(
        { 
          error: 'API Error: ' + errorMessage
        },
        {
          status: 503,
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Retry-After': '60'
          }
        }
      )
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
  }, rateLimits.analyze)
}