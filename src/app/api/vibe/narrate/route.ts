// src/app/api/vibe/narrate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { generateVibeNarrative } from '@/lib/narration'

export async function POST(req: NextRequest) {
  let term = ''
  try {
    const body = await req.json()
    term = body.term
    const { axes, neighbors } = body
    
    if (!term || !axes) {
      return NextResponse.json({ error: 'Missing required data' }, { status: 400 })
    }

    const narrative = await generateVibeNarrative(term, axes, neighbors || [])
    
    return NextResponse.json({ narrative })
  } catch (error) {
    console.error('Narration error:', error)
    return NextResponse.json({ 
      error: 'Failed to generate narrative',
      narrative: term ? `"${term}" resonates with its own unique energy.` : 'This term has a unique energy.'
    }, { status: 500 })
  }
}