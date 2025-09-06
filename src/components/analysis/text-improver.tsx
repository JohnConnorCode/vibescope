'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Edit3, 
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Shield,
  TrendingDown,
  RefreshCw,
  Copy,
  ThumbsUp,
  AlertTriangle
} from 'lucide-react'

interface TextImproverProps {
  originalText: string
  analysisResult: any
  onApplySuggestion?: (improvedText: string) => void
}

interface Suggestion {
  id: string
  type: 'clarity' | 'neutrality' | 'persuasion' | 'safety'
  title: string
  description: string
  original: string
  improved: string
  impact: 'high' | 'medium' | 'low'
  icon: any
}

export function TextImprover({ originalText, analysisResult, onApplySuggestion }: TextImproverProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null)
  const [improvedText, setImprovedText] = useState(originalText)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    if (analysisResult) {
      generateSuggestions()
    }
  }, [analysisResult])

  const generateSuggestions = () => {
    setIsGenerating(true)
    
    setTimeout(() => {
      const newSuggestions: Suggestion[] = []
      
      // Check for manipulation techniques and suggest improvements
      if (analysisResult.propaganda?.overallManipulation > 40) {
        // Fear tactics reduction
        if (analysisResult.propaganda.fearTactics > 50) {
          newSuggestions.push({
            id: 'fear-reduction',
            type: 'neutrality',
            title: 'Reduce Fear-Based Language',
            description: 'Replace fear-inducing words with more neutral alternatives',
            original: originalText,
            improved: improveTextForFear(originalText),
            impact: 'high',
            icon: Shield
          })
        }
        
        // Loaded language improvement
        if (analysisResult.propaganda.loadedLanguage > 50) {
          newSuggestions.push({
            id: 'loaded-language',
            type: 'neutrality',
            title: 'Neutralize Loaded Language',
            description: 'Replace emotionally charged words with objective terms',
            original: originalText,
            improved: neutralizeLoadedLanguage(originalText),
            impact: 'high',
            icon: TrendingDown
          })
        }
        
        // False dichotomy fix
        if (analysisResult.propaganda.falseDichotomy > 50) {
          newSuggestions.push({
            id: 'false-dichotomy',
            type: 'clarity',
            title: 'Add Nuance to Binary Thinking',
            description: 'Acknowledge multiple perspectives and options',
            original: originalText,
            improved: addNuanceToDichotomy(originalText),
            impact: 'medium',
            icon: Lightbulb
          })
        }
      }
      
      // General improvements based on text type
      if (originalText.length > 20) {
        // Clarity improvement
        newSuggestions.push({
          id: 'clarity',
          type: 'clarity',
          title: 'Improve Clarity',
          description: 'Simplify complex sentences and jargon',
          original: originalText,
          improved: improveClarity(originalText),
          impact: 'medium',
          icon: Edit3
        })
        
        // Persuasion enhancement (ethical)
        if (analysisResult.propaganda?.overallManipulation < 30) {
          newSuggestions.push({
            id: 'persuasion',
            type: 'persuasion',
            title: 'Enhance Persuasiveness (Ethically)',
            description: 'Add supporting evidence and logical structure',
            original: originalText,
            improved: enhancePersuasion(originalText),
            impact: 'low',
            icon: ThumbsUp
          })
        }
      }
      
      // Safety check for harmful content
      if (containsPotentiallyHarmfulContent(originalText)) {
        newSuggestions.push({
          id: 'safety',
          type: 'safety',
          title: 'Content Safety Review',
          description: 'Remove or rephrase potentially harmful content',
          original: originalText,
          improved: makeContentSafer(originalText),
          impact: 'high',
          icon: AlertTriangle
        })
      }
      
      setSuggestions(newSuggestions)
      setIsGenerating(false)
    }, 1500)
  }

  // Text improvement functions
  const improveTextForFear = (text: string): string => {
    let improved = text
    const fearWords = [
      ['catastrophic', 'significant'],
      ['destroy', 'affect'],
      ['dangerous', 'concerning'],
      ['crisis', 'challenge'],
      ['disaster', 'setback'],
      ['threat', 'consideration'],
      ['alarming', 'noteworthy'],
      ['terrifying', 'concerning']
    ]
    
    fearWords.forEach(([original, replacement]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi')
      improved = improved.replace(regex, replacement)
    })
    
    return improved
  }

  const neutralizeLoadedLanguage = (text: string): string => {
    let improved = text
    const loadedWords = [
      ['radical', 'different'],
      ['extreme', 'significant'],
      ['shocking', 'surprising'],
      ['outrageous', 'unusual'],
      ['insane', 'unusual'],
      ['crazy', 'unexpected'],
      ['horrible', 'negative'],
      ['amazing', 'positive'],
      ['incredible', 'notable'],
      ['unbelievable', 'remarkable']
    ]
    
    loadedWords.forEach(([original, replacement]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi')
      improved = improved.replace(regex, replacement)
    })
    
    return improved
  }

  const addNuanceToDichotomy = (text: string): string => {
    let improved = text
    
    // Add qualifying phrases
    if (improved.includes(' always ')) {
      improved = improved.replace(/ always /g, ' often ')
    }
    if (improved.includes(' never ')) {
      improved = improved.replace(/ never /g, ' rarely ')
    }
    if (improved.includes(' must ')) {
      improved = improved.replace(/ must /g, ' should consider ')
    }
    if (improved.includes(' only ')) {
      improved = improved.replace(/ only /g, ' primarily ')
    }
    
    // Add nuance phrases
    if (!improved.includes('however') && !improved.includes('although')) {
      improved += ' However, other perspectives may also be valid.'
    }
    
    return improved
  }

  const improveClarity = (text: string): string => {
    let improved = text
    
    // Simplify complex words
    const complexWords = [
      ['utilize', 'use'],
      ['implement', 'do'],
      ['facilitate', 'help'],
      ['optimize', 'improve'],
      ['leverage', 'use'],
      ['synergize', 'work together'],
      ['incentivize', 'encourage']
    ]
    
    complexWords.forEach(([original, replacement]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi')
      improved = improved.replace(regex, replacement)
    })
    
    // Break long sentences (simplified approach)
    if (improved.length > 100 && !improved.includes('. ')) {
      const midPoint = improved.length / 2
      const spaceIndex = improved.indexOf(' ', midPoint)
      if (spaceIndex > -1) {
        improved = improved.slice(0, spaceIndex) + '.' + improved.slice(spaceIndex)
      }
    }
    
    return improved
  }

  const enhancePersuasion = (text: string): string => {
    let improved = text
    
    // Add confidence phrases
    if (!improved.includes('research') && !improved.includes('studies')) {
      improved = 'Research suggests that ' + improved.toLowerCase()
    }
    
    // Add qualifying evidence
    if (!improved.includes('because') && !improved.includes('since')) {
      improved += ' This is important because it affects outcomes.'
    }
    
    return improved
  }

  const containsPotentiallyHarmfulContent = (text: string): boolean => {
    const harmfulPatterns = [
      'hate', 'violence', 'discriminat', 'racist', 'sexist',
      'harm', 'attack', 'kill', 'death threat'
    ]
    
    const lowerText = text.toLowerCase()
    return harmfulPatterns.some(pattern => lowerText.includes(pattern))
  }

  const makeContentSafer = (text: string): string => {
    // This is a simplified version - in production, use proper content moderation
    return '[Content has been moderated for safety. Please rephrase using constructive language.]'
  }

  const applySuggestion = (suggestion: Suggestion) => {
    setImprovedText(suggestion.improved)
    setSelectedSuggestion(suggestion.id)
    if (onApplySuggestion) {
      onApplySuggestion(suggestion.improved)
    }
  }

  const copyImprovedText = () => {
    navigator.clipboard.writeText(improvedText).then(() => {
      // Visual feedback could be added here
    })
  }

  if (!analysisResult || originalText.length < 5) {
    return null
  }

  return (
    <Card className="glass-card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Text Improvement Suggestions
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSuggestions}
            disabled={isGenerating}
            className="glass-card hover:bg-white/10"
          >
            <RefreshCw className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isGenerating ? (
          <div className="text-center py-8">
            <div className="loading-spinner mx-auto mb-4" />
            <p className="text-white/60">Analyzing text for improvements...</p>
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-4">
            {/* Suggestions List */}
            <div className="space-y-3">
              {suggestions.map((suggestion) => {
                const Icon = suggestion.icon
                return (
                  <div
                    key={suggestion.id}
                    className={`p-4 glass-card cursor-pointer transition-all hover:scale-[1.02] ${
                      selectedSuggestion === suggestion.id ? 'ring-2 ring-purple-400' : ''
                    }`}
                    onClick={() => applySuggestion(suggestion)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        suggestion.type === 'safety' ? 'bg-red-500/20' :
                        suggestion.type === 'neutrality' ? 'bg-blue-500/20' :
                        suggestion.type === 'clarity' ? 'bg-green-500/20' :
                        'bg-purple-500/20'
                      }`}>
                        <Icon className={`h-4 w-4 ${
                          suggestion.type === 'safety' ? 'text-red-400' :
                          suggestion.type === 'neutrality' ? 'text-blue-400' :
                          suggestion.type === 'clarity' ? 'text-green-400' :
                          'text-purple-400'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-medium">{suggestion.title}</h4>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            suggestion.impact === 'high' ? 'bg-red-500/20 text-red-400' :
                            suggestion.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {suggestion.impact} impact
                          </span>
                        </div>
                        <p className="text-sm text-white/60 mb-2">{suggestion.description}</p>
                        
                        {selectedSuggestion === suggestion.id && (
                          <div className="mt-3 p-3 bg-black/20 rounded-lg">
                            <div className="text-xs text-white/50 mb-1">Preview:</div>
                            <p className="text-sm">{suggestion.improved.slice(0, 100)}...</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Comparison View */}
            {selectedSuggestion && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium flex items-center gap-2">
                    <ArrowRight className="h-4 w-4 text-purple-400" />
                    Text Comparison
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowComparison(!showComparison)}
                    className="glass-card hover:bg-white/10"
                  >
                    {showComparison ? 'Hide' : 'Show'} Details
                  </Button>
                </div>
                
                {showComparison && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 glass-card">
                      <h5 className="text-sm font-medium mb-2 text-red-400">Original</h5>
                      <p className="text-sm text-white/70">{originalText}</p>
                    </div>
                    <div className="p-4 glass-card">
                      <h5 className="text-sm font-medium mb-2 text-green-400">Improved</h5>
                      <p className="text-sm text-white/70">{improvedText}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {selectedSuggestion && (
              <div className="flex gap-3 mt-4">
                <Button
                  onClick={copyImprovedText}
                  className="btn-primary flex-1"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Improved Text
                </Button>
                <Button
                  onClick={() => {
                    setSelectedSuggestion(null)
                    setImprovedText(originalText)
                  }}
                  variant="outline"
                  className="glass-card hover:bg-white/10"
                >
                  Reset
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Text Looks Good!</h3>
            <p className="text-white/60">
              No significant improvements needed. Your text appears well-balanced.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}