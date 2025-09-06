'use client'

import { Loader2, Brain, Shield, BarChart3 } from 'lucide-react'

export function AnalysisLoadingSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="text-center">
        <div className="h-4 bg-white/10 rounded w-48 mx-auto mb-2"></div>
        <div className="h-8 bg-white/10 rounded w-64 mx-auto"></div>
      </div>

      {/* Chart Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-card-elevated p-6">
          <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
          <div className="h-96 bg-white/5 rounded-lg"></div>
        </div>
        
        <div className="glass-card-elevated p-6">
          <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-white/10 rounded w-24"></div>
                  <div className="h-4 bg-white/10 rounded w-12"></div>
                </div>
                <div className="h-2 bg-white/5 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function LoadingSpinner({ 
  size = 'default', 
  message 
}: { 
  size?: 'small' | 'default' | 'large'
  message?: string 
}) {
  const sizeClasses = {
    small: 'h-4 w-4',
    default: 'h-8 w-8',
    large: 'h-12 w-12'
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-purple-400`} />
      {message && (
        <p className="text-sm text-white/60 animate-pulse">{message}</p>
      )}
    </div>
  )
}

export function AnalysisLoading({ type }: { type: 'word' | 'sentence' }) {
  return (
    <div className="glass-card-elevated p-12">
      <div className="flex flex-col items-center justify-center gap-6">
        <div className="relative">
          {type === 'sentence' ? (
            <Shield className="h-16 w-16 text-orange-400 animate-pulse" />
          ) : (
            <Brain className="h-16 w-16 text-purple-400 animate-pulse" />
          )}
          <div className="absolute inset-0 blur-xl opacity-50">
            {type === 'sentence' ? (
              <Shield className="h-16 w-16 text-orange-400" />
            ) : (
              <Brain className="h-16 w-16 text-purple-400" />
            )}
          </div>
        </div>
        
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">
            {type === 'sentence' ? 'Detecting Manipulation...' : 'Analyzing Semantics...'}
          </h3>
          <div className="space-y-2">
            <LoadingStep 
              active 
              text={type === 'sentence' ? 'Scanning for propaganda techniques' : 'Computing word embeddings'} 
            />
            <LoadingStep 
              text={type === 'sentence' ? 'Analyzing emotional manipulation' : 'Mapping semantic dimensions'} 
            />
            <LoadingStep 
              text={type === 'sentence' ? 'Calculating manipulation score' : 'Finding similar terms'} 
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function LoadingStep({ active, text }: { active?: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${active ? 'text-white' : 'text-white/40'}`}>
      <div className={`w-2 h-2 rounded-full ${active ? 'bg-purple-400 animate-pulse' : 'bg-white/20'}`} />
      <span>{text}</span>
    </div>
  )
}

export function BatchLoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="glass-card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="h-6 bg-white/10 rounded w-32"></div>
          <div className="h-8 bg-white/10 rounded w-24"></div>
        </div>
        <div className="h-2 bg-white/5 rounded-full mb-2"></div>
        <div className="h-4 bg-white/10 rounded w-48"></div>
      </div>
      
      <div className="glass-card-elevated p-6">
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass-card p-3 flex items-center justify-between">
              <div className="h-4 bg-white/10 rounded w-64"></div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                <div className="h-4 bg-white/10 rounded w-12"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export function InsightsLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="glass-card-elevated p-6">
            <div className="h-8 bg-white/10 rounded w-16 mx-auto mb-2"></div>
            <div className="h-4 bg-white/10 rounded w-24 mx-auto"></div>
          </div>
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card-elevated p-6">
          <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
          <div className="h-64 bg-white/5 rounded-lg"></div>
        </div>
        <div className="glass-card-elevated p-6">
          <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
          <div className="h-64 bg-white/5 rounded-lg"></div>
        </div>
      </div>
    </div>
  )
}