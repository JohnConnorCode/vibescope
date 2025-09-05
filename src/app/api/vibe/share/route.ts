// src/app/api/vibe/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const serviceKey = process.env.SUPABASE_SERVICE_ROLE!
const supabase = createClient(url, serviceKey)

export async function POST(req: NextRequest) {
  try {
    const { term, axes, neighbors, nanoSummary } = await req.json()
    
    if (!term || !axes) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Generate share ID
    const shareId = Math.random().toString(36).substring(2, 15)
    
    // Build OG image URL
    const ogImageUrl = `/api/og?${new URLSearchParams({
      term,
      axes: JSON.stringify(axes),
      neighbors: JSON.stringify(neighbors?.slice(0, 4) || []),
      summary: nanoSummary || ''
    }).toString()}`

    // Store share card
    const { data, error } = await supabase.from('share_cards').insert({
      id: shareId,
      term,
      axes_json: axes,
      neighbors_json: neighbors || [],
      nano_summary: nanoSummary,
      og_image_url: ogImageUrl
    }).select().single()

    if (error) throw error

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/vibes/${shareId}`

    return NextResponse.json({
      shareId: data.id,
      shareUrl,
      ogImageUrl
    })
  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json({ error: 'Failed to create share card' }, { status: 500 })
  }
}