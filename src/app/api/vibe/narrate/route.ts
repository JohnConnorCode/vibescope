// src/app/api/vibe/narrate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateVibeNarrative } from '@/lib/narration'

export async function POST(req: NextRequest) {
  try {
    const { term, axes, neighbors } = await req.json()
    
    if (!term || !axes) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const narrative = await generateVibeNarrative(term, axes, neighbors || [])
    
    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('Narration error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate narrative',
      narrative: `"${req.body?.term}" resonates with its own unique energy.`
    }, { status: 500 })
  }
}