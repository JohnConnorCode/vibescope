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
import { Search, AlertCircle, Info, ArrowRight, Sparkles, Brain, Shield, LogIn, Zap, Activity, BarChart3, GitCompare, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth/auth-provider'
import { useSessionTracking } from '@/lib/hooks/useSessionTracking'
import { LoginPrompt } from '@/components/auth/login-prompt'
import { UsageTracker } from '@/components/usage/usage-tracker'
import { EnhancedResults } from '@/components/analysis/enhanced-results'
import { WelcomeTour } from '@/components/onboarding/welcome-tour'
import { AuthModal } from '@/components/auth/auth-modal'
import { AnalysisSuggestions } from '@/components/analysis/analysis-suggestions'
import { ComparisonMode } from '@/components/analysis/comparison-mode'
import { ExportAnalysis } from '@/components/analysis/export-analysis'
import { AnalysisHistory, addToAnalysisHistory } from '@/components/analysis/analysis-history'
import { AdvancedFilters, type AnalysisFilters } from '@/components/analysis/advanced-filters'

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

export default function HomePage() {
  const [term, setTerm] = useState('')
  const [vibeData, setVibeData] = useState<VibeData | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({ isLoading: false, isRetrying: false })
  const [error, setError] = useState<ApiError | null>(null)
  const [inputError, setInputError] = useState<string>('')
  const [isSubmissionDisabled, setIsSubmissionDisabled] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showComparison, setShowComparison] = useState(false)
  const [analysisFilters, setAnalysisFilters] = useState<AnalysisFilters | undefined>()
  
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
      
      // Build query params with filters
      const params = new URLSearchParams()
      if (isAnalyzingSentence) {
        params.append('text', sanitizedTerm)
      } else {
        params.append('term', sanitizedTerm)
      }
      
      // Add filter parameters if they exist
      if (analysisFilters) {
        if (analysisFilters.context !== 'general') {
          params.append('context', analysisFilters.context)
        }
        if (analysisFilters.sensitivity !== 'medium') {
          params.append('sensitivity', analysisFilters.sensitivity)
        }
        if (analysisFilters.focus.length > 0) {
          params.append('focus', analysisFilters.focus.join(','))
        }
      }
      
      const endpoint = isAnalyzingSentence 
        ? `/api/vibe/analyze-sentence?${params.toString()}`
        : `/api/vibe?${params.toString()}`
      
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
      
      // Add to history
      addToAnalysisHistory(
        sanitizedTerm,
        isAnalyzingSentence ? 'sentence' : 'word',
        isAnalyzingSentence && data.propaganda ? data.propaganda.overallManipulation : undefined,
        user?.id
      )
      
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
  }, [loadingState.isLoading, trackAnalysis, user?.id, analysisFilters])

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
    setShowComparison(false) // Exit comparison mode when selecting new term
    // Small delay to allow state to update
    setTimeout(() => {
      fetchVibe(demoTerm)
    }, 50)
  }, [fetchVibe])
  
  const handleHistorySelect = useCallback((selectedTerm: string) => {
    setTerm(selectedTerm)
    setShowComparison(false)
    setTimeout(() => {
      fetchVibe(selectedTerm)
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
  
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-3xl animate-float" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="fixed inset-0 grid-pattern pointer-events-none opacity-30" />
      
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
      
      <div className="container mx-auto px-4 py-4 sm:py-8 max-w-7xl relative z-10">
        {/* Header with Auth */}
        <header className="mb-8 sm:mb-12 animate-fade-in">
          {/* User Auth Section */}
          <div className="flex justify-end mb-6">
            {user ? (
              <div className="glass-card px-4 py-2 inline-flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                  Welcome back!
                </span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => window.location.href = '/dashboard'}
                  className="hover:bg-white/10 transition-colors"
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAuthModal(true)}
                className="glass-card hover:bg-white/10 transition-all hover:scale-105 px-4 py-2 flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                <span className="font-medium">Sign In</span>
              </Button>
            )}
          </div>
          
          <div className="text-center">
            <div className="inline-block animate-float">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 relative">
                <span className="text-gradient neon-text">VibeScope</span>
                <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur-3xl opacity-30 animate-pulse-glow" />
              </h1>
            </div>
            <p className="text-lg sm:text-xl lg:text-2xl mb-8 max-w-4xl mx-auto leading-relaxed px-2" 
               style={{ color: 'var(--text-secondary)' }}>
              Discover the hidden emotional and semantic dimensions of language with AI-powered analysis
            </p>
          </div>
          
          {/* Feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <div className="glass-card px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20">
                <Brain className="h-4 w-4 text-purple-400" />
              </div>
              <span className="text-sm font-medium">Semantic Analysis</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                <Shield className="h-4 w-4 text-orange-400" />
              </div>
              <span className="text-sm font-medium">Manipulation Detection</span>
            </div>
            <div className="glass-card px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform cursor-default">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20">
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              <span className="text-sm font-medium">AI Powered</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              className={`glass-card px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform ${
                showComparison ? 'bg-white/10 border-purple-400' : ''
              }`}
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-pink-500/20 to-purple-600/20">
                <GitCompare className="h-4 w-4 text-pink-400" />
              </div>
              <span className="text-sm font-medium">Compare Mode</span>
            </Button>
          </div>
        </header>

        {/* Search Card */}
        <main className="max-w-2xl mx-auto mb-8 sm:mb-12 animate-slide-up">
          <div className="gradient-border relative">
            <div className="glass-card-elevated backdrop-blur-xl">
              <CardContent className="p-6 sm:p-8">
              {/* Usage Tracker for anonymous users */}
              {!user && analysisCount > 0 && (
                <div className="mb-6">
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
                      className="input-dark h-14 sm:h-16 pl-6 pr-32 text-base sm:text-lg font-medium"
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
                      className="absolute right-2 top-2 h-10 sm:h-12 px-6 btn-primary shadow-lg hover:shadow-xl"
                      aria-label="Analyze input text"
                    >
                      {loadingState.isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="loading-spinner w-4 h-4" />
                          <span className="hidden sm:inline font-semibold">Analyzing</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Search className="h-4 w-4" />
                          <span className="font-semibold">Analyze</span>
                        </div>
                      )}
                    </Button>
                  </div>
                  
                  {/* Input validation error */}
                  {inputError && (
                    <div 
                      id="input-error"
                      className="flex items-center gap-2 text-red-400 text-sm"
                      role="alert"
                      aria-live="polite"
                    >
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      <span>{inputError}</span>
                    </div>
                  )}
                  
                  {/* Loading progress */}
                  {loadingState.isLoading && loadingState.progress && (
                    <div 
                      className="flex items-center gap-2 text-purple-400 text-sm"
                      aria-live="polite"
                      aria-label="Analysis progress"
                    >
                      <Activity className="h-4 w-4 animate-pulse" />
                      <span>{loadingState.progress}</span>
                    </div>
                  )}
                  
                  {/* Helper text */}
                  {!inputError && !loadingState.isLoading && (
                    <div className="flex items-center justify-between">
                      <p 
                        id="input-help" 
                        className="text-xs sm:text-sm flex items-center gap-2"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        <Info className="h-3 w-3 flex-shrink-0" />
                        <span>Single words show semantic dimensions, sentences reveal manipulation patterns</span>
                      </p>
                      <AdvancedFilters 
                        onApplyFilters={setAnalysisFilters}
                        currentFilters={analysisFilters}
                      />
                    </div>
                  )}
                </div>
              </form>

              {/* Demo Examples */}
              {!vibeData && !loadingState.isLoading && (
                <div className="mt-8 space-y-6">
                  {/* Word Demos */}
                  <div className="space-y-4">
                    <p className="text-sm text-center flex items-center justify-center gap-2" 
                       style={{ color: 'var(--text-tertiary)' }}>
                      <Sparkles className="h-4 w-4" />
                      Try analyzing these words:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center demo-buttons">
                      {DEMO_VIBES.map(demo => (
                        <Button
                          key={demo}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDemoClick(demo)}
                          disabled={loadingState.isLoading}
                          className="glass-card hover:bg-white/10 hover:scale-105 transition-all px-4 py-2"
                        >
                          <span className="font-medium">{demo}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Sentence Demos */}
                  <div className="space-y-4">
                    <p className="text-sm text-center flex items-center justify-center gap-2"
                       style={{ color: 'var(--text-tertiary)' }}>
                      <Shield className="h-4 w-4" />
                      Or detect manipulation in these sentences:
                    </p>
                    <div className="flex flex-col gap-2">
                      {DEMO_SENTENCES.map((demo, index) => (
                        <Button
                          key={index}
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDemoClick(demo)}
                          disabled={loadingState.isLoading}
                          className="glass-card hover:bg-white/10 hover:scale-[1.02] transition-all text-left justify-start px-4 py-3"
                        >
                          <ArrowRight className="h-3 w-3 mr-2 flex-shrink-0 text-purple-400" />
                          <span className="truncate font-medium">"{demo}"</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              </CardContent>
            </div>
          </div>
        </main>
        
        {/* Analysis History */}
        {!loadingState.isLoading && !vibeData && (
          <section className="max-w-4xl mx-auto mb-8 animate-slide-up">
            <AnalysisHistory 
              onSelectItem={handleHistorySelect}
              userId={user?.id}
            />
          </section>
        )}

        {/* Error Message */}
        {error && (
          <section className="max-w-4xl mx-auto mb-8 animate-fade-in">
            <Alert className="glass-card border-red-500/30">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold mb-2 text-red-300">
                    Analysis Error
                  </h3>
                  <AlertDescription className="space-y-3">
                    <p style={{ color: 'var(--text-secondary)' }}>{error.message}</p>
                    
                    {error.retryable && retryCount < 3 && (
                      <div className="mt-4">
                        <Button
                          onClick={handleRetry}
                          size="sm"
                          className="btn-primary"
                          disabled={loadingState.isRetrying}
                        >
                          {loadingState.isRetrying ? (
                            <>
                              <div className="loading-spinner w-4 h-4 mr-2" />
                              Retrying...
                            </>
                          ) : (
                            'Try Again'
                          )}
                        </Button>
                      </div>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          </section>
        )}

        {/* Loading State */}
        {loadingState.isLoading && !vibeData && (
          <section className="max-w-6xl mx-auto mb-8 animate-fade-in">
            <div className="glass-card-elevated p-8">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="loading-spinner mx-auto mb-4" />
                  <div className="absolute inset-0 loading-spinner mx-auto mb-4 blur-xl opacity-50" />
                </div>
                <h3 className="text-xl mb-2 font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Analyzing "{term.slice(0, 50)}{term.length > 50 ? '...' : ''}"
                </h3>
                {loadingState.progress && (
                  <p className="animate-pulse" style={{ color: 'var(--text-tertiary)' }}>
                    {loadingState.progress}
                  </p>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Comparison Mode */}
        {showComparison && !loadingState.isLoading && (
          <section className="max-w-6xl mx-auto mb-8 animate-slide-up">
            <ComparisonMode
              initialTerm={vibeData?.term}
              initialData={vibeData?.axes}
              onAnalyze={async (compTerm) => {
                const endpoint = isSentence(compTerm)
                  ? `/api/vibe/analyze-sentence?text=${encodeURIComponent(compTerm)}`
                  : `/api/vibe?term=${encodeURIComponent(compTerm)}`
                
                const res = await fetch(endpoint)
                if (!res.ok) throw new Error('Failed to analyze')
                return await res.json()
              }}
            />
          </section>
        )}

        {/* Results Section */}
        {vibeData && !showComparison && (
          <section className="max-w-6xl mx-auto space-y-8 animate-slide-up">
            {/* Success feedback */}
            <div className="text-center">
              <div className="inline-flex items-center gap-2 chip chip-success">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Analysis complete</span>
              </div>
            </div>
            
            {/* Propaganda Analysis for Sentences */}
            {vibeData.type === 'sentence' && vibeData.propaganda && (
              <div className="glass-card-elevated p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Shield className="h-6 w-6 text-orange-400" />
                  <h2 className="text-2xl font-bold">Manipulation Analysis</h2>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overall Score */}
                  <div className="text-center p-6 glass-card">
                    <div className={`text-4xl font-bold mb-2 ${
                      vibeData.propaganda.overallManipulation > 70 ? 'text-red-400' :
                      vibeData.propaganda.overallManipulation > 40 ? 'text-orange-400' : 'text-green-400'
                    }`}>
                      {Math.round(vibeData.propaganda.overallManipulation)}
                      <span className="text-lg" style={{ color: 'var(--text-muted)' }}>/100</span>
                    </div>
                    <div className="font-semibold">Overall Manipulation</div>
                  </div>
                  
                  {/* Individual Scores */}
                  {Object.entries(vibeData.propaganda)
                    .filter(([key]) => key !== 'overallManipulation' && key !== 'techniques' && key !== 'explanations')
                    .map(([key, value]) => {
                      const score = Math.round(value as number)
                      if (score === 0) return null
                      
                      return (
                        <div key={key} className="p-4 glass-card">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </span>
                            <span className={`font-bold ${
                              score > 70 ? 'text-red-400' :
                              score > 40 ? 'text-orange-400' : 'text-green-400'
                            }`}>
                              {score}
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-1000 ${
                                score > 70 ? 'bg-red-500' :
                                score > 40 ? 'bg-orange-500' : 'bg-green-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
                
                {/* Detected Techniques */}
                {vibeData.propaganda.techniques.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Detected Techniques</h3>
                    <div className="space-y-3">
                      {vibeData.propaganda.explanations.map((explanation, index) => (
                        <div key={index} className="p-4 glass-card">
                          <h4 className="text-orange-400 font-medium mb-2">
                            {vibeData.propaganda.techniques[index].replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          <p style={{ color: 'var(--text-secondary)' }}>{explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div className="glass-card-elevated p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-purple-400" />
                    Semantic Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart data={radarData}>
                        <PolarGrid stroke="rgba(255,255,255,0.1)" />
                        <PolarAngleAxis 
                          dataKey="axis" 
                          tick={{ 
                            fontSize: isMobile ? 10 : 12, 
                            fill: 'var(--text-secondary)',
                            fontWeight: 500
                          }}
                        />
                        <PolarRadiusAxis 
                          domain={[0, 100]} 
                          tick={{ 
                            fontSize: isMobile ? 8 : 10, 
                            fill: 'var(--text-muted)'
                          }}
                          tickCount={6}
                        />
                        <Radar 
                          name="Semantic Profile" 
                          dataKey="score" 
                          stroke="#a855f7" 
                          fill="#7c3aed" 
                          fillOpacity={0.3} 
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </div>

              {/* Dimension Scores */}
              <div className="glass-card-elevated p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Dimension Analysis</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                    {Object.entries(vibeData.axes).map(([axis, value]) => {
                      const axisInfo = AXES.find(a => a.key === axis)
                      const percentage = Math.round(value * 100)
                      const absPercentage = Math.abs(percentage)
                      const isPositive = value > 0
                      
                      return (
                        <div key={axis} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">
                              {axisInfo?.label || axis}
                            </span>
                            <span className={`text-sm font-bold ${
                              Math.abs(percentage) < 10 
                                ? 'text-gray-400'
                                : isPositive 
                                  ? 'text-purple-400' 
                                  : 'text-blue-400'
                            }`}>
                              {percentage > 0 ? '+' : ''}{percentage}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs w-20 text-right" style={{ color: 'var(--text-muted)' }}>
                              {axisInfo?.pos}
                            </span>
                            <div className="flex-1 h-2 bg-gray-800 rounded-full relative">
                              <div 
                                className={`absolute top-0 h-2 rounded-full transition-all duration-700 ${
                                  isPositive 
                                    ? 'bg-gradient-to-r from-purple-600 to-purple-400 left-1/2' 
                                    : 'bg-gradient-to-r from-blue-600 to-blue-400 right-1/2'
                                }`}
                                style={{ 
                                  width: `${absPercentage/2}%`,
                                  ...(isPositive ? {} : { transform: 'translateX(100%)' })
                                }}
                              />
                              <div className="absolute top-0 left-1/2 transform -translate-x-0.5 w-0.5 h-2 bg-gray-600" />
                            </div>
                            <span className="text-xs w-20" style={{ color: 'var(--text-muted)' }}>
                              {axisInfo?.neg}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </div>
            </div>
            
            {/* Similar Words */}
            {vibeData.neighbors && vibeData.neighbors.length > 0 && (
              <div className="glass-card-elevated p-6">
                <CardHeader className="px-0 pt-0">
                  <CardTitle>Similar Semantic Patterns</CardTitle>
                </CardHeader>
                <CardContent className="px-0 pb-0">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
                    {vibeData.neighbors.slice(0, 18).map((neighbor) => {
                      const similarity = Math.round((1 - neighbor.distance) * 100)
                      return (
                        <Button
                          key={neighbor.term}
                          variant="outline"
                          onClick={() => handleDemoClick(neighbor.term)}
                          disabled={loadingState.isLoading}
                          className="btn-secondary text-xs"
                          title={`Similarity: ${similarity}%`}
                        >
                          {neighbor.term}
                        </Button>
                      )
                    })}
                  </div>
                </CardContent>
              </div>
            )}
            
            {/* Export & Share */}
            <ExportAnalysis 
              data={vibeData}
              term={vibeData.term}
              type={vibeData.type || 'word'}
            />
            
            {/* Analysis Suggestions */}
            <AnalysisSuggestions
              currentTerm={vibeData.term}
              onSuggestionClick={handleDemoClick}
              analysisType={vibeData.type}
            />
            
            {/* Enhanced Results for logged-in users */}
            {user && (
              <EnhancedResults 
                analysisType={vibeData.type || 'word'}
                data={vibeData}
                vibeData={vibeData}
              />
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => {
                  setTerm('')
                  setVibeData(null)
                  setError(null)
                  setShowComparison(false)
                  inputRef.current?.focus()
                }}
                variant="outline"
                className="btn-secondary"
              >
                <Search className="h-4 w-4 mr-2" />
                New Analysis
              </Button>
              
              <Button
                onClick={() => setShowComparison(true)}
                variant="outline"
                className="btn-secondary"
              >
                <GitCompare className="h-4 w-4 mr-2" />
                Compare Terms
              </Button>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}