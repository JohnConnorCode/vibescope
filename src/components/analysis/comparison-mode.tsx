'use client'

import { useState } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, GitCompare, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react'
import { AXES } from '@/lib/axes'

interface ComparisonData {
  term: string
  axes: Record<string, number>
  color: string
}

interface ComparisonModeProps {
  initialTerm?: string
  initialData?: Record<string, number>
  onAnalyze: (term: string) => Promise<any>
}

export function ComparisonMode({ initialTerm, initialData, onAnalyze }: ComparisonModeProps) {
  const [comparisons, setComparisons] = useState<ComparisonData[]>(
    initialTerm && initialData 
      ? [{ term: initialTerm, axes: initialData, color: '#8b5cf6' }]
      : []
  )
  const [newTerm, setNewTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899']

  const addComparison = async () => {
    if (!newTerm.trim() || comparisons.length >= 6) return
    
    // Check if term already exists
    if (comparisons.some(c => c.term.toLowerCase() === newTerm.toLowerCase())) {
      setError('This term is already being compared')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await onAnalyze(newTerm)
      if (result && result.axes) {
        setComparisons([...comparisons, {
          term: newTerm,
          axes: result.axes,
          color: colors[comparisons.length % colors.length]
        }])
        setNewTerm('')
      }
    } catch (err) {
      setError('Failed to analyze term')
    } finally {
      setIsLoading(false)
    }
  }

  const removeComparison = (index: number) => {
    setComparisons(comparisons.filter((_, i) => i !== index))
  }

  // Prepare data for radar chart
  const radarData = AXES.map(axis => {
    const point: any = { axis: axis.label.split(' (')[0] }
    comparisons.forEach(comp => {
      point[comp.term] = Math.max(0, Math.min(100, (comp.axes[axis.key] + 1) * 50))
    })
    return point
  })

  // Calculate differences between terms
  const calculateDifferences = () => {
    if (comparisons.length < 2) return []
    
    const diffs: any[] = []
    AXES.forEach(axis => {
      const values = comparisons.map(c => c.axes[axis.key])
      const max = Math.max(...values)
      const min = Math.min(...values)
      const diff = max - min
      
      if (diff > 0.3) { // Significant difference threshold
        diffs.push({
          axis: axis.label,
          difference: Math.round(diff * 100),
          highest: comparisons[values.indexOf(max)].term,
          lowest: comparisons[values.indexOf(min)].term,
        })
      }
    })
    
    return diffs.sort((a, b) => b.difference - a.difference).slice(0, 5)
  }

  const differences = calculateDifferences()

  return (
    <div className="space-y-6">
      {/* Add Comparison Input */}
      <div className="glass-card-elevated p-6">
        <div className="flex items-center gap-2 mb-4">
          <GitCompare className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Comparison Mode</h3>
          <span className="text-sm text-white/60 ml-auto">
            {comparisons.length}/6 terms
          </span>
        </div>

        <div className="flex gap-2">
          <Input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder="Add term to compare..."
            className="input-dark"
            onKeyPress={(e) => e.key === 'Enter' && addComparison()}
            disabled={isLoading || comparisons.length >= 6}
          />
          <Button
            onClick={addComparison}
            disabled={!newTerm.trim() || isLoading || comparisons.length >= 6}
            className="btn-primary"
          >
            {isLoading ? (
              <div className="loading-spinner w-4 h-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add
          </Button>
        </div>

        {error && (
          <div className="mt-2 flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Current Comparisons */}
        {comparisons.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {comparisons.map((comp, index) => (
              <div
                key={index}
                className="chip px-3 py-1.5 flex items-center gap-2"
                style={{ borderColor: comp.color }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: comp.color }}
                />
                <span className="text-sm font-medium">{comp.term}</span>
                <button
                  onClick={() => removeComparison(index)}
                  className="ml-1 hover:text-red-400 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Visualization */}
      {comparisons.length > 1 && (
        <>
          {/* Radar Chart */}
          <div className="glass-card-elevated p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Semantic Comparison</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis 
                      dataKey="axis" 
                      tick={{ fontSize: 11, fill: 'var(--text-secondary)' }}
                    />
                    <PolarRadiusAxis 
                      domain={[0, 100]} 
                      tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    />
                    {comparisons.map((comp, index) => (
                      <Radar
                        key={index}
                        name={comp.term}
                        dataKey={comp.term}
                        stroke={comp.color}
                        fill={comp.color}
                        fillOpacity={0.1}
                        strokeWidth={2}
                      />
                    ))}
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="circle"
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </div>

          {/* Comparison Table */}
          <div className="glass-card-elevated p-6">
            <CardHeader className="px-0 pt-0">
              <CardTitle>Detailed Comparison Table</CardTitle>
            </CardHeader>
            <CardContent className="px-0 pb-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 font-medium text-white/70">Dimension</th>
                    {comparisons.map((comp, index) => (
                      <th key={index} className="text-center py-2 px-3 font-medium">
                        <div className="flex items-center justify-center gap-1">
                          <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: comp.color }}
                          />
                          <span>{comp.term}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {AXES.map((axis) => (
                    <tr key={axis.key} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-2 px-3 text-white/70">{axis.label}</td>
                      {comparisons.map((comp, index) => {
                        const value = comp.axes[axis.key] || 0
                        const normalized = ((value + 1) * 50)
                        const isHighest = Math.max(...comparisons.map(c => c.axes[axis.key] || 0)) === value
                        const isLowest = Math.min(...comparisons.map(c => c.axes[axis.key] || 0)) === value
                        
                        return (
                          <td key={index} className="text-center py-2 px-3">
                            <div className="flex flex-col items-center">
                              <span className={`font-mono text-sm ${
                                isHighest ? 'text-green-400 font-bold' : 
                                isLowest ? 'text-red-400' : 
                                'text-white/80'
                              }`}>
                                {value.toFixed(2)}
                              </span>
                              <div className="w-full bg-white/10 rounded-full h-1 mt-1">
                                <div 
                                  className="h-1 rounded-full transition-all"
                                  style={{ 
                                    width: `${Math.abs(normalized)}%`,
                                    backgroundColor: comp.color,
                                    marginLeft: value < 0 ? `${50 - Math.abs(normalized)}%` : '50%'
                                  }}
                                />
                              </div>
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </div>

          {/* Key Differences */}
          {differences.length > 0 && (
            <div className="glass-card-elevated p-6">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-400" />
                  Key Differences
                </CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <div className="space-y-3">
                  {differences.map((diff, index) => (
                    <div key={index} className="glass-card p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white/90">
                          {diff.axis}
                        </span>
                        <span className="text-sm font-bold text-purple-400">
                          {diff.difference}% difference
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3 text-green-400" />
                          <span className="text-green-400">{diff.highest}</span>
                        </div>
                        <Minus className="h-3 w-3 text-white/30" />
                        <div className="flex items-center gap-1">
                          <TrendingDown className="h-3 w-3 text-red-400" />
                          <span className="text-red-400">{diff.lowest}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {comparisons.length === 0 && (
        <div className="glass-card p-12 text-center">
          <GitCompare className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Start Comparing</h3>
          <p className="text-white/60 max-w-md mx-auto">
            Add multiple terms to compare their semantic profiles and discover interesting relationships
          </p>
        </div>
      )}

      {comparisons.length === 1 && (
        <div className="glass-card p-8 text-center">
          <p className="text-white/60">Add at least one more term to see comparison</p>
        </div>
      )}
    </div>
  )
}