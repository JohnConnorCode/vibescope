'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, History, Heart, Award, Sparkles, Brain, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from './auth-provider'

interface LoginPromptProps {
  isOpen: boolean
  onClose: () => void
  onLogin: () => void
  analysisCount: number
  remainingFree: number
}

export function LoginPrompt({ isOpen, onClose, onLogin, analysisCount, remainingFree }: LoginPromptProps) {
  const [isClosing, setIsClosing] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (user) {
      onClose()
    }
  }, [user, onClose])

  if (!isOpen) return null

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
    }, 300)
  }

  const benefits = [
    { icon: History, text: 'Save unlimited analysis history', color: '#67e8f9' },
    { icon: Heart, text: 'Favorite and organize your analyses', color: '#f9a8d4' },
    { icon: TrendingUp, text: 'Track your progress over time', color: '#10b981' },
    { icon: Award, text: 'Unlock achievements and insights', color: '#fbbf24' },
    { icon: Brain, text: 'Advanced AI features', color: '#c4b5fd' },
    { icon: Sparkles, text: 'Priority processing & no limits', color: '#f87171' },
  ]

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
    >
      <div 
        className={`relative w-full max-w-lg transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Gradient border effect */}
        <div 
          className="absolute inset-0 rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '2px'
          }}
        >
          <div 
            className="h-full w-full rounded-2xl"
            style={{ backgroundColor: '#1a1625' }}
          />
        </div>

        {/* Content */}
        <div className="relative rounded-2xl p-6" style={{ backgroundColor: '#1a1625' }}>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 rounded-lg transition-colors hover:bg-white/10"
          >
            <X className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
          </button>

          {/* Header with animation */}
          <div className="text-center mb-6">
            <div className="inline-flex p-3 rounded-full mb-4" style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}>
              <Lock className="h-8 w-8" style={{ color: '#8b5cf6' }} />
            </div>
            
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'white' }}>
              {analysisCount === 2 
                ? "You're getting the hang of it! 🎉"
                : `You've analyzed ${analysisCount} items!`}
            </h2>
            
            <p className="text-lg" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              Create a free account to unlock powerful features
            </p>
            
            {remainingFree > 0 && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full" 
                style={{ backgroundColor: 'rgba(249, 168, 212, 0.2)' }}>
                <span className="text-sm" style={{ color: '#f9a8d4' }}>
                  {remainingFree} free {remainingFree === 1 ? 'analysis' : 'analyses'} remaining without account
                </span>
              </div>
            )}
          </div>

          {/* Benefits list */}
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              With a free account, you get:
            </p>
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((benefit, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-2 p-3 rounded-lg"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                >
                  <div 
                    className="p-1.5 rounded"
                    style={{ backgroundColor: `${benefit.color}20` }}
                  >
                    <benefit.icon className="h-4 w-4" style={{ color: benefit.color }} />
                  </div>
                  <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    {benefit.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress visualization */}
          <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Your Analysis Journey
              </span>
              <span className="text-sm font-semibold" style={{ color: '#10b981' }}>
                {analysisCount} completed
              </span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
              <div 
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((analysisCount / 10) * 100, 100)}%`,
                  background: 'linear-gradient(to right, #10b981, #67e8f9)'
                }}
              />
            </div>
            <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              Sign up to continue tracking your progress!
            </p>
          </div>

          {/* CTA Buttons */}
          <div className="space-y-3">
            <Button
              onClick={onLogin}
              className="w-full py-3 font-semibold"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Create Free Account
            </Button>
            
            <Button
              onClick={onLogin}
              variant="outline"
              className="w-full py-3"
              style={{
                borderColor: 'rgba(255, 255, 255, 0.2)',
                color: 'rgba(255, 255, 255, 0.7)',
                backgroundColor: 'transparent'
              }}
            >
              I already have an account
            </Button>
            
            <button
              onClick={handleClose}
              className="w-full py-2 text-sm transition-colors hover:text-white"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Maybe later
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
            <div className="flex items-center justify-center gap-6 text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              <span>✓ No credit card required</span>
              <span>✓ Free forever plan</span>
              <span>✓ Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}