// src/app/api/vibe/snapshot/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { embed, anchorEmbeddings, axisScores } from '@/lib/embeddings'
import { supabaseAdmin } from '@/lib/supabase'

let cachedAnchors: Record<string, { pos: number[]; neg: number[] }> | null = null

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
    const supabase = supabaseAdmin()
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

    const supabase = supabaseAdmin()
    const { data, error } = await supabase
      .from('snapshots')
      .select('*')
      .eq('term', term)
      .gte('captured_at', startDate.toISOString())
      .order('captured_at', { ascending: true })

    if (error) throw error

    // Calculate temporal drift if multiple snapshots
    let drift: Record<string, number> | null = null
    if (data && data.length > 1) {
      const firstAxes = data[0].axes as Record<string, number>
      const lastAxes = data[data.length - 1].axes as Record<string, number>
      
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