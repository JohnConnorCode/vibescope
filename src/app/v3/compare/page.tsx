'use client'
import { useState, useEffect, Suspense } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

function CompareContent() {
  const searchParams = useSearchParams()
  const [comparisonData, setComparisonData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const terms = searchParams.get('terms')?.split(',') || []
    if (terms.length >= 2) {
      fetchComparison(terms)
    }
  }, [searchParams])

  const fetchComparison = async (terms: string[]) => {
    setLoading(true)
    try {
      const res = await fetch('/api/vibe/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms })
      })
      if (!res.ok) throw new Error('Failed to compare')
      const data = await res.json()
      setComparisonData(data)
    } catch (error) {
      console.error('Comparison error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Analyzing vibes...</p>
        </div>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">No comparison data</p>
          <Link href="/v3" className="text-purple-400 hover:text-purple-300">
            ← Back to search
          </Link>
        </div>
      </div>
    )
  }

  const colors = ['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444']
  
  const radarData = comparisonData.results ? 
    Object.keys(comparisonData.results[0].axes).map(axis => ({
      axis,
      ...comparisonData.results.reduce((acc: any, r: any, _i: number) => ({
        ...acc,
        [r.term]: (r.axes[axis] + 1) * 50
      }), {})
    })) : []

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/v3" className="flex items-center gap-2 text-neutral-400 hover:text-neutral-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back</span>
            </Link>
            <h1 className="text-xl font-bold">Vibe Comparison</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Narrative */}
        {comparisonData.narrative && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/10 to-pink-900/10 border border-purple-800/30">
            <p className="text-lg italic text-neutral-200">"{comparisonData.narrative}"</p>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-6 justify-center">
          {comparisonData.results.map((r: any, i: number) => (
            <div key={r.term} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-full" 
                style={{ backgroundColor: colors[i % colors.length] }} 
              />
              <span className="text-lg font-medium">{r.term}</span>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Overlaid Vibes</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#525252" />
                  <PolarAngleAxis dataKey="axis" stroke="#a3a3a3" />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" />
                  {comparisonData.results.map((r: any, i: number) => (
                    <Radar
                      key={r.term}
                      name={r.term}
                      dataKey={r.term}
                      stroke={colors[i % colors.length]}
                      fill={colors[i % colors.length]}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  ))}
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Distance Matrix */}
          <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-6">
            <h2 className="text-lg font-semibold mb-4">Vibe Distances</h2>
            <div className="space-y-3">
              {Object.entries(comparisonData.distanceMatrix).map(([term1, distances]: [string, any]) => (
                Object.entries(distances).map(([term2, distance]: [string, any]) => 
                  term1 !== term2 && term1 < term2 ? (
                    <div key={`${term1}-${term2}`} className="flex items-center justify-between p-3 rounded-lg bg-neutral-800/50">
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{term1}</span>
                        <span className="text-neutral-500">↔</span>
                        <span className="font-medium">{term2}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-24 h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500"
                            style={{
                              width: `${(2 - distance) * 50}%`,
                              backgroundColor: distance < 0.5 ? '#10b981' : distance < 1.0 ? '#f59e0b' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className={`text-sm font-mono ${
                          distance < 0.5 ? 'text-green-400' : 
                          distance < 1.0 ? 'text-yellow-400' : 
                          'text-red-400'
                        }`}>
                          {distance.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ) : null
                )
              ))}
              <p className="text-xs text-neutral-500 mt-3">
                0 = identical vibes • 2 = opposite vibes
              </p>
            </div>
          </div>
        </div>

        {/* Axis Breakdown */}
        <div className="mt-6 rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Axis Breakdown</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Object.keys(comparisonData.results[0].axes).map(axis => (
              <div key={axis} className="space-y-2">
                <h3 className="text-sm font-medium text-neutral-400 capitalize">{axis}</h3>
                {comparisonData.results.map((r: any, i: number) => (
                  <div key={r.term} className="flex items-center gap-2">
                    <div 
                      className="w-2 h-2 rounded-full" 
                      style={{ backgroundColor: colors[i % colors.length] }} 
                    />
                    <span className="text-xs flex-1">{r.term}</span>
                    <span className={`text-xs font-mono ${
                      r.axes[axis] > 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {r.axes[axis] > 0 ? '+' : ''}{(r.axes[axis] * 100).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-center gap-4">
          <Link 
            href="/v3" 
            className="px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
          >
            New Search
          </Link>
          <button
            onClick={() => {
              // Share functionality
              const url = window.location.href
              navigator.clipboard.writeText(url)
              alert('Comparison link copied!')
            }}
            className="px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-500 transition"
          >
            Share Comparison
          </button>
        </div>
      </main>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-400">Loading...</p>
        </div>
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}