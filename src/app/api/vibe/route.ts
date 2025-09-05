// src/app/api/vibe/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { AXES } from '@/lib/axes'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

let cachedAnchors: any

export async function GET(req: NextRequest) {
  const term = (req.nextUrl.searchParams.get('term') || '').trim()
  if (!term) return NextResponse.json({ error: 'Provide ?term=' }, { status: 400 })

  // 1) cache hit
  const { data: hit } = await supabase.from('vibe_cache').select('*').eq('term', term).maybeSingle()
  if (hit) return NextResponse.json({ term, axes: hit.axes, neighbors: hit.neighbors })

  // 2) compute embedding
  const e = await embed(term)

  // 3) axes
  if (!cachedAnchors) cachedAnchors = await anchorEmbeddings()
  const axes = await axisScores(e, cachedAnchors)

  // 4) neighbors (L2 by default)
  const { data: neighbors } = await supabase.rpc('match_lexicon', { query_embedding: e, match_count: 24 })

  // 5) persist
  await supabase.from('vibe_cache').upsert({ term, embedding: e, axes, neighbors })

  return NextResponse.json({ term, axes, neighbors })
}