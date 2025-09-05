'use client'

import { useAuth } from '@/components/auth/auth-provider'
import { useSessionTracking } from '@/lib/hooks/useSessionTracking'
import { AlertCircle, TrendingUp, Zap, Lock } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface UsageTrackerProps {
  onLoginClick: () => void
}

export function UsageTracker({ onLoginClick }: UsageTrackerProps) {
  const { user } = useAuth()
  const { analysisCount, remainingFreeAnalyses } = useSessionTracking()

  if (user) {
    // Show premium features for logged-in users
    return (
      <div 
        className="p-3 rounded-lg flex items-center gap-3"
        style={{ 
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          border: '1px solid rgba(16, 185, 129, 0.2)'
        }}
      >
        <Zap className="h-5 w-5" style={{ color: '#10b981' }} />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: '#10b981' }}>
            Unlimited Analyses Active
          </p>
          <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            All features unlocked • Priority processing
          </p>
        </div>
      </div>
    )
  }

  // Show usage limits for anonymous users
  if (analysisCount === 0) {
    return null // Don't show anything on first use
  }

  const usagePercentage = Math.min((analysisCount / 10) * 100, 100)
  const isNearLimit = remainingFreeAnalyses <= 3
  const isAtLimit = remainingFreeAnalyses === 0

  return (
    <div 
      className="p-3 rounded-lg"
      style={{ 
        backgroundColor: isAtLimit 
          ? 'rgba(239, 68, 68, 0.1)' 
          : isNearLimit 
            ? 'rgba(245, 158, 11, 0.1)'
            : 'rgba(255, 255, 255, 0.05)',
        border: `1px solid ${
          isAtLimit 
            ? 'rgba(239, 68, 68, 0.3)' 
            : isNearLimit 
              ? 'rgba(245, 158, 11, 0.3)'
              : 'rgba(255, 255, 255, 0.1)'
        }`
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isAtLimit ? (
            <Lock className="h-4 w-4" style={{ color: '#ef4444' }} />
          ) : isNearLimit ? (
            <AlertCircle className="h-4 w-4" style={{ color: '#f59e0b' }} />
          ) : (
            <TrendingUp className="h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }} />
          )}
          <span className="text-sm font-medium" style={{ 
            color: isAtLimit ? '#ef4444' : isNearLimit ? '#f59e0b' : 'rgba(255, 255, 255, 0.9)' 
          }}>
            {isAtLimit 
              ? 'Free limit reached'
              : `${remainingFreeAnalyses} free ${remainingFreeAnalyses === 1 ? 'analysis' : 'analyses'} remaining`
            }
          </span>
        </div>
        
        <button
          onClick={onLoginClick}
          className="text-xs font-medium px-2 py-1 rounded"
          style={{
            backgroundColor: 'rgba(139, 92, 246, 0.2)',
            color: '#c4b5fd'
          }}
        >
          Unlock Unlimited
        </button>
      </div>
      
      <div className="space-y-2">
        <Progress 
          value={usagePercentage} 
          className="h-1.5"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)'
          }}
        />
        
        <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
          <span>{analysisCount} used</span>
          <span>10 free limit</span>
        </div>
      </div>
      
      {isNearLimit && (
        <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
          Sign up for free to continue analyzing without limits
        </p>
      )}
    </div>
  )
}