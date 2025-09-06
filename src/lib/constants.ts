// Application constants and configuration

export const APP_CONFIG = {
  name: 'VibeScope',
  description: 'AI-Powered Semantic Analysis Tool',
  url: process.env.NEXT_PUBLIC_URL || 'https://vibescope.vercel.app',
  version: '1.0.0'
} as const

export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryLimit: 3,
  rateLimit: {
    maxRequests: 10,
    windowMs: 60000 // 1 minute
  }
} as const

export const UI_CONFIG = {
  breakpoints: {
    mobile: 640,
    tablet: 768,
    desktop: 1024,
    wide: 1280
  },
  animation: {
    fast: 150,
    normal: 300,
    slow: 500
  },
  debounceTime: 300
} as const

export const DEMO_DATA = {
  words: ['punk', 'zen', 'love', 'freedom', 'technology', 'serenity', 'chaos', 'harmony'] as const,
  sentences: [
    'Everyone knows this is the only solution that works',
    'They don\'t want you to know the truth about this', 
    'You\'re either with us or against us',
    'Studies show this might potentially help in some cases',
    'This breakthrough technology will change everything',
    'Join thousands of satisfied customers today'
  ] as const
} as const

export const ACCESSIBILITY = {
  minTouchTarget: 44, // pixels
  colorContrast: {
    normal: 4.5,
    large: 3.0
  },
  focusRing: {
    width: 2,
    color: 'rgba(59, 130, 246, 0.5)', // blue-500/50
    offset: 2
  }
} as const

export const ERROR_MESSAGES = {
  networkError: 'Network connection failed. Please check your internet connection.',
  timeoutError: 'Request timed out. The server is taking too long to respond.',
  rateLimitError: 'Too many requests. Please wait a moment before trying again.',
  validationError: 'Invalid input. Please check your text and try again.',
  serverError: 'Server error. Please try again in a moment.',
  unknownError: 'An unexpected error occurred. Please try again.'
} as const

export const SUCCESS_MESSAGES = {
  analysisComplete: 'Analysis completed successfully',
  dataLoaded: 'Data loaded',
  actionCompleted: 'Action completed'
} as const

export const SEMANTIC_COLORS = {
  positive: {
    bg: 'bg-emerald-500',
    text: 'text-emerald-300',
    border: 'border-emerald-500',
    gradient: 'from-emerald-500 to-emerald-600'
  },
  negative: {
    bg: 'bg-orange-500', 
    text: 'text-orange-300',
    border: 'border-orange-500',
    gradient: 'from-orange-500 to-orange-600'
  },
  neutral: {
    bg: 'bg-gray-500',
    text: 'text-gray-300', 
    border: 'border-gray-500',
    gradient: 'from-gray-500 to-gray-600'
  },
  warning: {
    bg: 'bg-red-500',
    text: 'text-red-300',
    border: 'border-red-500', 
    gradient: 'from-red-500 to-red-600'
  }
} as const