'use client'
import { useState, useEffect, Suspense } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

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
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing vibes...</p>
        </Card>
      </div>
    )
  }

  if (!comparisonData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground flex items-center justify-center">
        <Card className="text-center p-8">
          <CardContent>
            <p className="text-xl mb-4">No comparison data</p>
            <Button asChild>
              <Link href="/">
                ← Back to search
              </Link>
            </Button>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" asChild>
              <Link href="/" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </Link>
            </Button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Vibe Comparison</h1>
            <div className="w-20" />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Narrative */}
        {comparisonData.narrative && (
          <Card className="mb-8 bg-gradient-to-r from-purple-50/10 to-pink-50/10 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800">
            <CardContent className="pt-6">
              <p className="text-lg italic text-muted-foreground">"{comparisonData.narrative}"</p>
            </CardContent>
          </Card>
        )}

        {/* Legend */}
        <Card className="mb-8">
          <CardContent className="flex flex-wrap gap-3 justify-center pt-6">
            {comparisonData.results.map((r: any, i: number) => (
              <Badge key={r.term} variant="outline" className="text-base py-2 px-4">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: colors[i % colors.length] }} 
                />
                {r.term}
              </Badge>
            ))}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Overlaid Vibes</CardTitle>
              <CardDescription>Multi-dimensional comparison visualization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="hsl(var(--muted-foreground))" />
                    <PolarAngleAxis dataKey="axis" stroke="hsl(var(--muted-foreground))" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="hsl(var(--muted-foreground))" />
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
            </CardContent>
          </Card>

          {/* Distance Matrix */}
          <Card>
            <CardHeader>
              <CardTitle>Vibe Distances</CardTitle>
              <CardDescription>Semantic similarity measurements</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(comparisonData.distanceMatrix).map(([term1, distances]: [string, any]) => (
                  Object.entries(distances).map(([term2, distance]: [string, any]) => 
                    term1 !== term2 && term1 < term2 ? (
                      <div key={`${term1}-${term2}`} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{term1}</span>
                          <span className="text-muted-foreground">↔</span>
                          <span className="font-medium">{term2}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-3 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div 
                              className="h-full transition-all duration-500 rounded-full"
                              style={{
                                width: `${(2 - distance) * 50}%`,
                                backgroundColor: distance < 0.5 ? 'hsl(142 76% 36%)' : distance < 1.0 ? 'hsl(45 93% 47%)' : 'hsl(0 84% 60%)'
                              }}
                            />
                          </div>
                          <Badge variant={distance < 0.5 ? 'default' : distance < 1.0 ? 'secondary' : 'destructive'}>
                            {distance.toFixed(2)}
                          </Badge>
                        </div>
                      </div>
                    ) : null
                  )
                ))}
                <p className="text-xs text-muted-foreground mt-4">
                  0 = identical vibes • 2 = opposite vibes
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Axis Breakdown */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Axis Breakdown</CardTitle>
            <CardDescription>Individual dimension scores for each term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Object.keys(comparisonData.results[0].axes).map(axis => (
                <div key={axis} className="space-y-3">
                  <h3 className="text-sm font-semibold text-muted-foreground capitalize border-b pb-1">{axis}</h3>
                  {comparisonData.results.map((r: any, i: number) => (
                    <div key={r.term} className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: colors[i % colors.length] }} 
                      />
                      <span className="text-sm flex-1">{r.term}</span>
                      <Badge variant={r.axes[axis] > 0 ? 'default' : 'destructive'} className="text-xs font-mono">
                        {r.axes[axis] > 0 ? '+' : ''}{(r.axes[axis] * 100).toFixed(0)}
                      </Badge>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="mt-8">
          <CardContent className="flex justify-center gap-4 pt-6">
            <Button variant="outline" asChild>
              <Link href="/">
                New Search
              </Link>
            </Button>
            <Button
              onClick={() => {
                // Share functionality
                const url = window.location.href
                navigator.clipboard.writeText(url)
                alert('Comparison link copied!')
              }}
            >
              Share Comparison
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default function ComparePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 text-foreground flex items-center justify-center">
        <Card className="text-center p-8">
          <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    }>
      <CompareContent />
    </Suspense>
  )
}