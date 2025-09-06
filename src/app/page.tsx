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
import { Search, AlertCircle, Info, ArrowRight, Sparkles, Brain, Shield, LogIn, Zap, Activity, BarChart3, GitCompare, Settings, FileText, BarChart2, Save, BookOpen } from 'lucide-react'
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
import { BatchAnalysis } from '@/components/analysis/batch-analysis'
import { InsightsDashboard } from '@/components/analysis/insights-dashboard'
import { SavedAnalyses, saveAnalysisToStorage } from '@/components/analysis/saved-analyses'
import { ReportGenerator } from '@/components/analysis/report-generator'
import { TextImprover } from '@/components/analysis/text-improver'
import { ShareAnalysis } from '@/components/analysis/share-analysis'
import { TabbedResults } from '@/components/analysis/tabbed-results'

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
  const [activeTab, setActiveTab] = useState<'analyze' | 'batch' | 'insights' | 'saved'>('analyze')
  
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
            <p className="text-lg sm:text-xl lg:text-2xl mb-4 max-w-4xl mx-auto leading-relaxed px-2" 
               style={{ color: 'var(--text-secondary)' }}>
              Analyze language at every level: from individual words to full headlines and posts
            </p>
            <p className="text-base sm:text-lg mb-8 max-w-3xl mx-auto px-2" 
               style={{ color: 'var(--text-tertiary)' }}>
              Uncover semantic dimensions of words • Detect manipulation in sentences • Identify propaganda techniques
            </p>
          </div>
          
          {/* Simplified feature highlights */}
          <div className="flex flex-wrap justify-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComparison(!showComparison)}
              className={`glass-card px-4 py-2 flex items-center gap-2 hover:scale-105 transition-transform ${
                showComparison ? 'bg-white/10 border-purple-400' : ''
              }`}
            >
              <GitCompare className="h-4 w-4 text-purple-400" />
              <span className="text-sm font-medium">Compare</span>
            </Button>
          </div>
          
          {/* Use Cases Banner */}
          <div className="max-w-5xl mx-auto mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 glass-card-elevated border-l-4 border-purple-400">
              <h3 className="font-semibold text-purple-400 mb-2 flex items-center gap-2">
                <Brain className="h-4 w-4" />
                Words
              </h3>
              <p className="text-xs text-white/70 mb-2">Explore semantic dimensions</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs chip">Concrete/Abstract</span>
                <span className="text-xs chip">Positive/Negative</span>
                <span className="text-xs chip">Active/Passive</span>
              </div>
            </div>
            <div className="p-4 glass-card-elevated border-l-4 border-orange-400">
              <h3 className="font-semibold text-orange-400 mb-2 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Sentences
              </h3>
              <p className="text-xs text-white/70 mb-2">Detect manipulation patterns</p>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs chip">Headlines</span>
                <span className="text-xs chip">Tweets</span>
                <span className="text-xs chip">Speeches</span>
              </div>
            </div>
          </div>
          
          {/* Tab Navigation */}
          <div className="flex justify-center mb-8">
            <div className="glass-card p-1 inline-flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('analyze')}
                className={`px-6 py-2 transition-all ${
                  activeTab === 'analyze' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Analyze
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('batch')}
                className={`px-6 py-2 transition-all ${
                  activeTab === 'batch' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <FileText className="h-4 w-4 mr-2" />
                Batch
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('insights')}
                className={`px-6 py-2 transition-all ${
                  activeTab === 'insights' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <BarChart2 className="h-4 w-4 mr-2" />
                Insights
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-2 transition-all ${
                  activeTab === 'saved' ? 'bg-white/10 text-white' : 'text-white/70 hover:text-white'
                }`}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Saved
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content Based on Active Tab */}
        {activeTab === 'analyze' && (
          <>
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
                      placeholder="Enter a word or paste text..."
                      className="input-dark h-14 sm:h-16 text-base sm:text-lg font-medium px-6 pr-[110px] sm:pr-[140px]"
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 sm:h-12 px-4 sm:px-6 btn-primary shadow-lg hover:shadow-xl"
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
                      Try these example headlines and tweets:
                    </p>
                    <div className="flex flex-col gap-2">
                      {[
                        '"BREAKING: Scientists discover miracle cure that doctors hate"',
                        '"Everyone is saying this is the worst decision ever made"',
                        '"You won\'t believe what this celebrity just did"',
                        '"Studies show this one weird trick changes everything"',
                        '"They don\'t want you to know about this secret"'
                      ].map((demo, index) => (
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

        {/* Results Section - New Tabbed View */}
        {vibeData && !showComparison && (
          <section className="max-w-6xl mx-auto space-y-8 animate-slide-up">
            {/* Analysis Info Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center gap-2 chip chip-success mb-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                <span>Analysis complete</span>
              </div>
              <h2 className="text-2xl font-bold">
                {vibeData.type === 'sentence' ? 'Text' : 'Word'} Analysis Results
              </h2>
              <p className="text-white/60 text-sm max-w-2xl mx-auto">
                "{vibeData.term.slice(0, 100)}{vibeData.term.length > 100 ? '...' : ''}"
              </p>
            </div>
            
            {/* Tabbed Results Component */}
            <TabbedResults 
              vibeData={vibeData}
              analysisType={vibeData.type || (isSentence(vibeData.term) ? 'sentence' : 'word')}
            />
            
            {/* Action Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Share Analysis */}
            <ShareAnalysis 
              analysisData={vibeData}
              term={vibeData.term}
              type={vibeData.type || 'word'}
            />
            
            {/* Export & Share */}
            <ExportAnalysis 
              data={vibeData}
              term={vibeData.term}
              type={vibeData.type || 'word'}
            />
            
            {/* Report Generator */}
            <ReportGenerator 
              analysisData={vibeData}
              userId={user?.id}
            />
            
            {/* Text Improvement Suggestions */}
            {vibeData.type === 'sentence' && (
              <TextImprover 
                originalText={vibeData.term}
                analysisResult={vibeData}
                onApplySuggestion={(improvedText) => {
                  setTerm(improvedText)
                }}
              />
            )}
            
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
              
              <Button
                onClick={() => {
                  const title = prompt('Enter a title for this saved analysis:')
                  if (title) {
                    saveAnalysisToStorage(
                      title,
                      vibeData.term,
                      vibeData.type || 'word',
                      vibeData,
                      [],
                      '',
                      undefined,
                      user?.id
                    )
                    alert('Analysis saved successfully!')
                  }
                }}
                variant="outline"
                className="btn-secondary"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Analysis
              </Button>
            </div>
          </section>
        )}
          </>
        )}
        
        {/* Batch Analysis Tab */}
        {activeTab === 'batch' && (
          <section className="max-w-4xl mx-auto animate-slide-up">
            <BatchAnalysis
              onAnalyze={async (term) => {
                const endpoint = isSentence(term)
                  ? `/api/vibe/analyze-sentence?text=${encodeURIComponent(term)}`
                  : `/api/vibe?term=${encodeURIComponent(term)}`
                
                const res = await fetch(endpoint)
                if (!res.ok) throw new Error('Failed to analyze')
                return await res.json()
              }}
            />
          </section>
        )}
        
        {/* Insights Dashboard Tab */}
        {activeTab === 'insights' && (
          <section className="max-w-6xl mx-auto animate-slide-up">
            <InsightsDashboard userId={user?.id} />
          </section>
        )}
        
        {/* Saved Analyses Tab */}
        {activeTab === 'saved' && (
          <section className="max-w-6xl mx-auto animate-slide-up">
            <SavedAnalyses 
              userId={user?.id}
              onLoad={(analysis) => {
                setTerm(analysis.text)
                setVibeData({
                  term: analysis.text,
                  type: analysis.type,
                  axes: analysis.result?.axes || {},
                  propaganda: analysis.result?.propaganda,
                  neighbors: analysis.result?.neighbors
                })
                setActiveTab('analyze')
              }}
            />
          </section>
        )}
      </div>
    </div>
  )
}