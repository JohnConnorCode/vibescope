'use client'
import { useState, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
import clsx from 'clsx'

export default function Page() {
  const [mode, setMode] = useState<'single' | 'compare'>('single')
  const [term, setTerm] = useState('vibes')
  const [compareTerms, setCompareTerms] = useState(['punk', 'zen'])
  const [loading, setLoading] = useState(false)
  const [axes, setAxes] = useState<Record<string, number> | null>(null)
  const [neighbors, setNeighbors] = useState<Array<{ term: string; distance: number; freq: number }>>([])
  const [narrative, setNarrative] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [shareUrl, setShareUrl] = useState<string>('')
  const [showShareModal, setShowShareModal] = useState(false)
  
  // Comparison data
  const [comparisonData, setComparisonData] = useState<any>(null)
  
  // Temporal data
  const [temporalData, setTemporalData] = useState<any>(null)
  const [showTemporal, setShowTemporal] = useState(false)

  const fetchVibe = async (q?: string) => {
    const t = (q ?? term).trim()
    if (!t) return
    setLoading(true); setError(null)
    try {
      const res = await fetch(`/api/vibe?term=${encodeURIComponent(t)}`)
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setAxes(json.axes)
      setNeighbors(json.neighbors)
      
      // Get narration
      const narrativeRes = await fetch('/api/vibe/narrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term: t, axes: json.axes, neighbors: json.neighbors })
      })
      if (narrativeRes.ok) {
        const { narrative } = await narrativeRes.json()
        setNarrative(narrative)
      }
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally { setLoading(false) }
  }

  const fetchComparison = async () => {
    if (compareTerms.length < 2) return
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/vibe/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ terms: compareTerms })
      })
      if (!res.ok) throw new Error(await res.text())
      const json = await res.json()
      setComparisonData(json)
    } catch (e: any) {
      setError(e.message || 'Failed')
    } finally { setLoading(false) }
  }

  const shareVibe = async () => {
    if (!term || !axes) return
    try {
      const res = await fetch('/api/vibe/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          term, 
          axes, 
          neighbors, 
          nanoSummary: narrative 
        })
      })
      if (!res.ok) throw new Error('Failed to create share')
      const { shareUrl } = await res.json()
      setShareUrl(shareUrl)
      setShowShareModal(true)
    } catch (e: any) {
      setError('Failed to share')
    }
  }

  const fetchTemporalData = async (t: string) => {
    try {
      const res = await fetch(`/api/vibe/snapshot?term=${encodeURIComponent(t)}&days=30`)
      if (!res.ok) return
      const data = await res.json()
      if (data.snapshots?.length > 0) {
        setTemporalData(data)
        setShowTemporal(true)
      }
    } catch (e) {
      console.error('Temporal fetch failed:', e)
    }
  }

  const saveSnapshot = async () => {
    if (!term) return
    try {
      await fetch('/api/vibe/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ term })
      })
      // Refresh temporal data
      fetchTemporalData(term)
    } catch (e) {
      console.error('Snapshot failed:', e)
    }
  }

  const radarData = axes ? Object.entries(axes).map(([k, v]) => ({ axis: k, score: (v + 1) * 50 })) : []
  
  // Prepare comparison radar data
  const comparisonRadarData = comparisonData?.results ? 
    Object.keys(comparisonData.results[0].axes).map(axis => ({
      axis,
      ...comparisonData.results.reduce((acc: any, r: any) => ({
        ...acc,
        [r.term]: (r.axes[axis] + 1) * 50
      }), {})
    })) : []

  return (
    <div className="min-h-dvh bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              VibeScope
            </h1>
            <p className="text-neutral-400 mt-1">Inspect the vibes of any word with semantic embeddings.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('single')}
              className={clsx("px-4 py-2 rounded-lg transition", mode === 'single' ? 'bg-purple-600' : 'bg-neutral-800 hover:bg-neutral-700')}
            >Single</button>
            <button
              onClick={() => setMode('compare')}
              className={clsx("px-4 py-2 rounded-lg transition", mode === 'compare' ? 'bg-purple-600' : 'bg-neutral-800 hover:bg-neutral-700')}
            >Compare</button>
          </div>
        </div>

        {mode === 'single' ? (
          <>
            <div className="flex gap-2">
              <input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchVibe()}
                className="flex-1 rounded-2xl bg-neutral-900 border border-neutral-800 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Type a word or short phrase"
              />
              <button
                onClick={() => fetchVibe()}
                disabled={loading}
                className={clsx("rounded-2xl px-5 py-3 font-medium shadow", loading ? 'bg-neutral-800' : 'bg-purple-600 hover:bg-purple-500')}
              >{loading ? 'Thinking…' : 'Reveal vibe'}</button>
            </div>

            {narrative && (
              <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800/30">
                <p className="text-lg italic text-neutral-200">"{narrative}"</p>
              </div>
            )}

            {axes && (
              <>
                <div className="mt-6 flex gap-2">
                  <button
                    onClick={shareVibe}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                    </svg>
                    Share vibe
                  </button>
                  <button
                    onClick={saveSnapshot}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                  >
                    Save snapshot
                  </button>
                  <button
                    onClick={() => fetchTemporalData(term)}
                    className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                  >
                    View history
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-neutral-800 p-4">
                    <h2 className="font-semibold mb-3">Vibe profile</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={radarData} outerRadius="80%">
                          <PolarGrid stroke="#525252" />
                          <PolarAngleAxis dataKey="axis" stroke="#a3a3a3" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" />
                          <Radar name="vibe" dataKey="score" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <ul className="mt-4 text-sm text-neutral-300 space-y-1">
                      {Object.entries(axes).map(([k, v]) => (
                        <li key={k} className="flex justify-between">
                          <span>{k}</span>
                          <span className={v > 0 ? 'text-green-400' : 'text-red-400'}>{v.toFixed(2)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 p-4">
                    <h2 className="font-semibold mb-3">Nearest neighbors</h2>
                    <ul className="text-neutral-300 text-sm grid grid-cols-2 gap-2">
                      {neighbors?.map((n: any) => (
                        <li key={n.term}>
                          <button
                            onClick={() => { setTerm(n.term); fetchVibe(n.term) }}
                            className="w-full text-left rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 hover:border-purple-700 transition"
                          >{n.term}</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <>
            <div className="space-y-2">
              {compareTerms.map((t, i) => (
                <input
                  key={i}
                  value={t}
                  onChange={(e) => {
                    const updated = [...compareTerms]
                    updated[i] = e.target.value
                    setCompareTerms(updated)
                  }}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder={`Term ${i + 1}`}
                />
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() => setCompareTerms([...compareTerms, ''])}
                  className="px-4 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                >+ Add term</button>
                <button
                  onClick={fetchComparison}
                  disabled={loading}
                  className={clsx("px-5 py-2 rounded-lg font-medium", loading ? 'bg-neutral-800' : 'bg-purple-600 hover:bg-purple-500')}
                >Compare vibes</button>
              </div>
            </div>

            {comparisonData && (
              <>
                {comparisonData.narrative && (
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/20 to-pink-900/20 border border-purple-800/30">
                    <p className="text-lg italic text-neutral-200">"{comparisonData.narrative}"</p>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-neutral-800 p-4">
                    <h2 className="font-semibold mb-3">Comparison radar</h2>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={comparisonRadarData} outerRadius="80%">
                          <PolarGrid stroke="#525252" />
                          <PolarAngleAxis dataKey="axis" stroke="#a3a3a3" />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#525252" />
                          {comparisonData.results.map((r: any, i: number) => (
                            <Radar
                              key={r.term}
                              name={r.term}
                              dataKey={r.term}
                              stroke={['#a855f7', '#ec4899', '#3b82f6', '#10b981'][i]}
                              fill={['#a855f7', '#ec4899', '#3b82f6', '#10b981'][i]}
                              fillOpacity={0.3}
                            />
                          ))}
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 flex gap-4 justify-center">
                      {comparisonData.results.map((r: any, i: number) => (
                        <div key={r.term} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full`} style={{
                            backgroundColor: ['#a855f7', '#ec4899', '#3b82f6', '#10b981'][i]
                          }} />
                          <span className="text-sm">{r.term}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-neutral-800 p-4">
                    <h2 className="font-semibold mb-3">Vibe distances</h2>
                    <div className="space-y-3">
                      {Object.entries(comparisonData.distanceMatrix).map(([term1, distances]: [string, any]) => (
                        Object.entries(distances).map(([term2, distance]: [string, any]) => 
                          term1 !== term2 && term1 < term2 ? (
                            <div key={`${term1}-${term2}`} className="flex justify-between items-center p-3 rounded-lg bg-neutral-900">
                              <span className="text-sm">{term1} ↔ {term2}</span>
                              <span className={clsx("text-sm font-mono", 
                                distance < 0.5 ? 'text-green-400' : 
                                distance < 1.0 ? 'text-yellow-400' : 
                                'text-red-400'
                              )}>{distance.toFixed(2)}</span>
                            </div>
                          ) : null
                        )
                      ))}
                    </div>
                    <p className="mt-3 text-xs text-neutral-500">0 = identical, 2 = opposite</p>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {showTemporal && temporalData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowTemporal(false)}>
            <div className="bg-neutral-900 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Temporal vibes for "{term}"</h3>
              {temporalData.snapshots.length > 0 && (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={temporalData.snapshots.map((s: any) => ({
                      date: new Date(s.captured_at).toLocaleDateString(),
                      ...s.axes
                    }))}>
                      <XAxis dataKey="date" stroke="#a3a3a3" />
                      <YAxis stroke="#a3a3a3" />
                      <Tooltip contentStyle={{ backgroundColor: '#171717' }} />
                      {Object.keys(temporalData.snapshots[0].axes).map((axis, i) => (
                        <Line 
                          key={axis}
                          type="monotone" 
                          dataKey={axis} 
                          stroke={['#a855f7', '#ec4899', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'][i]}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {temporalData.drift && (
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Drift over time:</h4>
                  <div className="space-y-1">
                    {Object.entries(temporalData.drift).map(([axis, drift]: [string, any]) => (
                      <div key={axis} className="flex justify-between text-sm">
                        <span>{axis}</span>
                        <span className={drift > 0 ? 'text-green-400' : 'text-red-400'}>
                          {drift > 0 ? '+' : ''}{(drift * 100).toFixed(0)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowTemporal(false)}
                className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
              >Close</button>
            </div>
          </div>
        )}

        {showShareModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50" onClick={() => setShowShareModal(false)}>
            <div className="bg-neutral-900 rounded-2xl p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
              <h3 className="text-xl font-semibold mb-4">Share this vibe</h3>
              <input
                value={shareUrl}
                readOnly
                className="w-full rounded-lg bg-neutral-800 px-3 py-2 text-sm"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  setShowShareModal(false)
                }}
                className="mt-4 w-full px-4 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg"
              >Copy to clipboard</button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-red-400">{error}</p>}

        {!axes && !comparisonData && (
          <div className="mt-10 text-neutral-400">
            <p>Try: "capitalism", "punk", "zen", "security", "play".</p>
          </div>
        )}
      </div>
    </div>
  )
}