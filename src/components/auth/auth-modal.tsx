'use client'

import { useState } from 'react'
import { useAuth } from './auth-provider'
import { X, Mail, Lock, User, AlertCircle, Sparkles, Shield, Check, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'signin' | 'signup'
}

export function AuthModal({ isOpen, onClose, initialMode = 'signin' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = mode === 'signin' 
      ? await signIn(email, password)
      : await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error.message)
      setLoading(false)
    } else {
      setSuccess(true)
      setTimeout(() => {
        onClose()
        setEmail('')
        setPassword('')
        setFullName('')
        setSuccess(false)
      }, 1500)
    }
  }

  const switchMode = () => {
    setMode(mode === 'signin' ? 'signup' : 'signin')
    setError(null)
  }

  if (!isOpen) return null

  const benefits = [
    { icon: Shield, text: 'Save unlimited analyses', color: '#10b981' },
    { icon: Sparkles, text: 'Track your progress', color: '#8b5cf6' },
    { icon: Check, text: 'Export your data anytime', color: '#67e8f9' }
  ]

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in backdrop-blur-sm"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md transform transition-all animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border wrapper */}
        <div className="gradient-border">
          <div className="glass-card-elevated backdrop-blur-xl p-8">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10 hover:scale-110"
              aria-label="Close modal"
            >
              <X className="h-5 w-5 text-white/50 hover:text-white/80" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex p-3 rounded-full mb-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 animate-pulse-glow">
                <Sparkles className="h-8 w-8 text-purple-400" />
              </div>
              
              <h2 className="text-3xl font-bold mb-2 text-gradient">
                {mode === 'signin' ? 'Welcome Back!' : 'Join VibeScope'}
              </h2>
              <p className="text-sm text-white/70">
                {mode === 'signin' 
                  ? 'Continue your semantic analysis journey'
                  : 'Start discovering the hidden dimensions of language'}
              </p>
            </div>

            {/* Benefits for signup */}
            {mode === 'signup' && (
              <div className="mb-6 p-4 glass-card">
                <div className="space-y-3">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="p-1.5 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                        <benefit.icon className="h-4 w-4 flex-shrink-0" style={{ color: benefit.color }} />
                      </div>
                      <span className="text-sm text-white/90">
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert className="mb-6 glass-card border-red-500/30 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-6 glass-card border-green-500/30 animate-fade-in">
                <Check className="h-4 w-4 text-green-400" />
                <AlertDescription className="text-green-300">
                  {mode === 'signin' ? 'Welcome back!' : 'Account created! Check your email to verify.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2 text-white/90">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 z-10 pointer-events-none" />
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="input-dark h-12"
                      style={{ paddingLeft: '44px' }}
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2 text-white/90">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 z-10 pointer-events-none" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-dark h-12"
                    style={{ paddingLeft: '44px' }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/90">
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="text-xs text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                      onClick={() => alert('Password reset coming soon!')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40 z-10 pointer-events-none" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="input-dark h-12"
                    style={{ paddingLeft: '44px', paddingRight: '44px' }}
                    minLength={6}
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-0.5 text-white/40 hover:text-white/60 transition-colors z-10"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs mt-2 text-white/50">
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    required 
                    className="mt-1 accent-purple-500"
                  />
                  <label className="text-xs text-white/60">
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 btn-primary font-semibold transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="loading-spinner w-4 h-4" />
                    Processing...
                  </div>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </>
                )}
              </Button>
            </form>

            {/* Mode switcher */}
            <div className="mt-8 pt-6 border-t border-white/10">
              <p className="text-center text-sm text-white/60">
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  className="font-semibold text-purple-400 hover:text-purple-300 hover:underline transition-colors"
                >
                  {mode === 'signin' ? 'Sign up for free' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Security note */}
            <div className="mt-4 text-center">
              <p className="text-xs text-white/40 flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Your data is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}