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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md transform transition-all animate-slideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient border wrapper */}
        <div 
          className="p-[2px] rounded-2xl"
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          }}
        >
          <div 
            className="p-8 rounded-2xl relative"
            style={{ 
              backgroundColor: '#1a1625',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg transition-all hover:bg-white/10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <div 
                className="inline-flex p-3 rounded-full mb-4"
                style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
              >
                <Sparkles className="h-8 w-8" style={{ color: '#8b5cf6' }} />
              </div>
              
              <h2 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
                {mode === 'signin' ? 'Welcome Back!' : 'Join VibeScope'}
              </h2>
              <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                {mode === 'signin' 
                  ? 'Continue your semantic analysis journey'
                  : 'Start discovering the hidden dimensions of language'}
              </p>
            </div>

            {/* Benefits for signup */}
            {mode === 'signup' && (
              <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <div className="space-y-2">
                  {benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center gap-3">
                      <benefit.icon className="h-4 w-4 flex-shrink-0" style={{ color: benefit.color }} />
                      <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                        {benefit.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error/Success Messages */}
            {error && (
              <Alert 
                className="mb-6 border-0"
                style={{ 
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)'
                }}
              >
                <AlertCircle className="h-4 w-4" style={{ color: '#ef4444' }} />
                <AlertDescription style={{ color: '#fca5a5' }}>
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert 
                className="mb-6 border-0"
                style={{ 
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid rgba(16, 185, 129, 0.3)'
                }}
              >
                <Check className="h-4 w-4" style={{ color: '#10b981' }} />
                <AlertDescription style={{ color: '#86efac' }}>
                  {mode === 'signin' ? 'Welcome back!' : 'Account created! Check your email to verify.'}
                </AlertDescription>
              </Alert>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {mode === 'signup' && (
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                    <Input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="John Doe"
                      className="pl-10 h-12 text-white"
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                      }}
                      required={mode === 'signup'}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="pl-10 h-12 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                    Password
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="text-xs hover:underline"
                      style={{ color: '#8b5cf6' }}
                      onClick={() => alert('Password reset coming soon!')}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3.5 h-4 w-4" style={{ color: 'rgba(255, 255, 255, 0.4)' }} />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-10 pr-10 h-12 text-white"
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                    minLength={6}
                    required
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 p-0.5"
                    style={{ color: 'rgba(255, 255, 255, 0.4)' }}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {mode === 'signup' && (
                  <p className="text-xs mt-2" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                    Must be at least 6 characters
                  </p>
                )}
              </div>

              {mode === 'signup' && (
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox" 
                    required 
                    className="mt-1"
                    style={{ accentColor: '#8b5cf6' }}
                  />
                  <label className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    I agree to the Terms of Service and Privacy Policy
                  </label>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-12 font-semibold text-white transition-all transform hover:scale-[1.02]"
                style={{
                  background: loading 
                    ? 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  boxShadow: loading ? 'none' : '0 4px 15px rgba(102, 126, 234, 0.4)'
                }}
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  mode === 'signin' ? 'Sign In' : 'Create Account'
                )}
              </Button>
            </form>

            {/* Mode switcher */}
            <div className="mt-8 pt-6 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
              <p className="text-center text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={switchMode}
                  className="font-semibold hover:underline transition-colors"
                  style={{ color: '#8b5cf6' }}
                >
                  {mode === 'signin' ? 'Sign up for free' : 'Sign in'}
                </button>
              </p>
            </div>

            {/* Security note */}
            <div className="mt-4 text-center">
              <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                🔒 Your data is encrypted and secure
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}