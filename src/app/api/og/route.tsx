// src/app/api/og/route.tsx
import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const term = searchParams.get('term') || 'vibes'
    const axes = JSON.parse(searchParams.get('axes') || '{}')
    const neighbors = JSON.parse(searchParams.get('neighbors') || '[]').slice(0, 4)
    const summary = searchParams.get('summary') || ''

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0a0a',
            backgroundImage: 'radial-gradient(circle at 25% 25%, #1e293b 0%, transparent 50%), radial-gradient(circle at 75% 75%, #312e81 0%, transparent 50%)'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px',
              maxWidth: '900px'
            }}
          >
            {/* Title */}
            <h1
              style={{
                fontSize: '72px',
                fontWeight: 'bold',
                background: 'linear-gradient(to right, #a855f7, #ec4899)',
                backgroundClip: 'text',
                color: 'transparent',
                margin: '0',
                marginBottom: '20px'
              }}
            >
              {term}
            </h1>

            {/* Summary */}
            {summary && (
              <p
                style={{
                  fontSize: '24px',
                  color: '#e5e5e5',
                  textAlign: 'center',
                  marginBottom: '40px',
                  fontStyle: 'italic',
                  maxWidth: '700px'
                }}
              >
                "{summary}"
              </p>
            )}

            {/* Vibe Scores */}
            <div
              style={{
                display: 'flex',
                gap: '30px',
                marginBottom: '40px',
                flexWrap: 'wrap',
                justifyContent: 'center'
              }}
            >
              {Object.entries(axes).slice(0, 6).map(([axis, score]) => (
                <div
                  key={axis}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '15px 25px',
                    background: 'rgba(168, 85, 247, 0.1)',
                    border: '1px solid rgba(168, 85, 247, 0.3)',
                    borderRadius: '12px'
                  }}
                >
                  <span style={{ color: '#a5a5a5', fontSize: '14px', marginBottom: '4px' }}>
                    {axis}
                  </span>
                  <span
                    style={{
                      color: Number(score) > 0 ? '#10b981' : '#ef4444',
                      fontSize: '20px',
                      fontWeight: 'bold'
                    }}
                  >
                    {Number(score) > 0 ? '+' : ''}{(Number(score) * 100).toFixed(0)}
                  </span>
                </div>
              ))}
            </div>

            {/* Neighbors */}
            {neighbors.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <span style={{ color: '#737373', fontSize: '16px' }}>Similar vibes:</span>
                <div style={{ display: 'flex', gap: '15px' }}>
                  {neighbors.map((n: any) => (
                    <span
                      key={n.term}
                      style={{
                        padding: '8px 16px',
                        background: 'rgba(255, 255, 255, 0.1)',
                        borderRadius: '20px',
                        color: '#e5e5e5',
                        fontSize: '18px'
                      }}
                    >
                      {n.term}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div
              style={{
                position: 'absolute',
                bottom: '30px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <span style={{ color: '#737373', fontSize: '18px' }}>vibescope.ai</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (e: any) {
    console.log(`Error generating image: ${e.message}`)
    return new Response('Failed to generate image', { status: 500 })
  }
}