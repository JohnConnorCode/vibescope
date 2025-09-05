// src/app/api/vibe/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

let cachedAnchors: any

export async function POST(req: NextRequest) {
  try {
    const { term, source = 'manual' } = await req.json()
    
    if (!term) {
      return NextResponse.json({ error: 'Term required' }, { status: 400 })
    }

    // Compute embedding and axes
    const embedding = await embed(term)
    if (!cachedAnchors) cachedAnchors = await anchorEmbeddings()
    const axes = await axisScores(embedding, cachedAnchors)

    // Store snapshot
    const { data, error } = await supabase.from('snapshots').insert({
      term,
      embedding,
      axes,
      source,
      captured_at: new Date().toISOString()
    }).select().single()

    if (error) throw error

    return NextResponse.json({ 
      snapshot: data,
      message: `Snapshot saved for "${term}"` 
    })
  } catch (error) {
    console.error('Snapshot error:', error)
    return NextResponse.json({ error: 'Failed to create snapshot' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const term = searchParams.get('term')
    const days = Number(searchParams.get('days') || '30')
    
    if (!term) {
      return NextResponse.json({ error: 'Term required' }, { status: 400 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('term', term)
      .gte('captured_at', startDate.toISOString())
      .order('captured_at', { ascending: true })

    if (error) throw error

    // Calculate temporal drift if multiple snapshots
    let drift = null
    if (data && data.length > 1) {
      const firstAxes = data[0].axes
      const lastAxes = data[data.length - 1].axes
      
      drift = {}
      for (const axis in firstAxes) {
        drift[axis] = lastAxes[axis] - firstAxes[axis]
      }
    }

    return NextResponse.json({ 
      snapshots: data,
      drift
    })
  } catch (error) {
    console.error('Snapshot fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 })
  }
}