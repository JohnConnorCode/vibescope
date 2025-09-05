// Input validation utilities

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitized?: string
}

export const INPUT_LIMITS = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 500,
  MAX_WORD_LENGTH: 50,
  ALLOWED_SPECIAL_CHARS: /^[a-zA-Z0-9\s\-_.!?,:;'"()\[\]{}@#$%^&*+=<>/\\|`~]*$/,
  SENTENCE_MIN_WORDS: 2,
  SENTENCE_MAX_WORDS: 100,
} as const

export function validateInput(input: string): ValidationResult {
  if (typeof input !== 'string') {
    return {
      isValid: false,
      error: 'Input must be a string'
    }
  }

  const trimmed = input.trim()

  // Check minimum length
  if (trimmed.length < INPUT_LIMITS.MIN_LENGTH) {
    return {
      isValid: false,
      error: 'Input cannot be empty'
    }
  }

  // Check maximum length
  if (trimmed.length > INPUT_LIMITS.MAX_LENGTH) {
    return {
      isValid: false,
      error: `Input must be less than ${INPUT_LIMITS.MAX_LENGTH} characters`
    }
  }

  // Check for allowed characters
  if (!INPUT_LIMITS.ALLOWED_SPECIAL_CHARS.test(trimmed)) {
    return {
      isValid: false,
      error: 'Input contains invalid characters. Only letters, numbers, and common punctuation are allowed.'
    }
  }

  // Additional validation for very long words
  const words = trimmed.split(/\s+/)
  const hasVeryLongWord = words.some(word => word.length > INPUT_LIMITS.MAX_WORD_LENGTH)
  
  if (hasVeryLongWord) {
    return {
      isValid: false,
      error: `Individual words must be less than ${INPUT_LIMITS.MAX_WORD_LENGTH} characters`
    }
  }

  // Check sentence word count
  if (words.length > INPUT_LIMITS.SENTENCE_MAX_WORDS) {
    return {
      isValid: false,
      error: `Input must contain fewer than ${INPUT_LIMITS.SENTENCE_MAX_WORDS} words`
    }
  }

  return {
    isValid: true,
    sanitized: trimmed
  }
}

export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/[^\w\s\-_.!?,:;'"()\[\]{}@#$%^&*+=<>/\\|`~]/g, '') // Remove disallowed characters
    .substring(0, INPUT_LIMITS.MAX_LENGTH) // Enforce max length
}

export function isSentence(text: string): boolean {
  const trimmed = text.trim()
  
  // Check if it contains spaces, punctuation, or is longer than typical words
  return (
    trimmed.includes(' ') || 
    /[.!?,:;]/.test(trimmed) || 
    trimmed.length > 20 ||
    trimmed.split(' ').length > 1
  )
}

export function validateApiResponse(data: any): ValidationResult {
  if (!data) {
    return {
      isValid: false,
      error: 'No data received from API'
    }
  }

  if (typeof data !== 'object') {
    return {
      isValid: false,
      error: 'Invalid data format received from API'
    }
  }

  if (!data.axes || typeof data.axes !== 'object') {
    return {
      isValid: false,
      error: 'No analysis data received'
    }
  }

  // Validate axes data structure
  const axesEntries = Object.entries(data.axes)
  if (axesEntries.length === 0) {
    return {
      isValid: false,
      error: 'Analysis data is empty'
    }
  }

  // Validate that axes contain numeric values
  const hasInvalidValues = axesEntries.some(([_, value]) => {
    return typeof value !== 'number' || isNaN(value as number)
  })

  if (hasInvalidValues) {
    return {
      isValid: false,
      error: 'Invalid analysis values received'
    }
  }

  return {
    isValid: true
  }
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const requests = new Map<string, number[]>()

  return function isAllowed(identifier: string): boolean {
    const now = Date.now()
    const windowStart = now - windowMs
    
    if (!requests.has(identifier)) {
      requests.set(identifier, [])
    }

    const userRequests = requests.get(identifier)!
    // Remove old requests outside the window
    const recentRequests = userRequests.filter(timestamp => timestamp > windowStart)
    
    if (recentRequests.length >= maxRequests) {
      return false
    }

    // Add current request
    recentRequests.push(now)
    requests.set(identifier, recentRequests)
    
    return true
  }
}

// XSS protection
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

export function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch {
    return false
  }
}