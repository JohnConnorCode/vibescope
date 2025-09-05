'use client'

import { Info, TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface ScoreExplanationProps {
  score: number
  dimension: string
  positive: string
  negative: string
}

export function ScoreExplanation({ score, dimension, positive, negative }: ScoreExplanationProps) {
  // Normalize score to -100 to +100 range
  const normalizedScore = Math.round(score * 100)
  const absScore = Math.abs(normalizedScore)
  
  // Determine strength level
  const getStrength = () => {
    if (absScore < 10) return { label: 'Neutral', color: '#6B7280', icon: Minus }
    if (absScore < 30) return { label: 'Weak', color: '#FCD34D', icon: normalizedScore > 0 ? TrendingUp : TrendingDown }
    if (absScore < 60) return { label: 'Moderate', color: '#F59E0B', icon: normalizedScore > 0 ? TrendingUp : TrendingDown }
    if (absScore < 80) return { label: 'Strong', color: '#EF4444', icon: normalizedScore > 0 ? TrendingUp : TrendingDown }
    return { label: 'Very Strong', color: '#DC2626', icon: normalizedScore > 0 ? TrendingUp : TrendingDown }
  }

  const strength = getStrength()
  const tendency = normalizedScore > 10 ? positive : normalizedScore < -10 ? negative : 'Balanced'

  return (
    <div className="space-y-3">
      {/* Score Bar */}
      <div className="relative">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          <span>{negative} (-100)</span>
          <span>Neutral (0)</span>
          <span>{positive} (+100)</span>
        </div>
        
        <div className="relative h-8 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          {/* Background gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(to right, #EF4444 0%, #FCD34D 40%, #6B7280 50%, #FCD34D 60%, #10B981 100%)'
            }}
          />
          
          {/* Score indicator */}
          <div 
            className="absolute top-1/2 -translate-y-1/2 w-1 h-6 bg-white shadow-lg"
            style={{
              left: `${((normalizedScore + 100) / 200) * 100}%`,
              transform: 'translateX(-50%) translateY(-50%)'
            }}
          />
        </div>
      </div>

      {/* Score Details */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <strength.icon className="h-5 w-5" style={{ color: strength.color }} />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-lg" style={{ color: 'white' }}>
                {normalizedScore > 0 ? '+' : ''}{normalizedScore}
              </span>
              <span 
                className="px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: `${strength.color}20`,
                  color: strength.color
                }}
              >
                {strength.label}
              </span>
            </div>
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              Leans toward: <strong>{tendency}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Interpretation Guide */}
      <div 
        className="p-3 rounded-lg flex items-start gap-2"
        style={{ backgroundColor: 'rgba(103, 232, 249, 0.1)' }}
      >
        <Info className="h-4 w-4 mt-0.5" style={{ color: '#67e8f9' }} />
        <div className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
          <strong>How to read this score:</strong>
          <ul className="mt-1 space-y-1">
            <li>• <strong>-100 to -60:</strong> Strongly {negative.toLowerCase()}</li>
            <li>• <strong>-59 to -20:</strong> Moderately {negative.toLowerCase()}</li>
            <li>• <strong>-19 to +19:</strong> Balanced/Neutral</li>
            <li>• <strong>+20 to +59:</strong> Moderately {positive.toLowerCase()}</li>
            <li>• <strong>+60 to +100:</strong> Strongly {positive.toLowerCase()}</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export function ManipulationScoreExplanation({ score }: { score: number }) {
  const getLevel = () => {
    if (score < 20) return { label: 'Minimal', color: '#10B981', description: 'Little to no manipulation detected' }
    if (score < 40) return { label: 'Low', color: '#84CC16', description: 'Some persuasive elements present' }
    if (score < 60) return { label: 'Moderate', color: '#F59E0B', description: 'Notable manipulation techniques used' }
    if (score < 80) return { label: 'High', color: '#EF4444', description: 'Strong manipulation patterns detected' }
    return { label: 'Extreme', color: '#DC2626', description: 'Heavy use of manipulation tactics' }
  }

  const level = getLevel()

  return (
    <div className="space-y-3">
      {/* Score Display */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold" style={{ color: level.color }}>
              {Math.round(score)}
            </div>
            <div>
              <div 
                className="px-3 py-1 rounded-full text-sm font-medium"
                style={{ 
                  backgroundColor: `${level.color}20`,
                  color: level.color
                }}
              >
                {level.label} Manipulation
              </div>
              <p className="text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {level.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Score Bar */}
      <div className="relative">
        <div className="h-4 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div 
            className="h-full transition-all duration-500"
            style={{
              width: `${Math.min(score, 100)}%`,
              background: `linear-gradient(to right, ${level.color}CC, ${level.color})`
            }}
          />
        </div>
        <div className="flex justify-between text-xs mt-1" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <span>0 - Minimal</span>
          <span>50 - Moderate</span>
          <span>100 - Extreme</span>
        </div>
      </div>

      {/* Scoring Breakdown */}
      <div 
        className="p-3 rounded-lg"
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <p className="text-xs font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
          Manipulation Score Scale:
        </p>
        <div className="space-y-1 text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#10B981' }} />
            <span><strong>0-20:</strong> Factual, straightforward communication</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#84CC16' }} />
            <span><strong>21-40:</strong> Mild persuasion techniques</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#F59E0B' }} />
            <span><strong>41-60:</strong> Clear manipulation patterns</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#EF4444' }} />
            <span><strong>61-80:</strong> Heavy manipulation tactics</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#DC2626' }} />
            <span><strong>81-100:</strong> Extreme propaganda techniques</span>
          </div>
        </div>
      </div>
    </div>
  )
}