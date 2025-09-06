import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// In-memory storage for development (use Redis or database in production)
const shareCache = new Map<string, any>()

// Clean up old shares after 7 days
setInterval(() => {
  const now = Date.now()
  for (const [key, value] of shareCache.entries()) {
    if (now - value.createdAt > 7 * 24 * 60 * 60 * 1000) {
      shareCache.delete(key)
    }
  }
}, 60 * 60 * 1000) // Check every hour

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { term, type, data, expiresIn = 7 * 24 * 60 * 60 * 1000 } = body
    
    if (!term || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Generate unique ID
    const id = nanoid(10)
    
    // Store the share data
    const shareData = {
      id,
      term,
      type,
      data,
      createdAt: Date.now(),
      expiresAt: Date.now() + expiresIn,
      views: 0
    }
    
    shareCache.set(id, shareData)
    
    // Return the shareable URL
    const url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${id}`
    
    return NextResponse.json({ 
      id,
      url,
      expiresAt: shareData.expiresAt
    })
  } catch (error) {
    console.error('Share creation error:', error)
    return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 })
    }
    
    const shareData = shareCache.get(id)
    
    if (!shareData) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 })
    }
    
    // Check if expired
    if (Date.now() > shareData.expiresAt) {
      shareCache.delete(id)
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }
    
    // Increment view count
    shareData.views++
    
    return NextResponse.json(shareData)
  } catch (error) {
    console.error('Share fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 })
  }
}