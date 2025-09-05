'use client'
import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { LoadingSpinner, FullAnalysisSkeleton } from '@/components/ui/loading-skeleton'
import { AXES } from '@/lib/axes'
import { useDebounce } from '@/hooks/useDebounce'
import { useWindowSize } from '@/hooks/useWindowSize'
import { validateInput, sanitizeInput, isSentence, validateApiResponse, createRateLimiter } from '@/lib/validation'
import { DEMO_DATA, API_CONFIG, UI_CONFIG } from '@/lib/constants'
import { Search, AlertCircle, Info, ArrowRight, Sparkles, Brain, Shield, LogIn } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useSessionTracking } from '@/lib/hooks/useSessionTracking'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { UsageTracker } from '@/components/usage/usage-tracker'
import { EnhancedResults } from '@/components/analysis/enhanced-results'
import { WelcomeTour } from '@/components/onboarding/welcome-tour'
import { AuthModal } from '@/components/auth/auth-modal'

interface VibeData {
  term: string
  axes: Record<string, number>
  neighbors?: Array<{ term: string; distance: number }>
  type?: 'word' | 'sentence'
  propaganda?: {
    overallManipulation: number
    emotionalManipulation: number
    strategicAmbiguity: number
    loadedLanguage: number
    fearTactics: number
    appealToAuthority: number
    bandwagon: number
    falseDichotomy: number
    gaslighting: number
    techniques: string[]
    explanations: string[]
  }
}

interface ApiError {
  message: string
  code?: string
  retryable?: boolean
}

interface LoadingState {
  isLoading: boolean
  isRetrying: boolean
  progress?: string
}

// Rate limiter for API calls
const rateLimiter = createRateLimiter(API_CONFIG.rateLimit.maxRequests, API_CONFIG.rateLimit.windowMs)

const DEMO_VIBES = DEMO_DATA.words
const DEMO_SENTENCES = DEMO_DATA.sentences

const AXIS_DESCRIPTIONS: Record<string, { description: string; positive: string; negative: string }> = {
  masculine_feminine: {
    description: 'Gender-associated qualities and characteristics',
    positive: 'Strong, assertive, competitive',
    negative: 'Gentle, nurturing, collaborative'
  },
  concrete_abstract: {
    description: 'How tangible vs conceptual the idea is',
    positive: 'Physical, measurable, specific',
    negative: 'Theoretical, conceptual, philosophical'
  },
  active_passive: {
    description: 'Level of energy and initiative',
    positive: 'Dynamic, proactive, energetic',
    negative: 'Calm, receptive, still'
  },
  positive_negative: {
    description: 'Emotional valence and feeling tone',
    positive: 'Uplifting, optimistic, good',
    negative: 'Sad, pessimistic, bad'
  },
  serious_playful: {
    description: 'Tone and approach to life',
    positive: 'Formal, important, grave',
    negative: 'Fun, lighthearted, whimsical'
  },
  complex_simple: {
    description: 'Level of sophistication and intricacy',
    positive: 'Complicated, nuanced, detailed',
    negative: 'Straightforward, basic, easy'
  },
  intense_mild: {
    description: 'Strength and force of expression',
    positive: 'Powerful, extreme, forceful',
    negative: 'Gentle, moderate, subtle'
  },
  natural_artificial: {
    description: 'Origin and authenticity',
    positive: 'Organic, authentic, genuine',
    negative: 'Synthetic, manufactured, fake'
  },
  private_public: {
    description: 'Level of openness and visibility',
    positive: 'Personal, intimate, hidden',
    negative: 'Open, shared, communal'
  },
  high_status_low_status: {
    description: 'Social position and prestige',
    positive: 'Prestigious, elite, refined',
    negative: 'Common, humble, ordinary'
  },
  ordered_chaotic: {
    description: 'Level of structure and organization',
    positive: 'Organized, systematic, controlled',
    negative: 'Random, messy, unpredictable'
  },
  future_past: {
    description: 'Temporal orientation and direction',
    positive: 'Forward-looking, modern, progressive',
    negative: 'Traditional, nostalgic, historical'
  }
}

export default function HomePage() {
  const [term, setTerm] = useState('')
  const [vibeData, setVibeData] = useState<VibeData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, isRetrying: false })
  const [error, setError] = useState<ApiError | null>(null)
  const [inputError, setInputError] = useState<string>('')
  const [isSubmissionDisabled, setIsSubmissionDisabled] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  
  // Authentication and session tracking
  const { user } = useAuth()
  const { 
    analysisCount, 
    remainingFreeAnalyses, 
    shouldShowLoginPrompt, 
    trackAnalysis, 
    dismissLoginPrompt 
  } = useSessionTracking()
  
  // Refs for accessibility and preventing double submissions
  const submitTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const abortControllerRef = useRef<AbortController | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Debounced input for validation
  const debouncedTerm = useDebounce(term, UI_CONFIG.debounceTime)
  
  // Window size for responsive behavior
  const { isMobile } = useWindowSize()

  // Input validation effect
  useEffect(() => {
    if (!debouncedTerm.trim()) {
      setInputError('')
      return
    }
    
    const validation = validateInput(debouncedTerm)
    if (!validation.isValid) {
      setInputError(validation.error || 'Invalid input')
    } else {
      setInputError('')
    }
  }, [debouncedTerm])
  
  // Clear error when user starts typing again
  useEffect(() => {
    if (term !== debouncedTerm) {
      setError(null)
    }
  }, [term, debouncedTerm])

  const fetchVibe = useCallback(async (searchTerm: string, isRetry = false) => {
    if (!searchTerm.trim()) {
      setVibeData(null)
      setError(null)
      return
    }

    // Validate input first
    const validation = validateInput(searchTerm)
    if (!validation.isValid) {
      setError({ message: validation.error || 'Invalid input', retryable: false })
      return
    }

    // Rate limiting check
    if (!rateLimiter('user')) {
      setError({ 
        message: 'Too many requests. Please wait a moment before trying again.', 
        code: 'RATE_LIMITED',
        retryable: true 
      })
      return
    }

    // Prevent double submissions
    if (loadingState.isLoading && !isRetry) {
      return
    }

    setLoadingState({ 
      isLoading: true, 
      isRetrying: isRetry,
      progress: 'Preparing analysis...' 
    })
    setError(null)
    
    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    abortControllerRef.current = new AbortController()
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }, API_CONFIG.timeout)
    
    try {
      const sanitizedTerm = validation.sanitized || searchTerm
      const isAnalyzingSentence = isSentence(sanitizedTerm)
      
      setLoadingState(prev => ({ 
        ...prev, 
        progress: isAnalyzingSentence ? 'Analyzing sentence patterns...' : 'Processing word embeddings...' 
      }))
      
      const endpoint = isAnalyzingSentence 
        ? `/api/vibe/analyze-sentence?text=${encodeURIComponent(sanitizedTerm)}`
        : `/api/vibe?term=${encodeURIComponent(sanitizedTerm)}`
      
      const res = await fetch(endpoint, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      clearTimeout(timeoutId)
      
      if (!res.ok) {
        let errorData
        try {
          errorData = await res.json()
        } catch {
          errorData = { error: `HTTP ${res.status}: ${res.statusText}` }
        }
        
        const isRetryable = res.status >= 500 || res.status === 429
        throw new Error(JSON.stringify({ 
          message: errorData.error || `Server error (${res.status})`, 
          retryable: isRetryable,
          status: res.status 
        }))
      }
      
      setLoadingState(prev => ({ ...prev, progress: 'Processing results...' }))
      
      const data = await res.json()
      
      // Validate API response
      const responseValidation = validateApiResponse(data)
      if (!responseValidation.isValid) {
        throw new Error(JSON.stringify({ 
          message: responseValidation.error || 'Invalid response from server', 
          retryable: false 
        }))
      }
      
      setVibeData({ 
        ...data, 
        type: isAnalyzingSentence ? 'sentence' : 'word',
        term: sanitizedTerm
      })
      setRetryCount(0)
      
      // Track analysis for session
      trackAnalysis()
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          setError({ message: 'Request was cancelled', retryable: true })
        } else {
          let errorInfo: ApiError
          try {
            errorInfo = JSON.parse(error.message)
          } catch {
            errorInfo = { message: error.message, retryable: true }
          }
          
          console.error('Error fetching vibe:', {
            searchTerm,
            error: errorInfo,
            timestamp: new Date().toISOString()
          })
          
          setError({
            message: `Failed to analyze "${searchTerm}": ${errorInfo.message}`,
            code: errorInfo.code,
            retryable: errorInfo.retryable !== false
          })
        }
      } else {
        setError({ message: 'An unexpected error occurred', retryable: true })
      }
      
      setVibeData(null)
    } finally {
      setLoadingState({ isLoading: false, isRetrying: false })
      abortControllerRef.current = null
    }
  }, [loadingState.isLoading])

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputError || !term.trim() || loadingState.isLoading || isSubmissionDisabled) {
      return
    }
    
    // Check if user has reached free limit
    if (!user && remainingFreeAnalyses === 0) {
      setShowAuthModal(true)
      return
    }
    
    // Prevent rapid submissions
    setIsSubmissionDisabled(true)
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }
    
    submitTimeoutRef.current = setTimeout(() => {
      setIsSubmissionDisabled(false)
    }, 1000)
    
    fetchVibe(term)
  }, [term, inputError, loadingState.isLoading, isSubmissionDisabled, fetchVibe, user, remainingFreeAnalyses])
  
  const handleRetry = useCallback(() => {
    if (retryCount < 3) {
      setRetryCount(prev => prev + 1)
      fetchVibe(term, true)
    }
  }, [term, retryCount, fetchVibe])
  
  const handleDemoClick = useCallback((demoTerm: string) => {
    setTerm(demoTerm)
    // Small delay to allow state to update
    setTimeout(() => {
      fetchVibe(demoTerm)
    }, 50)
  }, [fetchVibe])
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = sanitizeInput(e.target.value)
    setTerm(value)
  }, [])
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
    }
  }, [])

  // Memoized radar data computation
  const radarData = useMemo(() => {
    if (!vibeData?.axes) return []
    
    return Object.entries(vibeData.axes).map(([k, v]) => {
      const axis = AXES.find(a => a.key === k)
      const axisLabel = axis ? axis.label.split(' (')[0] : k
      return {
        axis: axisLabel,
        fullAxis: axis?.label || k,
        score: Math.max(0, Math.min(100, (v + 1) * 50)), // Ensure 0-100 range
        rawScore: v
      }
    })
  }, [vibeData?.axes])
  
  // Memoized demo buttons to prevent unnecessary re-renders
  const DemoButtons = useMemo(() => {
    const WordDemos = () => (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm mb-3 flex items-center justify-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Brain className="h-4 w-4" aria-hidden="true" />
            Try analyzing these words:
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {DEMO_VIBES.map(demo => (
              <Button
                key={demo}
                variant="outline"
                size="sm"
                onClick={() => handleDemoClick(demo)}
                disabled={loadingState.isLoading}
                className="text-sm transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-h-[44px] px-4"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
                aria-label={`Analyze the word ${demo}`}
              >
                <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                {demo}
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
    
    const SentenceDemos = () => (
      <div className="space-y-4">
        <div className="text-center">
          <p className="text-sm mb-3 flex items-center justify-center gap-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            <Shield className="h-4 w-4" aria-hidden="true" />
            Or analyze these sentences for manipulation patterns:
          </p>
          <div className="flex flex-col gap-2">
            {DEMO_SENTENCES.map((demo, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => handleDemoClick(demo)}
                disabled={loadingState.isLoading}
                className="text-xs px-4 py-3 h-auto whitespace-normal max-w-md mx-auto transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent min-h-[44px]"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
                aria-label={`Analyze this sentence for manipulation patterns`}
              >
                <div className="flex items-start gap-2">
                  <ArrowRight className="h-3 w-3 mt-1 flex-shrink-0" aria-hidden="true" />
                  <span className="text-left">"{demo}"</span>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    )
    
    return { WordDemos, SentenceDemos }
  }, [handleDemoClick, loadingState.isLoading])

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #4c1d95, #581c87, #312e81)' }}>
      {/* Welcome Tour for new users */}
      <WelcomeTour />
      
      {/* Login Prompt Modal */}
      <LoginPrompt 
        isOpen={shouldShowLoginPrompt}
        onClose={dismissLoginPrompt}
        onLogin={() => setShowAuthModal(true)}
        analysisCount={analysisCount}
        remainingFree={remainingFreeAnalyses}
      />
      
      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      )}
      
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl">
        {/* Header with Auth - Mobile Responsive */}
        <header className="mb-8 sm:mb-12">
          {/* User Auth Section */}
          <div className="flex justify-end mb-4">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Welcome back!
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard'}
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'white'
                  }}
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: 'white'
                }}
              >
                <LogIn className="h-4 w-4 mr-1" />
                Sign In
              </Button>
            )}
          </div>
          
          <div className="text-center">
          <h1 
            className="text-3xl sm:text-4xl lg:text-6xl font-bold mb-4"
            style={{
              background: 'linear-gradient(to right, #67e8f9, #c4b5fd, #f9a8d4)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              color: 'transparent'
            }}
            role="banner"
          >
            VibeScope
          </h1>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-4xl mx-auto leading-relaxed px-2" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
            Discover the hidden emotional and semantic dimensions of any word, or analyze sentences for manipulation techniques and propaganda patterns using AI embeddings
          </p>
          </div>
          
          {/* Feature highlights for better UX */}
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mb-6 text-xs sm:text-sm text-white/60">
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Brain className="h-3 w-3" aria-hidden="true" />
              <span>Semantic Analysis</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Shield className="h-3 w-3" aria-hidden="true" />
              <span>Manipulation Detection</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 bg-white/10 rounded-full">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              <span>AI Powered</span>
            </div>
          </div>
        </header>

        {/* Search Card with Usage Tracker - Mobile Responsive */}
        <main className="max-w-2xl mx-auto mb-8 sm:mb-12">
          <Card className="transition-all duration-300" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(4px)', borderColor: 'rgba(255, 255, 255, 0.2)' }}>
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {/* Usage Tracker for anonymous users */}
              {!user && analysisCount > 0 && (
                <div className="mb-4">
                  <UsageTracker onLoginClick={() => setShowAuthModal(true)} />
                </div>
              )}
              <form onSubmit={handleSubmit} noValidate>
                <div className="space-y-4">
                  <div className="relative">
                    <label htmlFor="analysis-input" className="sr-only">
                      Enter word or sentence to analyze
                    </label>
                    <Input
                      id="analysis-input"
                      ref={inputRef}
                      type="text"
                      value={term}
                      onChange={handleInputChange}
                      placeholder="Enter any word or sentence to analyze..."
                      className={`
                        text-base sm:text-lg h-12 sm:h-16 pl-4 sm:pl-6 pr-16 sm:pr-20 
                        bg-white/10 border-white/20 text-white placeholder:text-white/60 
                        focus:border-cyan-300 focus:ring-2 focus:ring-cyan-300/20 
                        transition-all duration-300
                        ${inputError ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}
                      `}
                      autoFocus
                      disabled={loadingState.isLoading}
                      autoComplete="off"
                      spellCheck="false"
                      aria-invalid={!!inputError}
                      aria-describedby={inputError ? "input-error" : "input-help"}
                      maxLength={500}
                    />
                    
                    <Button 
                      type="submit"
                      disabled={loadingState.isLoading || !term.trim() || !!inputError || isSubmissionDisabled}
                      className="
                        absolute right-1 sm:right-2 top-1 sm:top-2 
                        h-10 sm:h-12 px-3 sm:px-6 text-sm sm:text-base
                        bg-gradient-to-r from-violet-500 to-purple-600 
                        hover:from-violet-600 hover:to-purple-700 
                        disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400
                        min-w-[80px] sm:min-w-[100px]
                      "
                      aria-label="Analyze input text"
                    >
                      {loadingState.isLoading ? (
                        <div className="flex items-center gap-2">
                          <LoadingSpinner size="sm" className="text-white" />
                          <span className="hidden sm:inline">Analyzing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 sm:gap-2">
                          <Search className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                          <span>Analyze</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  {/* Input validation error */}
                  {inputError && (
                    <div 
                      id="input-error"
                      className="flex items-center gap-2 text-red-300 text-sm"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" aria-hidden="true" />
                      <span>{inputError}</span>
                    </div>
                  )}
                  
                  {/* Loading progress */}
                  {loadingState.isLoading && loadingState.progress && (
                    <div 
                      className="flex items-center gap-2 text-cyan-300 text-sm"
                      aria-live="polite"
                      aria-label="Analysis progress"
                    >
                      <LoadingSpinner size="sm" className="text-cyan-400" />
                      <span>{loadingState.progress}</span>
                    </div>
                  )}
                  
                  {/* Helper text */}
                  {!inputError && !loadingState.isLoading && (
                    <p 
                      id="input-help" 
                      className="text-white/50 text-xs sm:text-sm flex items-center gap-2"
                    >
                      <Info className="h-3 w-3 flex-shrink-0" aria-hidden="true" />
                      Single words show semantic dimensions, sentences reveal manipulation patterns
                    </p>
                  )}
                </div>
              </form>

              {/* Demo Examples - Mobile Responsive */}
              {!vibeData && !loadingState.isLoading && (
                <div className="mt-6 space-y-6">
                  <DemoButtons.WordDemos />
                  <DemoButtons.SentenceDemos />
                </div>
              )}
            </CardContent>
          </Card>
        </main>

        {/* Error Message - Enhanced UX */}
        {error && (
          <section className="max-w-4xl mx-auto mb-6 sm:mb-8" aria-labelledby="error-heading">
            <Alert className="bg-red-500/10 border-red-500/30 text-red-200 transition-all duration-300">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div className="flex-1">
                  <h3 id="error-heading" className="font-semibold mb-2 text-red-300">
                    Analysis Error
                  </h3>
                  <AlertDescription className="space-y-3">
                    <p>{error.message}</p>
                    
                    {error.message.includes('API key') && (
                      <div className="mt-3 p-3 bg-red-500/20 rounded-lg text-sm">
                        <p className="font-medium">Configuration Issue:</p>
                        <p>Please add your OpenAI API key to your <code className="bg-red-500/30 px-1 py-0.5 rounded font-mono">env.local</code> file.</p>
                      </div>
                    )}
                    
                    {error.code === 'RATE_LIMITED' && (
                      <div className="mt-3 p-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-sm">
                        <p className="font-medium text-orange-200">Rate Limit Reached</p>
                        <p className="text-orange-300">Please wait a moment before making another request.</p>
                      </div>
                    )}
                    
                    {error.retryable && retryCount < 3 && (
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleRetry}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 focus-visible:ring-2 focus-visible:ring-red-400"
                          disabled={loadingState.isRetrying}
                          aria-label={`Retry analysis. Attempt ${retryCount + 1} of 3`}
                        >
                          {loadingState.isRetrying ? (
                            <>
                              <LoadingSpinner size="sm" className="mr-2" />
                              Retrying...
                            </>
                          ) : (
                            'Try Again'
                          )}
                        </Button>
                        
                        {retryCount > 0 && (
                          <span className="text-xs text-red-300 self-center">
                            Attempt {retryCount + 1} of 3
                          </span>
                        )}
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </section>
        )}

        {/* Loading State - Enhanced with Skeletons */}
        {loadingState.isLoading && (
          <section className="max-w-6xl mx-auto mb-6 sm:mb-8" aria-labelledby="loading-heading">
            {!vibeData ? (
              <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                <CardContent className="p-4 sm:p-6 lg:p-8">
                  <div className="text-center">
                    <LoadingSpinner size="lg" className="text-cyan-400 mb-4" />
                    <h3 id="loading-heading" className="text-white/80 text-lg mb-2">
                      Analyzing "{term.slice(0, 50)}{term.length > 50 ? '...' : ''}"
                    </h3>
                    {loadingState.progress && (
                      <p className="text-white/60 text-sm" aria-live="polite">
                        {loadingState.progress}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <FullAnalysisSkeleton />
            )}
          </section>
        )}

        {/* Results Section - Mobile Responsive & Accessible */}
        {vibeData && (
          <section className="max-w-6xl mx-auto space-y-6 sm:space-y-8" aria-labelledby="results-heading">
            <div className="sr-only">
              <h2 id="results-heading">Analysis Results for "{vibeData.term}"</h2>
            </div>
            
            {/* Success feedback */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-500/30 rounded-full text-green-200 text-sm">
                <div className="w-2 h-2 bg-green-400 rounded-full" aria-hidden="true"></div>
                <span>Analysis complete</span>
              </div>
            </div>
            
            {/* Propaganda Analysis Card - Show only for sentences */}
            {vibeData.type === 'sentence' && vibeData.propaganda && (
              <Card 
                className="bg-gradient-to-r from-red-900/20 via-orange-900/20 to-yellow-900/20 backdrop-blur-sm border-orange-500/30 transition-all duration-300 hover:border-orange-400/40"
                role="region"
                aria-labelledby="propaganda-analysis-heading"
              >
                <CardHeader className="pb-4">
                  <CardTitle className="text-white text-xl sm:text-2xl flex items-center gap-2" id="propaganda-analysis-heading">
                    <span className="text-orange-400" role="img" aria-label="Warning">⚠️</span>
                    Manipulation & Propaganda Analysis
                  </CardTitle>
                  <p className="text-white/70 text-sm leading-relaxed">
                    Educational analysis of potential manipulation techniques detected in the sentence. 
                    This helps build media literacy skills.
                  </p>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {/* Overall Manipulation Score */}
                    <div className="text-center p-4 bg-black/20 rounded-lg" role="region" aria-labelledby="overall-score">
                      <div 
                        className={`text-3xl sm:text-4xl font-bold mb-2 transition-colors duration-300 ${
                          vibeData.propaganda.overallManipulation > 70 ? 'text-red-400' :
                          vibeData.propaganda.overallManipulation > 40 ? 'text-orange-400' : 'text-green-400'
                        }`}
                        aria-label={`Overall manipulation score: ${Math.round(vibeData.propaganda.overallManipulation)} out of 100`}
                      >
                        {Math.round(vibeData.propaganda.overallManipulation)}
                        <span className="text-lg text-white/60">/100</span>
                      </div>
                      <div id="overall-score" className="text-white/80 text-sm font-semibold">
                        Overall Manipulation Score
                      </div>
                      <div className="text-xs text-white/50 mt-1">
                        {vibeData.propaganda.overallManipulation > 70 ? 'High concern' :
                         vibeData.propaganda.overallManipulation > 40 ? 'Moderate concern' : 'Low concern'}
                      </div>
                    </div>

                    {/* Individual Scores - Accessible & Mobile-friendly */}
                    {[
                      { key: 'emotionalManipulation', label: 'Emotional Manipulation', description: 'Use of emotions to influence rather than facts' },
                      { key: 'strategicAmbiguity', label: 'Strategic Ambiguity', description: 'Deliberately vague language' },
                      { key: 'loadedLanguage', label: 'Loaded Language', description: 'Words with strong emotional associations' },
                      { key: 'fearTactics', label: 'Fear Tactics', description: 'Appeals to fear or anxiety' },
                      { key: 'appealToAuthority', label: 'Appeal to Authority', description: 'Reliance on authority rather than evidence' },
                      { key: 'bandwagon', label: 'Bandwagon Effect', description: 'Everyone else is doing it argument' },
                      { key: 'falseDichotomy', label: 'False Dichotomy', description: 'Presenting only two options when more exist' },
                      { key: 'gaslighting', label: 'Gaslighting', description: 'Making someone question their own reality' }
                    ].map(({ key, label, description }) => {
                      const score = Math.round((vibeData.propaganda as any)[key])
                      if (score === 0) return null
                      
                      return (
                        <div 
                          key={key} 
                          className="bg-black/20 rounded-lg p-3 transition-all duration-300 hover:bg-black/30"
                          role="region"
                          aria-labelledby={`score-${key}-label`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 mr-2">
                              <span id={`score-${key}-label`} className="text-white text-sm font-medium block">
                                {label}
                              </span>
                              <span className="text-white/50 text-xs block mt-1">
                                {description}
                              </span>
                            </div>
                            <span 
                              className={`text-sm font-bold px-2 py-1 rounded shrink-0 ${
                                score > 70 ? 'bg-red-500/20 text-red-300' :
                                score > 40 ? 'bg-orange-500/20 text-orange-300' : 'bg-green-500/20 text-green-300'
                              }`}
                              aria-label={`Score: ${score} out of 100`}
                            >
                              {score}
                            </span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                                score > 70 ? 'bg-red-500' :
                                score > 40 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${Math.min(score, 100)}%` }}
                              role="progressbar"
                              aria-valuenow={score}
                              aria-valuemin={0}
                              aria-valuemax={100}
                              aria-label={`${label}: ${score} out of 100`}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* Detected Techniques - Enhanced Layout */}
                  {vibeData.propaganda.techniques.length > 0 && (
                    <div className="mt-6 lg:col-span-3">
                      <h4 className="text-white text-lg font-semibold mb-3 flex items-center gap-2">
                        <span role="img" aria-label="Detection">🔍</span>
                        Detected Manipulation Techniques
                      </h4>
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                        {vibeData.propaganda.explanations.map((explanation, index) => (
                          <div 
                            key={index} 
                            className="bg-black/20 rounded-lg p-4 transition-all duration-300 hover:bg-black/30 border border-transparent hover:border-orange-500/20"
                            role="article"
                            aria-labelledby={`technique-${index}-title`}
                          >
                            <h5 
                              id={`technique-${index}-title`}
                              className="text-orange-300 text-sm font-medium mb-2 flex items-center gap-2"
                            >
                              <span className="w-1.5 h-1.5 bg-orange-400 rounded-full" aria-hidden="true"></span>
                              {vibeData.propaganda!.techniques[index].replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </h5>
                            <p className="text-white/80 text-sm leading-relaxed">{explanation}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Educational Note - Enhanced */}
                  <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg lg:col-span-3">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <h4 className="text-blue-200 font-semibold mb-2">Educational Purpose</h4>
                        <p className="text-blue-200/80 text-sm leading-relaxed">
                          This analysis helps identify potential manipulation techniques for media literacy purposes. 
                          High scores don't necessarily indicate malicious intent, but rather language patterns 
                          commonly used in persuasive or manipulative communication. Use this as a tool for 
                          critical thinking, not absolute judgment.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Radar Chart */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">
                  {vibeData.type === 'sentence' ? 'Sentence' : 'Word'} Vibe Profile: "{vibeData.term}"
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.2)" />
                      <PolarAngleAxis 
                        dataKey="axis" 
                        tick={{ 
                          fontSize: isMobile ? 10 : 12, 
                          fill: 'rgba(255,255,255,0.9)',
                          fontWeight: 500
                        }}
                        className="select-none"
                      />
                      <PolarRadiusAxis 
                        domain={[0, 100]} 
                        tick={{ 
                          fontSize: isMobile ? 8 : 10, 
                          fill: 'rgba(255,255,255,0.6)'
                        }}
                        tickCount={6}
                      />
                      <Radar 
                        name="Semantic Profile" 
                        dataKey="score" 
                        stroke="#10B981" 
                        fill="#10B981" 
                        fillOpacity={0.2} 
                        strokeWidth={3}
                        dot={{ 
                          fill: '#10B981', 
                          strokeWidth: 2, 
                          r: isMobile ? 3 : 4,
                          className: 'hover:r-6 transition-all duration-300'
                        }}
                        className="drop-shadow-lg"
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Axis Breakdown */}
            <Card className="bg-white/10 backdrop-blur-sm border-white/20">
              <CardHeader>
                <CardTitle className="text-white text-2xl">Dimension Scores</CardTitle>
                <p className="text-white/60 text-sm mt-2">
                  Scores range from -100 to +100. Positive scores lean toward the first trait, negative toward the second.
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(vibeData.axes).map(([axis, value]) => {
                    const axisInfo = AXES.find(a => a.key === axis)
                    const description = AXIS_DESCRIPTIONS[axis]
                    const isPositive = value > 0
                    const percentage = Math.round(value * 100)
                    const absPercentage = Math.abs(percentage)
                    
                    return (
                      <div key={axis} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-semibold text-lg">
                            {axisInfo?.label || axis}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                            Math.abs(percentage) < 10 
                              ? 'bg-gray-500/20 text-gray-300'
                              : isPositive 
                                ? 'bg-emerald-500/20 text-emerald-300' 
                                : 'bg-orange-500/20 text-orange-300'
                          }`}>
                            {percentage > 0 ? '+' : ''}{percentage}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className="text-emerald-300 text-sm font-medium w-20 text-right">
                            {axisInfo?.pos || 'Positive'}
                          </span>
                          <div className="flex-1 bg-gray-700 rounded-full h-3 relative">
                            <div className="absolute inset-0 flex">
                              <div className="w-1/2 bg-gradient-to-r from-emerald-600/30 to-gray-700"></div>
                              <div className="w-1/2 bg-gradient-to-r from-gray-700 to-orange-600/30"></div>
                            </div>
                            <div 
                              className={`absolute top-0 h-3 rounded-full transition-all duration-700 ${
                                isPositive 
                                  ? 'bg-emerald-500 left-1/2' 
                                  : 'bg-orange-500 right-1/2'
                              }`}
                              style={{ 
                                width: `${absPercentage/2}%`,
                                ...(isPositive ? {} : { transform: 'translateX(100%)' })
                              }}
                            />
                            <div className="absolute top-0 left-1/2 transform -translate-x-0.5 w-1 h-3 bg-white/40"></div>
                          </div>
                          <span className="text-orange-300 text-sm font-medium w-20">
                            {axisInfo?.neg || 'Negative'}
                          </span>
                        </div>
                        
                        <p className="text-white/70 text-sm">
                          {description?.description}
                        </p>
                        
                        <div className="text-xs text-white/50">
                          Tends toward: <span className={`font-semibold ${
                            Math.abs(percentage) < 10 
                              ? 'text-gray-300'
                              : isPositive 
                                ? 'text-emerald-300'
                                : 'text-orange-300'
                          }`}>
                            {Math.abs(percentage) < 10 
                              ? 'Neutral' 
                              : isPositive 
                                ? description?.positive || axisInfo?.pos
                                : description?.negative || axisInfo?.neg
                            }
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Similar Words - Enhanced UX */}
            {vibeData.neighbors && vibeData.neighbors.length > 0 && (
              <div className="lg:col-span-2">
                <Card 
                  className="bg-white/10 backdrop-blur-sm border-white/20 transition-all duration-300 hover:bg-white/15"
                  role="region"
                  aria-labelledby="similar-vibes-heading"
                >
                  <CardHeader className="pb-4">
                    <CardTitle 
                      className="text-white text-lg sm:text-xl lg:text-2xl" 
                      id="similar-vibes-heading"
                    >
                      Similar Semantic Patterns
                    </CardTitle>
                    <p className="text-white/60 text-sm mt-2">
                      Words with similar semantic embeddings to "{vibeData.term}"
                    </p>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
                      {vibeData.neighbors.slice(0, 18).map((neighbor, _index) => {
                        const similarity = Math.round((1 - neighbor.distance) * 100)
                        return (
                          <Button
                            key={neighbor.term}
                            variant="outline"
                            onClick={() => handleDemoClick(neighbor.term)}
                            disabled={loadingState.isLoading}
                            className="
                              bg-white/10 hover:bg-white/20 text-white border-white/30 
                              hover:border-emerald-400/50 transition-all duration-300
                              focus-visible:ring-2 focus-visible:ring-emerald-400 
                              focus-visible:ring-offset-2 focus-visible:ring-offset-transparent
                              text-xs sm:text-sm h-auto py-2 px-2 sm:px-3 min-h-[44px]
                              group relative overflow-hidden
                            "
                            aria-label={`Explore similar word: ${neighbor.term}. Similarity: ${similarity}%`}
                            title={`Similarity: ${similarity}%`}
                          >
                            <span className="relative z-10 leading-tight">
                              {neighbor.term}
                            </span>
                            <div 
                              className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                              aria-hidden="true"
                            ></div>
                            
                            {/* Similarity indicator */}
                            {similarity >= 80 && (
                              <div 
                                className="absolute top-1 right-1 w-1.5 h-1.5 bg-emerald-400 rounded-full"
                                aria-hidden="true"
                                title="High similarity"
                              ></div>
                            )}
                          </Button>
                        )
                      })}
                    </div>
                    
                    {/* Show more button if there are additional neighbors */}
                    {vibeData.neighbors.length > 18 && (
                      <div className="mt-4 text-center">
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-white/5 hover:bg-white/10 text-white/70 border-white/20 hover:border-white/30 transition-all duration-300"
                          onClick={() => {
                            // Could implement expanding to show more results
                            console.log('Show more similar words...')
                          }}
                        >
                          +{vibeData.neighbors.length - 18} more similar words
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
            </div>
            
            {/* Enhanced Results for logged-in users */}
            {user && (
              <EnhancedResults 
                analysisType={vibeData.type || 'word'}
                data={vibeData}
                vibeData={vibeData}
              />
            )}
            
            {/* Action Buttons - Mobile Friendly */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center">
              <Button
                onClick={() => {
                  setTerm('')
                  setVibeData(null)
                  setError(null)
                  inputRef.current?.focus()
                }}
                variant="outline"
                className="bg-white/10 hover:bg-white/20 text-white border-white/30 hover:border-white/50 transition-all duration-300 focus-visible:ring-2 focus-visible:ring-cyan-400 min-h-[44px] w-full sm:w-auto"
                aria-label="Start a new analysis"
              >
                <Search className="h-4 w-4 mr-2" aria-hidden="true" />
                New Analysis
              </Button>
              
              {/* Analysis metadata */}
              <div className="text-white/50 text-xs text-center">
                Analysis completed at {new Date().toLocaleTimeString()}
              </div>
            </div>
          </section>
        )}
        
        {/* Information Section */}
        <section className="max-w-6xl mx-auto mt-16 mb-12 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* What is VibeScope */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#67e8f9' }}>
                🔍 What is VibeScope?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                VibeScope is an AI-powered semantic analysis tool that reveals the hidden emotional and contextual dimensions of language. Using advanced embeddings, it maps words and sentences across multiple semantic axes to show their deeper meanings and associations.
              </p>
            </div>

            {/* How It Works */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#c4b5fd' }}>
                ⚙️ How It Works
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Enter any word to see its position on 12 semantic dimensions like masculine-feminine, concrete-abstract, or intense-mild. For sentences, VibeScope detects manipulation techniques, propaganda patterns, and rhetorical strategies used in persuasive communication.
              </p>
            </div>

            {/* Why Use It */}
            <div className="p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h3 className="text-xl font-semibold mb-3" style={{ color: '#f9a8d4' }}>
                💡 Why Use VibeScope?
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                Build media literacy, understand language bias, improve writing clarity, and detect manipulation in communication. Perfect for writers, educators, researchers, and anyone interested in the deeper patterns of language and meaning.
              </p>
            </div>
          </div>

          {/* Detailed Features */}
          <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-2xl font-semibold mb-4 text-center" style={{ color: 'white' }}>
              Understanding the Analysis
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="text-lg font-semibold mb-3" style={{ color: '#67e8f9' }}>
                  📊 Semantic Dimensions for Words
                </h4>
                <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Masculine-Feminine:</strong> Gender-associated qualities and energy</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Concrete-Abstract:</strong> Physical vs conceptual nature</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Active-Passive:</strong> Energy level and dynamism</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Positive-Negative:</strong> Emotional valence and sentiment</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Complex-Simple:</strong> Sophistication and intricacy</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Natural-Artificial:</strong> Authenticity and origin</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-lg font-semibold mb-3" style={{ color: '#f9a8d4' }}>
                  🛡️ Manipulation Detection for Sentences
                </h4>
                <ul className="space-y-2 text-sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Emotional Manipulation:</strong> Appeals to feelings over facts</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Loaded Language:</strong> Words with strong emotional charge</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>False Dichotomy:</strong> Presenting only two options</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Bandwagon Effect:</strong> "Everyone else is doing it"</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Fear Tactics:</strong> Using anxiety to persuade</li>
                  <li>• <strong style={{ color: 'rgba(255, 255, 255, 0.9)' }}>Gaslighting:</strong> Making you question reality</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 p-4 rounded" style={{ backgroundColor: 'rgba(103, 232, 249, 0.1)', border: '1px solid rgba(103, 232, 249, 0.2)' }}>
              <p className="text-sm text-center" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                <strong>📚 Educational Purpose:</strong> VibeScope is designed to enhance critical thinking and media literacy. 
                Use it to understand language patterns, not to judge or manipulate others.
              </p>
            </div>
          </div>

          {/* How to Interpret Results */}
          <div className="mt-8 p-6 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <h3 className="text-2xl font-semibold mb-4 text-center" style={{ color: 'white' }}>
              How to Interpret Your Results
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <h4 className="font-semibold mb-2" style={{ color: '#10B981' }}>
                  🟢 Radar Chart
                </h4>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  The spider web visualization shows how a word scores on each dimension. Larger areas mean stronger associations with those qualities.
                </p>
              </div>
              
              <div className="p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <h4 className="font-semibold mb-2" style={{ color: '#F59E0B' }}>
                  🟡 Dimension Scores
                </h4>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Scores range from -100 to +100. Positive scores lean toward the first trait, negative toward the second. Near zero means neutral.
                </p>
              </div>
              
              <div className="p-4 rounded" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                <h4 className="font-semibold mb-2" style={{ color: '#EF4444' }}>
                  🔴 Manipulation Score
                </h4>
                <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  For sentences, scores above 70 indicate high manipulation, 40-70 moderate, below 40 low. Higher scores mean more persuasive tactics detected.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer - Enhanced */}
        <footer className="mt-12 sm:mt-16 py-8 border-t" style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}>
          <div className="max-w-4xl mx-auto text-center space-y-4 px-4">
            <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
              <strong>VibeScope</strong> • AI-Powered Semantic Analysis Tool
            </p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
              Built with Next.js, OpenAI Embeddings, and Voyage AI • For educational and research purposes only
            </p>
            <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.3)' }}>
              Remember: Language is complex and context-dependent. Use these insights as one tool among many for understanding communication.
            </p>
          </div>
        </footer>
      </div>
    </div>
  )
}