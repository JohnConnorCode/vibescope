// src/app/api/vibe/compare/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { createClient } from '@supabase/supabase-js'
import { compareVibesNarrative } from '@/lib/narration'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

let cachedAnchors: any

function cosineSimilarity(a: number[], b: number[]): number {
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0)
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0))
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0))
  return dotProduct / (magA * magB)
}

function vibeDistance(a: number[], b: number[]): number {
  // Use 1 - cosine similarity, scaled to [0, 2]
  return 2 * (1 - cosineSimilarity(a, b))
}

export async function POST(req: NextRequest) {
  try {
    const { terms } = await req.json()
    
    if (!terms || !Array.isArray(terms) || terms.length < 2) {
      return NextResponse.json({ error: 'Provide at least 2 terms' }, { status: 400 })
    }

    // Get embeddings and axes for all terms
    const results = await Promise.all(terms.map(async (term) => {
      // Check cache first
      const { data: cached } = await supabase
        .from('vibe_cache')
        .select('*')
        .eq('term', term)
        .maybeSingle()
      
      if (cached) {
        return {
          term,
          embedding: cached.embedding,
          axes: cached.axes,
          neighbors: cached.neighbors
        }
      }

      // Compute if not cached
      const embedding = await embed(term)
      if (!cachedAnchors) cachedAnchors = await anchorEmbeddings()
      const axes = await axisScores(embedding, cachedAnchors)
      
      const { data: neighbors } = await supabase.rpc('match_lexicon', { 
        query_embedding: embedding, 
        match_count: 10 
      })

      // Cache for next time
      await supabase.from('vibe_cache').upsert({ 
        term, 
        embedding, 
        axes, 
        neighbors 
      })

      return { term, embedding, axes, neighbors }
    }))

    // Calculate distance matrix
    const distanceMatrix: Record<string, Record<string, number>> = {}
    for (let i = 0; i < results.length; i++) {
      distanceMatrix[results[i].term] = {}
      for (let j = 0; j < results.length; j++) {
        if (i === j) {
          distanceMatrix[results[i].term][results[j].term] = 0
        } else {
          distanceMatrix[results[i].term][results[j].term] = vibeDistance(
            results[i].embedding,
            results[j].embedding
          )
        }
      }
    }

    // Find overlapping axes (similar scores)
    const axesOverlap: Record<string, number> = {}
    const firstAxes = results[0].axes
    for (const axis in firstAxes) {
      const values = results.map(r => r.axes[axis])
      const variance = values.reduce((sum, val) => {
        const diff = val - values[0]
        return sum + diff * diff
      }, 0) / values.length
      axesOverlap[axis] = 1 - Math.min(variance, 1) // Convert to similarity
    }

    // Generate narrative for comparison
    const avgDistance = Object.values(distanceMatrix[results[0].term])
      .filter((_, i) => i > 0)
      .reduce((a, b) => a + b, 0) / (results.length - 1)
    
    const narrative = await compareVibesNarrative(
      terms,
      results.reduce((acc, r) => ({ ...acc, [r.term]: r.axes }), {}),
      avgDistance
    )

    // Store comparison
    await supabase.from('comparisons').insert({
      terms,
      distance_matrix: distanceMatrix,
      axes_overlap: axesOverlap
    })

    return NextResponse.json({
      results: results.map(({ term, axes, neighbors }) => ({ term, axes, neighbors })),
      distanceMatrix,
      axesOverlap,
      narrative
    })
  } catch (error) {
    console.error('Comparison error:', error)
    return NextResponse.json({ error: 'Failed to compare terms' }, { status: 500 })
  }
}