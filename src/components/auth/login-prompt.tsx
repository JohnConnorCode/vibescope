'use client'

import { useState, useEffect } from 'react'
import { X, TrendingUp, History, Heart, Award, Sparkles, Brain, Lock, ChevronRight } from 'lucide-react'
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
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-300 backdrop-blur-sm ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={handleClose}
    >
      <div 
        className={`relative w-full max-w-lg transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100 animate-slide-up'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border effect */}
        <div className="gradient-border">
          <div className="glass-card-elevated backdrop-blur-xl p-8">
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10 hover:scale-110"
            >
              <X className="h-5 w-5 text-white/50 hover:text-white/80" />
            </button>

            {/* Header with animation */}
            <div className="text-center mb-6">
              <div className="inline-flex p-3 rounded-full mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse-glow">
                <Lock className="h-8 w-8 text-purple-400" />
              </div>
              
              <h2 className="text-2xl font-bold mb-3 text-gradient">
                {analysisCount === 2 
                  ? "You're getting the hang of it! 🎉"
                  : analysisCount < 5
                    ? `Nice progress! ${analysisCount} analyses done`
                    : `Wow! ${analysisCount} analyses completed!`}
              </h2>
              
              <p className="text-base text-white/80">
                Create a free account to save your work and unlock powerful features
              </p>
              
              {remainingFree > 0 && remainingFree <= 5 && (
                <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 glass-card animate-pulse-glow">
                  <span className="text-sm font-medium text-pink-300">
                    ⏰ Only {remainingFree} free {remainingFree === 1 ? 'analysis' : 'analyses'} left
                  </span>
                </div>
              )}
            </div>

            {/* Benefits grid */}
            <div className="mb-8">
              <p className="text-sm font-medium mb-4 text-white/70">
                With a free account, you get:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {benefits.map((benefit, index) => (
                  <div 
                    key={index}
                    className="glass-card p-3 transition-all hover:scale-[1.02] hover:bg-white/10 group"
                  >
                    <div className="flex items-start gap-2">
                      <div 
                        className="p-1.5 rounded-lg transition-colors group-hover:scale-110"
                        style={{ backgroundColor: `${benefit.color}20` }}
                      >
                        <benefit.icon className="h-4 w-4" style={{ color: benefit.color }} />
                      </div>
                      <span className="text-sm leading-tight text-white/90">
                        {benefit.text}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress visualization */}
            <div className="mb-8 p-4 glass-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-white/70">
                  Your Analysis Journey
                </span>
                <span className="text-sm font-bold text-green-400">
                  {analysisCount}/10 free
                </span>
              </div>
              <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500 glow-purple"
                  style={{
                    width: `${Math.min((analysisCount / 10) * 100, 100)}%`,
                    background: analysisCount >= 8 
                      ? 'linear-gradient(to right, #ef4444, #f87171)'
                      : analysisCount >= 5
                        ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                        : 'linear-gradient(to right, #10b981, #67e8f9)'
                  }}
                />
              </div>
              <p className="text-xs mt-2 text-white/50">
                {remainingFree > 0 
                  ? 'Sign up to continue beyond the free limit'
                  : 'You\'ve reached the free limit - sign up to continue!'}
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="space-y-3">
              <Button
                onClick={onLogin}
                className="w-full h-12 btn-primary font-semibold transition-all transform hover:scale-[1.02]"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Create Free Account
              </Button>
              
              <Button
                onClick={onLogin}
                variant="ghost"
                className="w-full h-11 glass-card hover:bg-white/10 font-medium transition-all"
              >
                I already have an account
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
              
              {remainingFree > 3 && (
                <button
                  onClick={handleClose}
                  className="w-full py-2 text-sm text-white/50 hover:text-white/70 transition-colors"
                >
                  Maybe later
                </button>
              )}
            </div>

            {/* Trust indicators */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <div className="flex items-center justify-center gap-6 text-xs text-white/40">
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-400" />
                  No credit card required
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-400" />
                  Free forever plan
                </span>
                <span className="flex items-center gap-1">
                  <Check className="h-3 w-3 text-green-400" />
                  Export anytime
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}