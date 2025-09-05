import { NextRequest, NextResponse } from 'next/server'
import { getEmbedding } from '@/lib/embeddings'
import { analyzeSentiment } from '@/lib/sentiment'
import { detectPropaganda } from '@/lib/propaganda'

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(apiKey: string): boolean {
  const now = Date.now()
  const limit = rateLimitMap.get(apiKey)
  
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(apiKey, {
      count: 1,
      resetTime: now + 60000 // 1 minute window
    })
    return true
  }
  
  if (limit.count >= 100) { // 100 requests per minute
    return false
  }
  
  limit.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Check API key
    const apiKey = request.headers.get('x-api-key')
    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key required. Get your key at vibescope.com/developers' },
        { status: 401 }
      )
    }
    
    // Rate limiting
    if (!checkRateLimit(apiKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Max 100 requests per minute.' },
        { status: 429 }
      )
    }
    
    // Parse request body
    const body = await request.json()
    const { text, type = 'auto', options = {} } = body
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Invalid request. Text field is required.' },
        { status: 400 }
      )
    }
    
    if (text.length > 5000) {
      return NextResponse.json(
        { error: 'Text too long. Maximum 5000 characters.' },
        { status: 400 }
      )
    }
    
    // Determine analysis type
    const isSentence = type === 'sentence' || (type === 'auto' && text.split(' ').length > 3)
    
    let result: any = {
      text,
      type: isSentence ? 'sentence' : 'word',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
    
    if (isSentence) {
      // Sentence analysis
      const sentiment = await analyzeSentiment(text)
      const propaganda = await detectPropaganda(text)
      
      result = {
        ...result,
        sentiment,
        propaganda,
        manipulation: {
          score: propaganda.overallManipulation,
          level: propaganda.overallManipulation > 70 ? 'high' :
                 propaganda.overallManipulation > 40 ? 'medium' : 'low',
          techniques: propaganda.techniques
        }
      }
    } else {
      // Word analysis
      const embedding = await getEmbedding(text)
      
      if (embedding.error) {
        throw new Error(embedding.error)
      }
      
      result = {
        ...result,
        embedding: {
          dimensions: embedding.axes,
          vector: options.includeVector ? embedding.vector : undefined,
          neighbors: embedding.neighbors?.slice(0, options.maxNeighbors || 10)
        }
      }
    }
    
    // Add metadata based on options
    if (options.includeMetadata) {
      result.metadata = {
        language: 'en',
        processingTime: Date.now() - new Date(result.timestamp).getTime(),
        model: isSentence ? 'propaganda-bert-v2' : 'word2vec-google-news'
      }
    }
    
    return NextResponse.json(result, {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': String(100 - (rateLimitMap.get(apiKey)?.count || 0)),
        'X-RateLimit-Reset': new Date(rateLimitMap.get(apiKey)?.resetTime || 0).toISOString()
      }
    })
    
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    name: 'VibeScope Public API',
    version: '1.0.0',
    endpoints: {
      analyze: {
        method: 'POST',
        path: '/api/public/v1/analyze',
        description: 'Analyze text for semantic dimensions or manipulation patterns',
        authentication: 'API key required in x-api-key header',
        rateLimit: '100 requests per minute',
        body: {
          text: 'string (required) - Text to analyze',
          type: 'string (optional) - "word", "sentence", or "auto" (default: "auto")',
          options: {
            includeVector: 'boolean - Include raw embedding vector',
            maxNeighbors: 'number - Maximum similar terms to return (default: 10)',
            includeMetadata: 'boolean - Include processing metadata'
          }
        },
        response: {
          word: {
            text: 'string',
            type: 'word',
            embedding: {
              dimensions: 'object - Semantic dimensions',
              vector: 'array - Raw embedding (if requested)',
              neighbors: 'array - Similar terms'
            }
          },
          sentence: {
            text: 'string',
            type: 'sentence',
            sentiment: 'object - Sentiment analysis',
            propaganda: 'object - Propaganda detection',
            manipulation: {
              score: 'number - 0-100',
              level: 'string - low/medium/high',
              techniques: 'array - Detected techniques'
            }
          }
        }
      },
      batch: {
        method: 'POST',
        path: '/api/public/v1/batch',
        description: 'Analyze multiple texts in a single request',
        limit: 'Maximum 100 texts per request'
      },
      webhooks: {
        method: 'POST',
        path: '/api/public/v1/webhooks',
        description: 'Configure webhooks for async processing'
      }
    },
    authentication: {
      type: 'API Key',
      header: 'x-api-key',
      getKey: 'https://vibescope.com/developers'
    },
    limits: {
      requestSize: '1MB',
      textLength: 5000,
      rateLimit: '100 req/min',
      batchSize: 100
    },
    sdks: {
      javascript: 'npm install @vibescope/sdk',
      python: 'pip install vibescope',
      documentation: 'https://docs.vibescope.com'
    }
  })
}