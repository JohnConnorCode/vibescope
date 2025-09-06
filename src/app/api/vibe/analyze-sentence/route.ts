// src/app/api/vibe/analyze-sentence/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, rateLimits } from '@/lib/rate-limit'

// Propaganda detection patterns and techniques
const PROPAGANDA_PATTERNS = {
  superlatives: {
    pattern: /\b(best|worst|greatest|most|least|ultimate|perfect|never|always|completely|totally|absolutely|only|all|every|everyone|nobody|nothing)\b/gi,
    weight: 0.3,
    description: "Uses absolute terms to oversimplify complex issues"
  },
  fearTactics: {
    pattern: /\b(dangerous|threat|crisis|disaster|catastrophe|destroy|ruin|collapse|fail|lose|attack|enemy|war|death|kill)\b/gi,
    weight: 0.4,
    description: "Uses fear-inducing language to motivate action"
  },
  usThem: {
    pattern: /\b(they|them|those people|the other side|enemies|us vs|we vs|with us or against|real americans|true believers)\b/gi,
    weight: 0.5,
    description: "Creates artificial divisions between groups"
  },
  authority: {
    pattern: /\b(experts say|studies show|research proves|scientists agree|doctors recommend|official|authoritative|proven fact)\b/gi,
    weight: 0.3,
    description: "Makes vague appeals to unnamed authorities"
  },
  bandwagon: {
    pattern: /\b(everyone knows|most people|popular|trending|join|be part of|don't be left out|majority)\b/gi,
    weight: 0.3,
    description: "Appeals to popularity rather than logic"
  },
  loaded: {
    pattern: /\b(elite|establishment|mainstream|radical|extremist|liberal|conservative|woke|cancel|freedom|patriot|real|true)\b/gi,
    weight: 0.2,
    description: "Uses emotionally charged terms to bias perception"
  },
  gaslighting: {
    pattern: /\b(you're overreacting|that didn't happen|you're imagining|you're confused|trust me|believe me|obvious|clearly)\b/gi,
    weight: 0.4,
    description: "Attempts to make readers question their own judgment"
  },
  falseDichotomy: {
    pattern: /\b(either.*or|only two|simple choice|with us or against|black and white|no middle ground)\b/gi,
    weight: 0.4,
    description: "Presents complex issues as having only two options"
  },
  ambiguity: {
    pattern: /\b(some say|might|could|possibly|potentially|allegedly|supposedly|reportedly|sources suggest)\b/gi,
    weight: 0.2,
    description: "Uses vague language to avoid accountability"
  }
}

function detectPropagandaTechniques(text: string) {
  const results = {
    overallManipulation: 0,
    emotionalManipulation: 0,
    strategicAmbiguity: 0,
    loadedLanguage: 0,
    fearTactics: 0,
    appealToAuthority: 0,
    bandwagon: 0,
    falseDichotomy: 0,
    gaslighting: 0,
    techniques: [] as string[],
    explanations: [] as string[]
  }

  let totalScore = 0
  let matchCount = 0

  // Check each propaganda pattern
  Object.entries(PROPAGANDA_PATTERNS).forEach(([key, pattern]) => {
    const matches = text.match(pattern.pattern)
    if (matches) {
      const matchScore = Math.min(matches.length * pattern.weight * 20, 100)
      totalScore += matchScore
      matchCount++

      results.techniques.push(key)
      results.explanations.push(`${pattern.description}: "${matches[0]}"`)

      // Map to specific categories
      switch (key) {
        case 'fearTactics':
          results.fearTactics = Math.min(results.fearTactics + matchScore, 100)
          results.emotionalManipulation = Math.min(results.emotionalManipulation + matchScore * 0.8, 100)
          break
        case 'authority':
          results.appealToAuthority = Math.min(results.appealToAuthority + matchScore, 100)
          break
        case 'bandwagon':
          results.bandwagon = Math.min(results.bandwagon + matchScore, 100)
          break
        case 'falseDichotomy':
          results.falseDichotomy = Math.min(results.falseDichotomy + matchScore, 100)
          break
        case 'gaslighting':
          results.gaslighting = Math.min(results.gaslighting + matchScore, 100)
          results.emotionalManipulation = Math.min(results.emotionalManipulation + matchScore * 0.6, 100)
          break
        case 'loaded':
          results.loadedLanguage = Math.min(results.loadedLanguage + matchScore, 100)
          break
        case 'ambiguity':
          results.strategicAmbiguity = Math.min(results.strategicAmbiguity + matchScore, 100)
          break
        case 'superlatives':
        case 'usThem':
          results.emotionalManipulation = Math.min(results.emotionalManipulation + matchScore * 0.5, 100)
          break
      }
    }
  })

  // Calculate overall manipulation score
  results.overallManipulation = Math.min(totalScore / Math.max(matchCount, 1), 100)

  // Boost emotional manipulation if multiple emotional techniques detected
  const emotionalTechniques = ['fearTactics', 'usThem', 'superlatives', 'gaslighting']
  const emotionalCount = emotionalTechniques.filter(tech => results.techniques.includes(tech)).length
  if (emotionalCount > 1) {
    results.emotionalManipulation = Math.min(results.emotionalManipulation * 1.2, 100)
  }

  return results
}

// Mock sentence analysis data
function getMockSentenceData(text: string) {
  const propaganda = detectPropagandaTechniques(text)
  
  // Generate semantic axes based on detected propaganda patterns
  const hash = Array.from(text).reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const random = (seed: number) => Math.abs(Math.sin(seed)) * 2 - 1
  
  // Adjust axes based on propaganda content
  const manipulationBias = propaganda.overallManipulation / 100
  
  return {
    term: text,
    type: 'sentence' as const,
    axes: {
      masculine_feminine: random(hash * 1) * (1 - manipulationBias * 0.3),
      concrete_abstract: -0.2 - (manipulationBias * 0.4), // Propaganda tends to be more abstract
      active_passive: 0.3 + (manipulationBias * 0.4), // Propaganda tends to be more active
      positive_negative: 0.1 - (manipulationBias * 0.6), // Propaganda often has negative undertones
      serious_playful: 0.4 + (manipulationBias * 0.3), // Propaganda tends to be serious
      complex_simple: -0.1 - (manipulationBias * 0.2), // Propaganda often oversimplifies
      intense_mild: 0.2 + (manipulationBias * 0.5), // Propaganda tends to be intense
      natural_artificial: -0.3 - (manipulationBias * 0.4), // Propaganda is artificial
      private_public: 0.5 + (manipulationBias * 0.2), // Propaganda is public-facing
      high_status_low_status: random(hash * 10) * (1 - manipulationBias * 0.2),
      ordered_chaotic: random(hash * 11) * (1 - manipulationBias * 0.3),
      future_past: random(hash * 12) * (1 - manipulationBias * 0.1)
    },
    propaganda,
    neighbors: []
  }
}

export async function GET(req: NextRequest) {
  return withRateLimit(req, async () => {
    try {
      const text = (req.nextUrl.searchParams.get('text') || '').trim()
      if (!text) {
        return NextResponse.json(
          { error: 'Missing required parameter: text' }, 
          { 
            status: 400,
            headers: {
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
              'X-XSS-Protection': '1; mode=block'
            }
          }
        )
      }

      // For now, always return mock data for sentence analysis
      // This can be enhanced with actual AI analysis later
      return NextResponse.json(
        getMockSentenceData(text),
        {
          headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block'
          }
        }
      )
      
    } catch (error) {
      console.error('Error analyzing sentence:', error)
      
      let errorMessage = 'Failed to analyze sentence'
      if (error instanceof Error) {
        errorMessage = `Sentence analysis failed: ${error.message}`
      }
      
      return NextResponse.json(
        { 
          error: errorMessage,
          details: process.env.NODE_ENV === 'development' ? error : undefined 
        },
        { status: 500 }
      )
    }
  }, rateLimits.analyze)
}