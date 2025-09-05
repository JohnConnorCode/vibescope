'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Zap, Brain, Target, Lightbulb, ArrowRight, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AnalysisSuggestionsProps {
  currentTerm?: string
  onSuggestionClick: (term: string) => void
  analysisType?: 'word' | 'sentence'
}

interface Suggestion {
  term: string
  reason: string
  category: 'trending' | 'related' | 'opposite' | 'contextual' | 'advanced'
  icon: any
  color: string
}

export function AnalysisSuggestions({ currentTerm, onSuggestionClick, analysisType }: AnalysisSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Predefined suggestions for different categories
  const trendingSuggestions: Suggestion[] = [
    { term: 'artificial intelligence', reason: 'Explore AI terminology', category: 'trending', icon: Brain, color: '#8b5cf6' },
    { term: 'climate change', reason: 'Environmental language patterns', category: 'trending', icon: TrendingUp, color: '#10b981' },
    { term: 'democracy', reason: 'Political discourse analysis', category: 'trending', icon: Target, color: '#3b82f6' },
    { term: 'innovation', reason: 'Tech & progress language', category: 'trending', icon: Lightbulb, color: '#f59e0b' },
  ]

  const contextualPairs = [
    { base: 'love', opposite: 'hate', related: ['affection', 'passion', 'romance'] },
    { base: 'success', opposite: 'failure', related: ['achievement', 'victory', 'triumph'] },
    { base: 'peace', opposite: 'war', related: ['harmony', 'tranquility', 'calm'] },
    { base: 'truth', opposite: 'lie', related: ['honesty', 'facts', 'reality'] },
    { base: 'freedom', opposite: 'oppression', related: ['liberty', 'independence', 'autonomy'] },
  ]

  const sentenceSuggestions = [
    "This policy will create jobs and boost the economy significantly",
    "Studies show this is absolutely safe and effective",
    "Everyone knows this is the right thing to do",
    "We must act now or face dire consequences",
    "This is a historic opportunity we cannot afford to miss",
  ]

  useEffect(() => {
    generateSuggestions()
  }, [currentTerm, analysisType])

  const generateSuggestions = () => {
    setIsLoading(true)
    const newSuggestions: Suggestion[] = []

    if (analysisType === 'sentence') {
      // Sentence suggestions
      sentenceSuggestions.forEach((sentence, index) => {
        if (sentence !== currentTerm) {
          newSuggestions.push({
            term: sentence,
            reason: 'Analyze persuasion techniques',
            category: 'advanced',
            icon: Zap,
            color: '#ec4899'
          })
        }
      })
    } else {
      // Word suggestions
      if (currentTerm) {
        // Find contextual suggestions based on current term
        const pair = contextualPairs.find(p => 
          p.base.toLowerCase() === currentTerm.toLowerCase() ||
          p.opposite.toLowerCase() === currentTerm.toLowerCase()
        )

        if (pair) {
          // Add opposite
          const opposite = pair.base.toLowerCase() === currentTerm.toLowerCase() ? pair.opposite : pair.base
          newSuggestions.push({
            term: opposite,
            reason: 'Compare opposite meaning',
            category: 'opposite',
            icon: ArrowRight,
            color: '#ef4444'
          })

          // Add related terms
          pair.related.slice(0, 2).forEach(related => {
            newSuggestions.push({
              term: related,
              reason: 'Related concept',
              category: 'related',
              icon: Sparkles,
              color: '#67e8f9'
            })
          })
        }
      }

      // Add trending suggestions
      const filtered = trendingSuggestions.filter(s => s.term !== currentTerm)
      newSuggestions.push(...filtered.slice(0, 3))
    }

    setTimeout(() => {
      setSuggestions(newSuggestions.slice(0, 6))
      setIsLoading(false)
    }, 300)
  }

  if (suggestions.length === 0) return null

  return (
    <div className="glass-card-elevated p-6 animate-slide-up">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-semibold">Suggested Analyses</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="ghost"
            onClick={() => onSuggestionClick(suggestion.term)}
            className="glass-card hover:bg-white/10 p-4 h-auto flex items-start gap-3 text-left justify-start group transition-all hover:scale-[1.02]"
            disabled={isLoading}
          >
            <div 
              className="p-2 rounded-lg shrink-0"
              style={{ backgroundColor: `${suggestion.color}20` }}
            >
              <suggestion.icon 
                className="h-4 w-4 transition-transform group-hover:scale-110" 
                style={{ color: suggestion.color }} 
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-white/90 truncate">
                {analysisType === 'sentence' 
                  ? `"${suggestion.term.substring(0, 40)}..."` 
                  : suggestion.term}
              </p>
              <p className="text-xs text-white/60 mt-0.5">{suggestion.reason}</p>
            </div>
          </Button>
        ))}
      </div>

      {currentTerm && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <p className="text-xs text-white/50 text-center">
            Suggestions based on your current analysis
          </p>
        </div>
      )}
    </div>
  )
}