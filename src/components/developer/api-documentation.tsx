'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Code, 
  Copy, 
  Check, 
  Terminal, 
  Globe, 
  Zap,
  Key,
  FileJson,
  Play,
  Book,
  Github,
  Package
} from 'lucide-react'

export function ApiDocumentation() {
  const [copied, setCopied] = useState<string | null>(null)
  const [testResponse, setTestResponse] = useState<any>(null)
  const [apiKey, setApiKey] = useState('demo-key-123')
  const [isLoading, setIsLoading] = useState(false)

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  const runExample = async (example: string) => {
    setIsLoading(true)
    setTestResponse(null)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (example === 'word') {
        setTestResponse({
          text: 'democracy',
          type: 'word',
          embedding: {
            dimensions: {
              'positive_negative': 0.75,
              'active_passive': 0.45,
              'concrete_abstract': -0.30
            },
            neighbors: [
              { term: 'freedom', distance: 0.12 },
              { term: 'republic', distance: 0.18 }
            ]
          }
        })
      } else {
        setTestResponse({
          text: 'This policy will definitely improve everyone\'s lives.',
          type: 'sentence',
          manipulation: {
            score: 68,
            level: 'medium',
            techniques: ['Overgeneralization', 'Absolute Statement']
          }
        })
      }
    } catch (error) {
      setTestResponse({ error: 'Failed to run example' })
    } finally {
      setIsLoading(false)
    }
  }

  const codeExamples = {
    javascript: `// Install: npm install @vibescope/sdk
import { VibeScope } from '@vibescope/sdk';

const client = new VibeScope({
  apiKey: '${apiKey}'
});

// Analyze a word
const wordAnalysis = await client.analyze({
  text: 'democracy',
  type: 'word'
});

// Analyze a sentence
const sentenceAnalysis = await client.analyze({
  text: 'This will change everything forever.',
  type: 'sentence'
});

// Batch analysis
const batch = await client.batch([
  'freedom', 'justice', 'equality'
]);`,

    python: `# Install: pip install vibescope
from vibescope import VibeScope

client = VibeScope(api_key='${apiKey}')

# Analyze a word
word_analysis = client.analyze(
    text='democracy',
    type='word'
)

# Analyze a sentence
sentence_analysis = client.analyze(
    text='This will change everything forever.',
    type='sentence'
)

# Batch analysis
batch = client.batch([
    'freedom', 'justice', 'equality'
])`,

    curl: `# Word analysis
curl -X POST https://vibescope.com/api/public/v1/analyze \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "democracy",
    "type": "word",
    "options": {
      "includeVector": false,
      "maxNeighbors": 10
    }
  }'

# Sentence analysis
curl -X POST https://vibescope.com/api/public/v1/analyze \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "This will change everything.",
    "type": "sentence"
  }'`
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-4 text-gradient">
          Developer API
        </h2>
        <p className="text-lg text-white/70 max-w-2xl mx-auto">
          Integrate VibeScope's powerful text analysis into your applications
        </p>
      </div>

      {/* Quick Start */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-400" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">1. Get your API key</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="glass-card hover:bg-white/10"
                >
                  <Key className="h-4 w-4 mr-2" />
                  Generate Key
                </Button>
              </div>
              <Input
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="input-dark font-mono text-sm"
                readOnly
              />
            </div>

            <div className="glass-card p-4">
              <span className="text-sm font-medium">2. Install SDK</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                <div className="flex items-center justify-between glass-card p-2">
                  <code className="text-xs text-purple-400">npm install @vibescope/sdk</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('npm install @vibescope/sdk', 'npm')}
                  >
                    {copied === 'npm' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between glass-card p-2">
                  <code className="text-xs text-purple-400">pip install vibescope</code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard('pip install vibescope', 'pip')}
                  >
                    {copied === 'pip' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="glass-card p-4">
              <span className="text-sm font-medium">3. Start analyzing</span>
              <p className="text-xs text-white/60 mt-1">
                Use our SDKs or make direct API calls to analyze text
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Endpoints */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-400" />
            API Endpoints
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm text-green-400">POST</span>
                  <span className="font-mono text-sm ml-2">/api/public/v1/analyze</span>
                </div>
                <span className="text-xs text-white/60">Main analysis endpoint</span>
              </div>
              <p className="text-xs text-white/70">
                Analyze single texts for semantic dimensions or manipulation patterns
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm text-green-400">POST</span>
                  <span className="font-mono text-sm ml-2">/api/public/v1/batch</span>
                </div>
                <span className="text-xs text-white/60">Bulk processing</span>
              </div>
              <p className="text-xs text-white/70">
                Analyze up to 100 texts in a single request
              </p>
            </div>

            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-mono text-sm text-green-400">POST</span>
                  <span className="font-mono text-sm ml-2">/api/public/v1/webhooks</span>
                </div>
                <span className="text-xs text-white/60">Async processing</span>
              </div>
              <p className="text-xs text-white/70">
                Configure webhooks for asynchronous analysis results
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Code Examples */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5 text-purple-400" />
            Code Examples
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(codeExamples).map(([lang, code]) => (
              <div key={lang} className="glass-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium capitalize">
                    {lang === 'curl' ? 'cURL' : lang}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(code, lang)}
                    className="glass-card hover:bg-white/10"
                  >
                    {copied === lang ? (
                      <Check className="h-4 w-4 text-green-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto">
                  <code className="language-javascript text-white/80">
                    {code}
                  </code>
                </pre>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Interactive Playground */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-green-400" />
            API Playground
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                onClick={() => runExample('word')}
                disabled={isLoading}
                className="glass-card hover:bg-white/10"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Word Analysis
              </Button>
              <Button
                onClick={() => runExample('sentence')}
                disabled={isLoading}
                className="glass-card hover:bg-white/10"
              >
                <Play className="h-4 w-4 mr-2" />
                Test Sentence Analysis
              </Button>
            </div>

            {isLoading && (
              <div className="glass-card p-4 text-center">
                <div className="loading-spinner mx-auto mb-2" />
                <p className="text-sm text-white/60">Running example...</p>
              </div>
            )}

            {testResponse && (
              <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Response</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(JSON.stringify(testResponse, null, 2), 'response')}
                  >
                    {copied === 'response' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
                <pre className="text-xs overflow-x-auto bg-black/30 p-3 rounded">
                  <code className="text-green-400">
                    {JSON.stringify(testResponse, null, 2)}
                  </code>
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Rate Limits & Pricing */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Rate Limits & Pricing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 text-center">
              <h4 className="font-semibold mb-2">Free Tier</h4>
              <p className="text-2xl font-bold text-purple-400">1,000</p>
              <p className="text-xs text-white/60">requests/month</p>
              <ul className="text-xs text-white/70 mt-4 space-y-1">
                <li>✓ 100 req/min rate limit</li>
                <li>✓ Basic support</li>
                <li>✓ Community access</li>
              </ul>
            </div>

            <div className="glass-card p-4 text-center border-purple-500">
              <h4 className="font-semibold mb-2">Pro</h4>
              <p className="text-2xl font-bold text-purple-400">50,000</p>
              <p className="text-xs text-white/60">requests/month</p>
              <ul className="text-xs text-white/70 mt-4 space-y-1">
                <li>✓ 500 req/min rate limit</li>
                <li>✓ Priority support</li>
                <li>✓ Webhook support</li>
                <li>✓ Custom models</li>
              </ul>
            </div>

            <div className="glass-card p-4 text-center">
              <h4 className="font-semibold mb-2">Enterprise</h4>
              <p className="text-2xl font-bold text-purple-400">Unlimited</p>
              <p className="text-xs text-white/60">custom pricing</p>
              <ul className="text-xs text-white/70 mt-4 space-y-1">
                <li>✓ No rate limits</li>
                <li>✓ Dedicated support</li>
                <li>✓ SLA guarantee</li>
                <li>✓ On-premise option</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle>Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant="ghost"
              className="glass-card hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2"
              onClick={() => window.open('https://docs.vibescope.com', '_blank')}
            >
              <Book className="h-6 w-6 text-blue-400" />
              <span className="text-sm">Documentation</span>
              <span className="text-xs text-white/60">Full API reference</span>
            </Button>

            <Button
              variant="ghost"
              className="glass-card hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2"
              onClick={() => window.open('https://github.com/vibescope', '_blank')}
            >
              <Github className="h-6 w-6 text-purple-400" />
              <span className="text-sm">GitHub</span>
              <span className="text-xs text-white/60">SDKs & examples</span>
            </Button>

            <Button
              variant="ghost"
              className="glass-card hover:bg-white/10 p-4 h-auto flex flex-col items-center gap-2"
              onClick={() => window.open('https://npmjs.com/package/@vibescope/sdk', '_blank')}
            >
              <Package className="h-6 w-6 text-orange-400" />
              <span className="text-sm">NPM Package</span>
              <span className="text-xs text-white/60">JavaScript SDK</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}