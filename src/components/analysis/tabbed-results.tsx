'use client'

import { useState, useMemo } from 'react'
import { 
  Brain, Shield, BarChart3, TrendingUp, AlertTriangle,
  Info, ChevronRight, Layers, Eye, Target, Activity
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { RadarChart } from '@/components/visualization/radar-chart'
import { AXES } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface TabbedResultsProps {
  vibeData: any
  analysisType: 'word' | 'sentence'
  isLoading?: boolean
}

export function TabbedResults({ vibeData, analysisType, isLoading }: TabbedResultsProps) {
  const [activeTab, setActiveTab] = useState(analysisType === 'sentence' ? 'manipulation' : 'overview')
  
  // Process data for visualization
  const radarData = useMemo(() => {
    if (!vibeData?.axes) return []
    
    return Object.entries(vibeData.axes).map(([k, v]) => {
      const axis = AXES.find(a => a.key === k)
      const axisLabel = axis ? axis.label.split(' (')[0] : k
      return {
        axis: axisLabel,
        fullAxis: axis?.label || k,
        score: Math.max(0, Math.min(100, (v + 1) * 50)),
        rawScore: v
      }
    })
  }, [vibeData?.axes])

  // Get top dimensions
  const topDimensions = useMemo(() => {
    if (!vibeData?.axes) return []
    
    return Object.entries(vibeData.axes)
      .map(([key, value]) => ({
        key,
        value: value as number,
        label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        percentage: Math.round(Math.abs(value as number) * 100)
      }))
      .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
      .slice(0, 5)
  }, [vibeData?.axes])

  // Get manipulation data
  const manipulationData = useMemo(() => {
    if (!vibeData?.propaganda) return null
    
    const score = vibeData.propaganda.overallManipulation || 0
    const techniques = vibeData.propaganda.techniques || []
    
    return {
      score,
      level: score > 70 ? 'High' : score > 40 ? 'Moderate' : 'Low',
      color: score > 70 ? 'text-red-400' : score > 40 ? 'text-orange-400' : 'text-green-400',
      bgColor: score > 70 ? 'bg-red-500/10' : score > 40 ? 'bg-orange-500/10' : 'bg-green-500/10',
      techniques
    }
  }, [vibeData?.propaganda])

  const tabs = analysisType === 'sentence' 
    ? [
        { id: 'manipulation', label: 'Manipulation', icon: Shield },
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'dimensions', label: 'Dimensions', icon: Layers },
        { id: 'visualization', label: 'Chart', icon: BarChart3 }
      ]
    : [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'dimensions', label: 'Dimensions', icon: Layers },
        { id: 'visualization', label: 'Chart', icon: BarChart3 },
        { id: 'similar', label: 'Similar', icon: Target }
      ]

  if (isLoading) {
    return (
      <Card className="glass-card-elevated">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="loading-spinner w-8 h-8" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!vibeData) return null

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex justify-center">
        <div className="glass-card p-1 inline-flex gap-1">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-2 transition-all flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-white/10 text-white" 
                  : "text-white/60 hover:text-white/80"
              )}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <Card className="glass-card-elevated">
        <CardContent className="p-6">
          {/* Manipulation Tab (Sentences) */}
          {activeTab === 'manipulation' && manipulationData && (
            <div className="space-y-6">
              {/* Score Header */}
              <div className="text-center">
                <div className={cn(
                  "inline-flex items-center justify-center w-32 h-32 rounded-full mb-4",
                  manipulationData.bgColor
                )}>
                  <div className="text-center">
                    <div className={cn("text-4xl font-bold", manipulationData.color)}>
                      {Math.round(manipulationData.score)}%
                    </div>
                    <div className="text-sm text-white/60 mt-1">
                      {manipulationData.level} Risk
                    </div>
                  </div>
                </div>
                
                {manipulationData.techniques.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-white/80 mb-3">
                      Detected Techniques
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {manipulationData.techniques.map((tech, i) => (
                        <span key={i} className="chip flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          {tech.replace(/([A-Z])/g, ' $1').trim()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-semibold mb-2">
                  {analysisType === 'word' ? 'Word' : 'Text'} Analysis
                </h3>
                <p className="text-white/60 text-sm">
                  "{vibeData.term}"
                </p>
              </div>

              {/* Key Insights */}
              <div className="grid gap-4">
                {topDimensions.slice(0, 3).map((dim, i) => (
                  <div key={i} className="glass-card p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-2 h-2 rounded-full",
                          i === 0 ? "bg-purple-400" : i === 1 ? "bg-blue-400" : "bg-green-400"
                        )} />
                        <span className="font-medium">{dim.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "text-sm font-semibold",
                          dim.value > 0 ? "text-green-400" : "text-orange-400"
                        )}>
                          {dim.value > 0 ? '+' : ''}{(dim.value * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all"
                          style={{ width: `${dim.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary Stats */}
              {analysisType === 'sentence' && manipulationData && (
                <div className="mt-6 p-4 glass-card border-l-4 border-orange-400">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-4 w-4 text-orange-400" />
                    <span className="font-semibold">Manipulation Score</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={cn("text-2xl font-bold", manipulationData.color)}>
                      {Math.round(manipulationData.score)}%
                    </span>
                    <span className="text-sm text-white/60">
                      {manipulationData.level} manipulation detected
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dimensions Tab */}
          {activeTab === 'dimensions' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Semantic Dimensions</h3>
              {topDimensions.map((dim, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{dim.label}</span>
                    <span className={cn(
                      "text-sm font-semibold",
                      dim.value > 0 ? "text-purple-400" : "text-blue-400"
                    )}>
                      {dim.value > 0 ? '+' : ''}{(dim.value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        dim.value > 0 
                          ? "bg-gradient-to-r from-purple-500 to-purple-400" 
                          : "bg-gradient-to-r from-blue-500 to-blue-400"
                      )}
                      style={{ 
                        width: `${dim.percentage}%`,
                        marginLeft: dim.value < 0 ? `${50 - dim.percentage/2}%` : '50%'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Visualization Tab */}
          {activeTab === 'visualization' && radarData.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-center mb-4">
                Semantic Radar
              </h3>
              <div className="h-96">
                <RadarChart data={radarData} />
              </div>
            </div>
          )}

          {/* Similar Words Tab */}
          {activeTab === 'similar' && vibeData.neighbors && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold mb-4">Similar Terms</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {vibeData.neighbors.slice(0, 12).map((neighbor: any, i: number) => (
                  <div 
                    key={i} 
                    className="glass-card p-3 hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    <div className="font-medium text-sm">{neighbor.term}</div>
                    <div className="text-xs text-white/50 mt-1">
                      {(neighbor.similarity * 100).toFixed(0)}% similar
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}