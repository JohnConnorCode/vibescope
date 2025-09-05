'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { saveAnalysis, toggleFavorite } from '@/lib/supabase/save-analysis'
import { 
  Heart, Share2, Download, TrendingUp, Calendar, 
  BookOpen, Target, Lightbulb, ChevronRight, Save,
  Clock, BarChart3, MessageSquare, Tag
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EnhancedResultsProps {
  analysisType: 'word' | 'sentence'
  data: any
  vibeData: any
}

export function EnhancedResults({ analysisType, data, vibeData }: EnhancedResultsProps) {
  const { user } = useAuth()
  const [isSaved, setIsSaved] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [savedId, setSavedId] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [showNotesInput, setShowNotesInput] = useState(false)
  const [relatedAnalyses, setRelatedAnalyses] = useState<any[]>([])
  const [insights, setInsights] = useState<string[]>([])

  useEffect(() => {
    if (user && vibeData) {
      handleAutoSave()
      generateInsights()
    }
  }, [user, vibeData])

  const handleAutoSave = async () => {
    if (!user || isSaved) return

    const analysisData = {
      type: analysisType,
      input: vibeData.term,
      axes: vibeData.axes,
      manipulation: vibeData.propaganda,
      neighbors: vibeData.neighbors
    }

    const result: any = await saveAnalysis(analysisData)
    if (result && result.data) {
      setIsSaved(true)
      setSavedId(result.data.id)
    }
  }

  const handleToggleFavorite = async () => {
    if (!savedId) return
    
    const result = await toggleFavorite(savedId)
    if (result.success) {
      setIsFavorite(!isFavorite)
    }
  }

  const generateInsights = () => {
    const newInsights = []
    
    if (vibeData.axes) {
      // Find the strongest dimension
      const dimensions = Object.entries(vibeData.axes)
      const strongest = dimensions.reduce((max, [key, value]) => 
        Math.abs(value as number) > Math.abs(max[1] as number) ? [key, value] : max
      )
      
      if (Math.abs(strongest[1] as number) > 0.7) {
        newInsights.push(`Strong ${strongest[0].replace('_', ' ')} characteristics detected`)
      }
      
      // Check for balance
      const balanced = dimensions.filter(([_, value]) => Math.abs(value as number) < 0.2)
      if (balanced.length > 6) {
        newInsights.push('This shows remarkably balanced characteristics across dimensions')
      }
    }
    
    if (vibeData.propaganda && vibeData.propaganda.overallManipulation > 60) {
      newInsights.push('High manipulation score - approach with critical thinking')
    }
    
    setInsights(newInsights)
  }

  const handleExport = () => {
    const exportData = {
      term: vibeData.term,
      type: analysisType,
      axes: vibeData.axes,
      manipulation: vibeData.propaganda,
      timestamp: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibescope-${vibeData.term}-${Date.now()}.json`
    a.click()
  }

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/?q=${encodeURIComponent(vibeData.term)}`
    
    if (navigator.share) {
      await navigator.share({
        title: `VibeScope Analysis: ${vibeData.term}`,
        text: `Check out the semantic analysis of "${vibeData.term}"`,
        url: shareUrl
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      alert('Link copied to clipboard!')
    }
  }

  if (!user) return null

  return (
    <div className="space-y-6 mt-6">
      {/* Action Bar */}
      <Card 
        className="p-4"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            {isSaved && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full" 
                style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}>
                <Save className="h-4 w-4" style={{ color: '#10b981' }} />
                <span className="text-sm" style={{ color: '#10b981' }}>Saved</span>
              </div>
            )}
            
            <Button
              onClick={handleToggleFavorite}
              variant="ghost"
              size="sm"
              className={isFavorite ? 'text-red-500' : ''}
              disabled={!isSaved}
            >
              <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
              {isFavorite ? 'Favorited' : 'Favorite'}
            </Button>
            
            <Button
              onClick={handleShare}
              variant="ghost"
              size="sm"
            >
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
            
            <Button
              onClick={handleExport}
              variant="ghost"
              size="sm"
            >
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
          
          <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
            <Clock className="h-3 w-3" />
            <span>Analyzed {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </Card>

      {/* Insights Panel */}
      {insights.length > 0 && (
        <Card 
          className="p-4"
          style={{ 
            backgroundColor: 'rgba(103, 232, 249, 0.05)',
            border: '1px solid rgba(103, 232, 249, 0.2)'
          }}
        >
          <div className="flex items-start gap-3">
            <Lightbulb className="h-5 w-5 mt-0.5" style={{ color: '#67e8f9' }} />
            <div className="flex-1">
              <h3 className="font-semibold mb-2" style={{ color: 'white' }}>
                AI Insights
              </h3>
              <ul className="space-y-2">
                {insights.map((insight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ChevronRight className="h-4 w-4 mt-0.5" style={{ color: '#67e8f9' }} />
                    <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                      {insight}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* Notes and Tags */}
      <Card 
        className="p-4"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="space-y-4">
          <div>
            <button
              onClick={() => setShowNotesInput(!showNotesInput)}
              className="flex items-center gap-2 text-sm font-medium"
              style={{ color: 'rgba(255, 255, 255, 0.9)' }}
            >
              <MessageSquare className="h-4 w-4" />
              Add Notes
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${showNotesInput ? 'rotate-90' : ''}`} 
              />
            </button>
            
            {showNotesInput && (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add your thoughts about this analysis..."
                className="w-full mt-2 p-3 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
                rows={3}
              />
            )}
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Tag className="h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              <span className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                Tags
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-2 py-1 rounded-full text-xs"
                  style={{
                    backgroundColor: 'rgba(139, 92, 246, 0.2)',
                    color: '#c4b5fd'
                  }}
                >
                  #{tag}
                </span>
              ))}
              <button
                onClick={() => {
                  const newTag = prompt('Add a tag:')
                  if (newTag) setTags([...tags, newTag])
                }}
                className="px-2 py-1 rounded-full text-xs border border-dashed"
                style={{
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'rgba(255, 255, 255, 0.5)'
                }}
              >
                + Add Tag
              </button>
            </div>
          </div>
        </div>
      </Card>

      {/* Historical Comparison */}
      <Card 
        className="p-4"
        style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" style={{ color: '#c4b5fd' }} />
            <h3 className="font-semibold" style={{ color: 'white' }}>
              Compare with Previous
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = '/history'}
          >
            View All
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
        
        <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Compare this analysis with your previous ones to spot patterns and trends.
        </p>
      </Card>

      {/* Recommendations */}
      <Card 
        className="p-4"
        style={{ 
          backgroundColor: 'rgba(249, 168, 212, 0.05)',
          border: '1px solid rgba(249, 168, 212, 0.2)'
        }}
      >
        <div className="flex items-start gap-3">
          <Target className="h-5 w-5 mt-0.5" style={{ color: '#f9a8d4' }} />
          <div>
            <h3 className="font-semibold mb-2" style={{ color: 'white' }}>
              Recommended Analyses
            </h3>
            <div className="space-y-2">
              {vibeData.neighbors?.slice(0, 3).map((neighbor: any, index: number) => (
                <button
                  key={index}
                  onClick={() => window.location.href = `/?q=${neighbor.term}`}
                  className="flex items-center gap-2 text-sm hover:underline"
                  style={{ color: 'rgba(255, 255, 255, 0.8)' }}
                >
                  <ChevronRight className="h-3 w-3" />
                  Analyze "{neighbor.term}" (similarity: {Math.round((1 - neighbor.distance) * 100)}%)
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}