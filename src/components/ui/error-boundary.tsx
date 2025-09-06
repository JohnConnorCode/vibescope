'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="glass-card-elevated p-8 max-w-md w-full text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 rounded-full bg-red-500/20">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-white/60 mb-6">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => window.location.reload()}
                className="glass-card hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="glass-card hover:bg-white/10"
              >
                <Home className="h-4 w-4 mr-2" />
                Go Home
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="glass-card-elevated p-8 max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="p-3 rounded-full bg-red-500/20">
            <AlertTriangle className="h-8 w-8 text-red-400" />
          </div>
        </div>
        
        <h2 className="text-xl font-semibold mb-2">Analysis Error</h2>
        <p className="text-white/60 mb-6">
          {error.message || 'Failed to complete the analysis'}
        </p>
        
        <div className="flex gap-3 justify-center">
          <Button
            onClick={reset}
            className="glass-card hover:bg-white/10"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
            className="glass-card hover:bg-white/10"
          >
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}