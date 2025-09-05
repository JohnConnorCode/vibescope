// src/app/api/vibe/instant/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { supabaseAdmin } from '@/lib/supabase'

// Cache anchor embeddings in memory
let cachedAnchors: Record<string, { pos: number[]; neg: number[] }> | null = null
let anchorsCachedAt = 0
const ANCHORS_CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function GET(req: NextRequest) {
  const term = (req.nextUrl.searchParams.get('term') || '').trim().toLowerCase()
  if (!term) return NextResponse.json({ error: 'Provide ?term=' }, { status: 400 })

  try {
    // 1. Check cache first
    const supabase = supabaseAdmin()
    const { data: cached } = await supabase
      .from('vibe_cache')
      .select('axes, neighbors, nano_summary')
      .eq('term', term)
      .maybeSingle()

    if (cached) {
      // Return cached immediately
      const response = NextResponse.json({ 
        term, 
        axes: cached.axes, 
        neighbors: cached.neighbors,
        narrative: cached.nano_summary,
        cached: true 
      })
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
      return response
    }

    // 2. Compute embedding
    const e = await embed(term)

    // 3. Get or compute anchor embeddings with TTL cache
    if (!cachedAnchors || Date.now() - anchorsCachedAt > ANCHORS_CACHE_TTL) {
      cachedAnchors = await anchorEmbeddings()
      anchorsCachedAt = Date.now()
    }
    
    const axes = await axisScores(e, cachedAnchors)

    // 4. Get neighbors (limit to 12 for speed) - handle empty lexicon gracefully
    let neighbors: any[] = []
    try {
      const { data: neighborsData, error: neighborsError } = await supabase.rpc('match_lexicon', { 
        query_embedding: e, 
        match_count: 12,
        min_freq: 0.001 // Filter out ultra-rare words
      })
      
      if (neighborsError) {
        console.warn('Neighbors search failed (likely empty lexicon):', neighborsError.message)
        // Continue without neighbors if lexicon is empty
      } else {
        neighbors = neighborsData || []
      }
    } catch (error) {
      console.warn('Neighbors search failed:', error)
      // Continue without neighbors - app still functions for on-demand analysis
    }

    // 5. Store in cache (don't wait)
    supabase.from('vibe_cache').upsert({ 
      term, 
      embedding: e, 
      axes, 
      neighbors 
    }).then(() => {
      // Trigger async narration generation
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/vibe/narrate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term, axes, neighbors })
      }).then(res => res.json()).then(({ narrative }) => {
        if (narrative) {
          supabaseAdmin().from('vibe_cache').update({ nano_summary: narrative }).eq('term', term)
        }
      }).catch(console.error)
    })

    return NextResponse.json({ 
      term, 
      axes, 
      neighbors,
      cached: false 
    })
  } catch (error) {
    console.error('Instant vibe error:', error)
    
    // Provide more helpful error messages
    let errorMessage = 'Failed to compute vibe'
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'OpenAI API configuration issue - please check your API key'
      } else if (error.message.includes('embedding')) {
        errorMessage = 'Failed to generate word embedding - please try again'
      } else if (error.message.includes('supabase') || error.message.includes('database')) {
        errorMessage = 'Database connection issue - please try again'
      } else {
        errorMessage = `Analysis failed: ${error.message}`
      }
    }
    
    return NextResponse.json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error : undefined 
    }, { status: 500 })
  }
}