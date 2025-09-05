// src/app/api/vibe/share/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const { term, axes, neighbors, nanoSummary } = await req.json()
    
    if (!term || !axes) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    // Generate secure share ID
    const shareId = crypto.randomUUID().substring(0, 13)
    
    // Build OG image URL
    const ogImageUrl = `/api/og?${new URLSearchParams({
      term,
      axes: JSON.stringify(axes),
      neighbors: JSON.stringify(neighbors?.slice(0, 4) || []),
      summary: nanoSummary || ''
    }).toString()}`

    // Store share card
    const supabase = supabaseAdmin()
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