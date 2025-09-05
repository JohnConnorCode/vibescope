'use client'
import { useState, useEffect, useCallback } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import clsx from 'clsx'
import { useDebounce, useVibeHistory, useVibeFavorites } from '@/lib/hooks'

// Demo vibes for onboarding
const DEMO_VIBES = ['punk', 'zen', 'capitalism', 'love', 'chaos']

interface CompareBasket {
  terms: string[]
  data: Record<string, any>
}

export default function V3Page() {
  const [term, setTerm] = useState('')
  const [axes, setAxes] = useState<Record<string, number> | null>(null)
  const [neighbors, setNeighbors] = useState<Array<{ term: string; distance: number }>>([])
  const [narrative, setNarrative] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [firstVisit, setFirstVisit] = useState(true)
  
  // Compare basket
  const [compareBasket, setCompareBasket] = useState<CompareBasket>({ terms: [], data: {} })
  const [showCompare, setShowCompare] = useState(false)
  
  // History and favorites
  const { history, addToHistory } = useVibeHistory()
  const { favorites, addFavorite, removeFavorite, isFavorite } = useVibeFavorites()
  const [showHistory, setShowHistory] = useState(false)
  
  // Debounce the search term
  const debouncedTerm = useDebounce(term, 400)

  // Fetch vibe data
  const fetchVibe = useCallback(async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setAxes(null)
      setNeighbors([])
      setNarrative('')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/vibe/instant?term=${encodeURIComponent(searchTerm)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      
      const data = await res.json()
      setAxes(data.axes)
      setNeighbors(data.neighbors || [])
      
      // Add to history
      addToHistory(searchTerm, data.axes)
      
      // Fetch narration async (if not cached)
      if (data.narrative) {
        setNarrative(data.narrative)
      } else {
        // Fetch narration separately
        fetch('/api/vibe/narrate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term: searchTerm, axes: data.axes, neighbors: data.neighbors })
        }).then(r => r.json()).then(d => {
          if (d.narrative) setNarrative(d.narrative)
        }).catch(() => {})
      }
    } catch (error) {
      console.error('Error fetching vibe:', error)
    } finally {
      setLoading(false)
    }
  }, [addToHistory])

  // Auto-fetch on debounced term change
  useEffect(() => {
    if (debouncedTerm) {
      fetchVibe(debouncedTerm)
    }
  }, [debouncedTerm, fetchVibe])

  // Check first visit
  useEffect(() => {
    const visited = localStorage.getItem('vibescope-visited')
    if (visited) {
      setFirstVisit(false)
    } else {
      localStorage.setItem('vibescope-visited', 'true')
    }
  }, [])

  // Add to compare basket
  const addToBasket = (term: string) => {
    if (!axes || compareBasket.terms.includes(term)) return
    setCompareBasket(prev => ({
      terms: [...prev.terms, term],
      data: { ...prev.data, [term]: axes }
    }))
  }

  // Remove from basket
  const removeFromBasket = (term: string) => {
    setCompareBasket(prev => ({
      terms: prev.terms.filter(t => t !== term),
      data: Object.fromEntries(Object.entries(prev.data).filter(([k]) => k !== term))
    }))
  }

  // Quick search from history/demo
  const quickSearch = (searchTerm: string) => {
    setTerm(searchTerm)
    setFirstVisit(false)
  }

  const radarData = axes ? Object.entries(axes).map(([k, v]) => ({ 
    axis: k, 
    score: (v + 1) * 50 
  })) : []

  // Determine axis colors
  const axisColors: Record<string, string> = {
    valence: '#10b981',
    arousal: '#f59e0b', 
    concrete: '#3b82f6',
    formality: '#8b5cf6',
    novelty: '#ec4899',
    trust: '#14b8a6'
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-neutral-100">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              VibeScope
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition"
                title="History"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                onClick={() => setShowCompare(!showCompare)}
                className="p-2 rounded-lg bg-neutral-800/50 hover:bg-neutral-700/50 transition relative"
                title="Compare basket"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {compareBasket.terms.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-purple-600 text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {compareBasket.terms.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Search Input */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder={firstVisit ? "Try 'punk' or 'zen' to start..." : "Type any word..."}
              className="w-full px-6 py-4 text-lg rounded-2xl bg-neutral-800/50 border border-neutral-700 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition"
              autoFocus
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
          
          {/* Demo vibes for first visit */}
          {firstVisit && (
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-neutral-500">Try:</span>
              {DEMO_VIBES.map(demo => (
                <button
                  key={demo}
                  onClick={() => quickSearch(demo)}
                  className="px-3 py-1 text-sm rounded-full bg-neutral-800/50 hover:bg-purple-600/20 border border-neutral-700 hover:border-purple-600 transition"
                >
                  {demo}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Narrative */}
        {narrative && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/10 to-pink-900/10 border border-purple-800/30">
            <p className="text-lg italic text-neutral-200">"{narrative}"</p>
          </div>
        )}

        {/* Main Content */}
        {axes && (
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Radar + Bars */}
            <div className="space-y-4">
              {/* Radar Chart */}
              <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-4">
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="80%">
                      <PolarGrid stroke="#525252" />
                      <PolarAngleAxis dataKey="axis" stroke="#a3a3a3" tick={{ fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" />
                      <Radar 
                        name="vibe" 
                        dataKey="score" 
                        stroke="#a855f7" 
                        fill="#a855f7" 
                        fillOpacity={0.6} 
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Sliders */}
              <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-4">
                <h3 className="text-sm font-medium text-neutral-400 mb-3">Vibe Breakdown</h3>
                <div className="space-y-3">
                  {Object.entries(axes).map(([axis, value]) => (
                    <div key={axis} className="flex items-center gap-3">
                      <span 
                        className="w-20 text-sm text-neutral-400 capitalize"
                        style={{ color: axisColors[axis] || '#a3a3a3' }}
                      >
                        {axis}
                      </span>
                      <div className="flex-1 flex items-center gap-2">
                        <div className="flex-1 h-2 bg-neutral-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full transition-all duration-500 ease-out"
                            style={{
                              width: `${Math.abs(value) * 50}%`,
                              marginLeft: value < 0 ? `${50 - Math.abs(value) * 50}%` : '50%',
                              backgroundColor: value > 0 ? '#10b981' : '#ef4444'
                            }}
                          />
                        </div>
                        <span className={clsx(
                          "text-xs font-mono w-10 text-right",
                          value > 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {value > 0 ? '+' : ''}{(value * 100).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => axes && term && addFavorite(term, axes, narrative)}
                  disabled={!term || isFavorite(term)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg transition flex items-center justify-center gap-2",
                    isFavorite(term) 
                      ? "bg-neutral-700 text-neutral-500 cursor-not-allowed" 
                      : "bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50"
                  )}
                >
                  <svg className="w-4 h-4" fill={isFavorite(term) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  {isFavorite(term) ? 'Favorited' : 'Favorite'}
                </button>
                <button
                  onClick={() => addToBasket(term)}
                  disabled={compareBasket.terms.includes(term)}
                  className={clsx(
                    "flex-1 py-2 rounded-lg transition",
                    compareBasket.terms.includes(term)
                      ? "bg-neutral-700 text-neutral-500 cursor-not-allowed"
                      : "bg-neutral-800 hover:bg-neutral-700"
                  )}
                >
                  {compareBasket.terms.includes(term) ? 'In basket' : 'Add to compare'}
                </button>
              </div>
            </div>

            {/* Right: Neighbors */}
            <div className="space-y-4">
              <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-4">
                <h3 className="text-sm font-medium text-neutral-400 mb-3">Similar Vibes</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {neighbors.map((n: any) => (
                    <button
                      key={n.term}
                      onClick={() => quickSearch(n.term)}
                      className="px-3 py-2 text-sm rounded-lg bg-neutral-800/50 hover:bg-purple-600/20 border border-neutral-700 hover:border-purple-600 transition"
                    >
                      {n.term}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recent History */}
              {history.length > 0 && (
                <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-4">
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">Recent</h3>
                  <div className="flex flex-wrap gap-2">
                    {history.slice(0, 6).map(h => (
                      <button
                        key={h.timestamp}
                        onClick={() => quickSearch(h.term)}
                        className="px-2 py-1 text-xs rounded bg-neutral-800 hover:bg-neutral-700 transition"
                      >
                        {h.term}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Favorites Preview */}
              {favorites.length > 0 && (
                <div className="rounded-2xl bg-neutral-800/30 border border-neutral-700/50 p-4">
                  <h3 className="text-sm font-medium text-neutral-400 mb-3">Favorites</h3>
                  <div className="flex flex-wrap gap-2">
                    {favorites.slice(0, 6).map(f => (
                      <button
                        key={f.term}
                        onClick={() => quickSearch(f.term)}
                        className="px-2 py-1 text-xs rounded bg-purple-900/30 hover:bg-purple-900/50 border border-purple-700/50 transition"
                      >
                        {f.term}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Compare Basket Modal */}
      {showCompare && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCompare(false)}>
          <div className="bg-neutral-900 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Compare Basket</h3>
            {compareBasket.terms.length === 0 ? (
              <p className="text-neutral-400">Add terms to compare their vibes</p>
            ) : (
              <div className="space-y-2 mb-4">
                {compareBasket.terms.map(t => (
                  <div key={t} className="flex items-center justify-between p-2 rounded-lg bg-neutral-800">
                    <span>{t}</span>
                    <button
                      onClick={() => removeFromBasket(t)}
                      className="text-red-400 hover:text-red-300"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            {compareBasket.terms.length >= 2 && (
              <button
                onClick={() => {
                  // Navigate to compare view
                  window.location.href = `/v3/compare?terms=${compareBasket.terms.join(',')}`
                }}
                className="w-full py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
              >
                Compare {compareBasket.terms.length} terms
              </button>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowHistory(false)}>
          <div className="bg-neutral-900 rounded-2xl p-6 max-w-2xl w-full max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">History & Favorites</h3>
            
            {favorites.length > 0 && (
              <>
                <h4 className="text-sm font-medium text-neutral-400 mb-2">Favorites</h4>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  {favorites.map(f => (
                    <button
                      key={f.term}
                      onClick={() => {
                        quickSearch(f.term)
                        setShowHistory(false)
                      }}
                      className="p-3 rounded-lg bg-purple-900/20 hover:bg-purple-900/30 border border-purple-700/50 text-left"
                    >
                      <div className="font-medium">{f.term}</div>
                      {f.narrative && (
                        <div className="text-xs text-neutral-400 mt-1 line-clamp-2">{f.narrative}</div>
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}

            <h4 className="text-sm font-medium text-neutral-400 mb-2">Recent Searches</h4>
            <div className="space-y-1">
              {history.map(h => (
                <button
                  key={h.timestamp}
                  onClick={() => {
                    quickSearch(h.term)
                    setShowHistory(false)
                  }}
                  className="w-full p-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-left flex justify-between items-center"
                >
                  <span>{h.term}</span>
                  <span className="text-xs text-neutral-500">
                    {new Date(h.timestamp).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}