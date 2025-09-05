'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'

const SESSION_KEY = 'vibescope_session'
const ANALYSIS_COUNT_KEY = 'vibescope_analysis_count'
const LAST_PROMPT_KEY = 'vibescope_last_prompt'

interface SessionData {
  id: string
  createdAt: string
  analysisCount: number
  lastAnalysis: string | null
  hasSeenLoginPrompt: boolean
}

export function useSessionTracking() {
  const { user } = useAuth()
  const [session, setSession] = useState<SessionData | null>(null)
  const [shouldShowLoginPrompt, setShouldShowLoginPrompt] = useState(false)

  useEffect(() => {
    // Initialize or get existing session
    if (typeof window !== 'undefined') {
      const storedSession = localStorage.getItem(SESSION_KEY)
      
      if (storedSession) {
        const parsed = JSON.parse(storedSession)
        setSession(parsed)
      } else {
        // Create new session
        const newSession: SessionData = {
          id: `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          analysisCount: 0,
          lastAnalysis: null,
          hasSeenLoginPrompt: false
        }
        localStorage.setItem(SESSION_KEY, JSON.stringify(newSession))
        setSession(newSession)
      }
    }
  }, [])

  const incrementAnalysisCount = () => {
    if (!user && session) {
      const updatedSession = {
        ...session,
        analysisCount: session.analysisCount + 1,
        lastAnalysis: new Date().toISOString()
      }
      
      setSession(updatedSession)
      localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
      
      // Check if we should show login prompt
      // Show after 2nd use, but only once per day
      if (updatedSession.analysisCount === 2 && !updatedSession.hasSeenLoginPrompt) {
        const lastPrompt = localStorage.getItem(LAST_PROMPT_KEY)
        const now = new Date()
        const shouldPrompt = !lastPrompt || 
          (new Date(lastPrompt).getDate() !== now.getDate())
        
        if (shouldPrompt) {
          setShouldShowLoginPrompt(true)
          localStorage.setItem(LAST_PROMPT_KEY, now.toISOString())
          
          // Mark that we've shown the prompt
          updatedSession.hasSeenLoginPrompt = true
          localStorage.setItem(SESSION_KEY, JSON.stringify(updatedSession))
        }
      }
      
      // Show gentle reminder after every 5 analyses for non-logged in users
      if (updatedSession.analysisCount > 2 && updatedSession.analysisCount % 5 === 0) {
        setShouldShowLoginPrompt(true)
      }
    }
  }

  const dismissLoginPrompt = () => {
    setShouldShowLoginPrompt(false)
  }

  const resetSession = () => {
    if (user) {
      // Clear anonymous session when user logs in
      localStorage.removeItem(SESSION_KEY)
      localStorage.removeItem(ANALYSIS_COUNT_KEY)
      setSession(null)
    }
  }

  useEffect(() => {
    if (user) {
      resetSession()
    }
  }, [user])

  return {
    session,
    shouldShowLoginPrompt,
    incrementAnalysisCount,
    dismissLoginPrompt,
    isAnonymous: !user,
    analysisCount: session?.analysisCount || 0,
    remainingFreeAnalyses: Math.max(0, 10 - (session?.analysisCount || 0))
  }
}