import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { supabaseAdmin } from '@/lib/supabase'
import { withRateLimit, rateLimits } from '@/lib/rate-limit'

// In-memory cache for faster access (optional)
const shareCache = new Map<string, any>()

// Clean up cache periodically
setInterval(() => {
  // Keep cache size reasonable
  if (shareCache.size > 1000) {
    const entriesToDelete = shareCache.size - 500
    let deleted = 0
    for (const key of shareCache.keys()) {
      if (deleted >= entriesToDelete) break
      shareCache.delete(key)
      deleted++
    }
  }
}, 60 * 60 * 1000) // Every hour

export async function POST(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const body = await req.json()
      const { term, type, data, expiresIn = 7 * 24 * 60 * 60 * 1000 } = body
    
    if (!term || !data) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Generate unique ID
    const id = nanoid(10)
    const now = new Date()
    const expiresAt = new Date(now.getTime() + expiresIn)
    
    // Store in database
    const supabase = supabaseAdmin()
    
    // Try to use database if available
    try {
      const { error } = await supabase
        .from('shared_analyses')
        .insert({
          id,
          term,
          type: type || 'word',
          data,
          created_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
          views: 0
        })
      
      if (error) {
        console.warn('Database storage failed, using cache:', error)
        // Fall back to in-memory storage
      }
    } catch (dbError) {
      console.warn('Database not available, using in-memory cache')
    }
    
    // Also store in cache for quick access
    const shareData = {
      id,
      term,
      type,
      data,
      createdAt: now.getTime(),
      expiresAt: expiresAt.getTime(),
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
  }, rateLimits.api)
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const { searchParams } = new URL(req.url)
      const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Share ID required' }, { status: 400 })
    }
    
    // Check cache first
    let shareData = shareCache.get(id)
    
    // If not in cache, try database
    if (!shareData) {
      const supabase = supabaseAdmin()
      
      try {
        const { data, error } = await supabase
          .from('shared_analyses')
          .select('*')
          .eq('id', id)
          .single()
        
        if (!error && data) {
          // Update views in database
          await supabase
            .from('shared_analyses')
            .update({ views: (data.views || 0) + 1 })
            .eq('id', id)
          
          shareData = {
            id: data.id,
            term: data.term,
            type: data.type,
            data: data.data,
            createdAt: new Date(data.created_at).getTime(),
            expiresAt: new Date(data.expires_at).getTime(),
            views: data.views + 1
          }
          
          // Add to cache
          shareCache.set(id, shareData)
        }
      } catch (dbError) {
        console.warn('Database fetch failed:', dbError)
      }
    }
    
    if (!shareData) {
      return NextResponse.json({ error: 'Share not found or expired' }, { status: 404 })
    }
    
    // Check if expired
    if (Date.now() > shareData.expiresAt) {
      shareCache.delete(id)
      
      // Also delete from database
      try {
        const supabase = supabaseAdmin()
        await supabase
          .from('shared_analyses')
          .delete()
          .eq('id', id)
      } catch (dbError) {
        console.warn('Could not delete expired share from database:', dbError)
      }
      
      return NextResponse.json({ error: 'Share link has expired' }, { status: 410 })
    }
    
    // Increment view count in cache
    shareData.views++
    
    return NextResponse.json(shareData)
    } catch (error) {
      console.error('Share fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch share' }, { status: 500 })
    }
  }, rateLimits.read)
}

// Cleanup expired shares periodically
export async function DELETE(req: NextRequest) {
  try {
    const supabase = supabaseAdmin()
    const now = new Date()
    
    // Delete expired shares from database
    const { error } = await supabase
      .from('shared_analyses')
      .delete()
      .lt('expires_at', now.toISOString())
    
    if (error) {
      console.error('Cleanup error:', error)
      return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
    }
    
    return NextResponse.json({ message: 'Expired shares cleaned up' })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}