'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Settings, Sliders, Globe, BookOpen, Briefcase, Heart, Zap, Brain, Users, Target } from 'lucide-react'

interface AdvancedFiltersProps {
  onApplyFilters: (filters: AnalysisFilters) => void
  currentFilters?: AnalysisFilters
}

export interface AnalysisFilters {
  context: 'general' | 'academic' | 'business' | 'emotional' | 'political' | 'technical'
  sensitivity: 'low' | 'medium' | 'high'
  focus: string[]
  language: string
}

const contextOptions = [
  { value: 'general', label: 'General', icon: Globe, color: '#3b82f6' },
  { value: 'academic', label: 'Academic', icon: BookOpen, color: '#10b981' },
  { value: 'business', label: 'Business', icon: Briefcase, color: '#f59e0b' },
  { value: 'emotional', label: 'Emotional', icon: Heart, color: '#ec4899' },
  { value: 'political', label: 'Political', icon: Users, color: '#8b5cf6' },
  { value: 'technical', label: 'Technical', icon: Brain, color: '#06b6d4' },
]

const focusOptions = [
  { value: 'bias', label: 'Bias Detection', icon: Target },
  { value: 'emotion', label: 'Emotional Weight', icon: Heart },
  { value: 'formality', label: 'Formality Level', icon: Briefcase },
  { value: 'complexity', label: 'Complexity', icon: Brain },
  { value: 'persuasion', label: 'Persuasion', icon: Zap },
]

export function AdvancedFilters({ onApplyFilters, currentFilters }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<AnalysisFilters>(currentFilters || {
    context: 'general',
    sensitivity: 'medium',
    focus: [],
    language: 'en'
  })

  const toggleFocus = (value: string) => {
    setFilters(prev => ({
      ...prev,
      focus: prev.focus.includes(value)
        ? prev.focus.filter(f => f !== value)
        : [...prev.focus, value]
    }))
  }

  const applyFilters = () => {
    onApplyFilters(filters)
    setIsOpen(false)
  }

  const resetFilters = () => {
    const defaultFilters: AnalysisFilters = {
      context: 'general',
      sensitivity: 'medium',
      focus: [],
      language: 'en'
    }
    setFilters(defaultFilters)
    onApplyFilters(defaultFilters)
  }

  const hasActiveFilters = filters.context !== 'general' || 
    filters.sensitivity !== 'medium' || 
    filters.focus.length > 0

  return (
    <div className="relative">
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className={`glass-card hover:bg-white/10 flex items-center gap-2 ${
          hasActiveFilters ? 'border-purple-400' : ''
        }`}
      >
        <Settings className={`h-4 w-4 ${hasActiveFilters ? 'text-purple-400' : ''}`} />
        <span>Advanced Settings</span>
        {hasActiveFilters && (
          <span className="ml-1 px-1.5 py-0.5 bg-purple-400/20 text-purple-400 text-xs rounded-full">
            {filters.focus.length + (filters.context !== 'general' ? 1 : 0) + (filters.sensitivity !== 'medium' ? 1 : 0)}
          </span>
        )}
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-2 right-0 w-96 z-50 glass-card-elevated p-6 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Sliders className="h-5 w-5 text-purple-400" />
              Advanced Analysis Settings
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/50 hover:text-white/80"
            >
              ×
            </button>
          </div>

          {/* Context Selection */}
          <div className="mb-6">
            <label className="text-sm font-medium text-white/80 mb-3 block">
              Analysis Context
            </label>
            <div className="grid grid-cols-3 gap-2">
              {contextOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setFilters(prev => ({ ...prev, context: option.value as any }))}
                  className={`glass-card p-3 hover:bg-white/10 transition-all ${
                    filters.context === option.value ? 'bg-white/10 border-purple-400' : ''
                  }`}
                >
                  <option.icon 
                    className="h-4 w-4 mx-auto mb-1" 
                    style={{ color: filters.context === option.value ? option.color : 'rgba(255,255,255,0.6)' }}
                  />
                  <span className="text-xs">{option.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sensitivity Level */}
          <div className="mb-6">
            <label className="text-sm font-medium text-white/80 mb-3 block">
              Detection Sensitivity
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setFilters(prev => ({ ...prev, sensitivity: level }))}
                  className={`flex-1 glass-card px-4 py-2 hover:bg-white/10 transition-all ${
                    filters.sensitivity === level ? 'bg-white/10 border-purple-400' : ''
                  }`}
                >
                  <span className="text-sm capitalize">{level}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-white/50 mt-2">
              {filters.sensitivity === 'low' && 'Only major patterns will be highlighted'}
              {filters.sensitivity === 'medium' && 'Balanced detection of patterns'}
              {filters.sensitivity === 'high' && 'All subtle patterns will be detected'}
            </p>
          </div>

          {/* Focus Areas */}
          <div className="mb-6">
            <label className="text-sm font-medium text-white/80 mb-3 block">
              Focus Areas
            </label>
            <div className="space-y-2">
              {focusOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => toggleFocus(option.value)}
                  className={`w-full glass-card p-3 hover:bg-white/10 transition-all flex items-center gap-3 ${
                    filters.focus.includes(option.value) ? 'bg-white/10 border-purple-400' : ''
                  }`}
                >
                  <option.icon className={`h-4 w-4 ${
                    filters.focus.includes(option.value) ? 'text-purple-400' : 'text-white/60'
                  }`} />
                  <span className="text-sm">{option.label}</span>
                  {filters.focus.includes(option.value) && (
                    <div className="ml-auto w-2 h-2 bg-purple-400 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={resetFilters}
              className="flex-1 glass-card hover:bg-white/10"
            >
              Reset
            </Button>
            <Button
              onClick={applyFilters}
              className="flex-1 btn-primary"
            >
              Apply Filters
            </Button>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 p-3 glass-card">
              <p className="text-xs text-white/60">
                {filters.focus.length > 0 && `Focusing on: ${filters.focus.join(', ')}`}
                {filters.context !== 'general' && ` • ${filters.context} context`}
                {filters.sensitivity !== 'medium' && ` • ${filters.sensitivity} sensitivity`}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}