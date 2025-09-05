'use client'

import { useState, useEffect } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TourStep {
  title: string
  description: string
  target?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
}

const tourSteps: TourStep[] = [
  {
    title: "Welcome to VibeScope! 🎉",
    description: "Discover the hidden emotional and semantic dimensions of language using AI. Let's take a quick tour!",
  },
  {
    title: "Analyze Any Word",
    description: "Type any word to see its position across 12 semantic dimensions like masculine-feminine, concrete-abstract, and more.",
    target: "#analysis-input",
    position: "bottom"
  },
  {
    title: "Detect Manipulation",
    description: "Enter full sentences to detect propaganda techniques, emotional manipulation, and persuasion patterns.",
    target: "#analysis-input",
    position: "bottom"
  },
  {
    title: "Visual Insights",
    description: "See your results as beautiful radar charts and get AI-powered insights about the patterns we find.",
    target: ".demo-buttons",
    position: "top"
  },
  {
    title: "Track Your Journey",
    description: "Create a free account after 2 analyses to save your history, track progress, and unlock advanced features!",
  }
]

export function WelcomeTour() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [hasSeenTour, setHasSeenTour] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('vibescope_tour_seen')
    if (!seen) {
      setTimeout(() => setIsOpen(true), 1500)
    } else {
      setHasSeenTour(true)
    }
  }, [])

  const handleComplete = () => {
    localStorage.setItem('vibescope_tour_seen', 'true')
    setIsOpen(false)
    setHasSeenTour(true)
  }

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleComplete()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSkip = () => {
    handleComplete()
  }

  if (!isOpen || hasSeenTour) return null

  const step = tourSteps[currentStep]
  const progress = ((currentStep + 1) / tourSteps.length) * 100

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)' }}
        onClick={handleSkip}
      />
      
      {/* Tour Modal */}
      <div 
        className="fixed z-50 p-6 rounded-xl shadow-2xl max-w-md transform -translate-x-1/2 -translate-y-1/2"
        style={{
          top: '50%',
          left: '50%',
          background: 'linear-gradient(135deg, #1a1625 0%, #2d1b69 100%)',
          border: '1px solid rgba(139, 92, 246, 0.3)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl overflow-hidden">
          <div 
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(to right, #667eea, #764ba2)'
            }}
          />
        </div>
        
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="h-5 w-5" style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
        </button>
        
        {/* Content */}
        <div className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: index === currentStep ? '24px' : '6px',
                    backgroundColor: index <= currentStep 
                      ? '#8b5cf6' 
                      : 'rgba(255, 255, 255, 0.2)'
                  }}
                />
              ))}
            </div>
            <span className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
              {currentStep + 1} of {tourSteps.length}
            </span>
          </div>
          
          {/* Icon */}
          <div className="flex justify-center">
            <div 
              className="p-3 rounded-full"
              style={{ backgroundColor: 'rgba(139, 92, 246, 0.2)' }}
            >
              <Sparkles className="h-8 w-8" style={{ color: '#8b5cf6' }} />
            </div>
          </div>
          
          {/* Title and description */}
          <div className="text-center space-y-2">
            <h2 className="text-xl font-bold" style={{ color: 'white' }}>
              {step.title}
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
              {step.description}
            </p>
          </div>
          
          {/* Navigation buttons */}
          <div className="flex items-center justify-between pt-4">
            <Button
              onClick={handlePrevious}
              variant="ghost"
              size="sm"
              disabled={currentStep === 0}
              style={{ 
                color: currentStep === 0 ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.7)' 
              }}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <button
              onClick={handleSkip}
              className="text-xs"
              style={{ color: 'rgba(255, 255, 255, 0.5)' }}
            >
              Skip tour
            </button>
            
            <Button
              onClick={handleNext}
              size="sm"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}
            >
              {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}