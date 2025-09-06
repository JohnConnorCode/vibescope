import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Brain, ArrowRight, ExternalLink, Home } from 'lucide-react'

async function getShareData(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/share?id=${id}`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      return null
    }
    
    return await res.json()
  } catch (error) {
    console.error('Error fetching share:', error)
    return null
  }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const shareData = await getShareData(id)
  
  if (!shareData) {
    return {
      title: 'Share Not Found - VibeScope',
    }
  }
  
  const manipulationScore = shareData.data?.propaganda?.overallManipulation
  const description = shareData.type === 'sentence' && manipulationScore
    ? `Analysis reveals ${Math.round(manipulationScore)}% manipulation in: "${shareData.term.slice(0, 100)}..."`
    : `Semantic analysis of "${shareData.term}"`
  
  return {
    title: `VibeScope Analysis: ${shareData.term.slice(0, 50)}`,
    description,
    openGraph: {
      title: `VibeScope Analysis`,
      description,
      type: 'article',
      images: [{
        url: `/api/og?text=${encodeURIComponent(shareData.term)}&score=${manipulationScore || 0}`,
        width: 1200,
        height: 630,
      }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `VibeScope Analysis`,
      description,
      images: [`/api/og?text=${encodeURIComponent(shareData.term)}&score=${manipulationScore || 0}`],
    },
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const shareData = await getShareData(id)
  
  if (!shareData) {
    notFound()
  }
  
  const { term, type, data, views } = shareData
  const isManipulationAnalysis = type === 'sentence' && data?.propaganda
  const manipulationScore = data?.propaganda?.overallManipulation
  
  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse-glow" />
      </div>
      
      <div className="container mx-auto px-4 py-8 max-w-4xl relative z-10">
        {/* Header */}
        <div className="mb-8 text-center">
          <Link href="/">
            <h1 className="text-4xl font-bold mb-4 inline-block">
              <span className="text-gradient neon-text">VibeScope</span>
            </h1>
          </Link>
          <p className="text-lg text-white/60">Shared Analysis Result</p>
        </div>
        
        {/* Main Content */}
        <Card className="glass-card-elevated mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isManipulationAnalysis ? (
                  <Shield className="h-6 w-6 text-orange-400" />
                ) : (
                  <Brain className="h-6 w-6 text-purple-400" />
                )}
                <span>Analysis Result</span>
              </div>
              <span className="text-sm text-white/50">{views} views</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Analyzed Text */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-white/60 mb-2">Analyzed Text:</h3>
              <div className="p-4 glass-card">
                <p className="text-lg font-medium italic">"{term}"</p>
              </div>
            </div>
            
            {/* Results */}
            {isManipulationAnalysis ? (
              <div className="space-y-6">
                {/* Manipulation Score */}
                <div className="text-center p-6 glass-card">
                  <div className={`text-5xl font-bold mb-2 ${
                    manipulationScore > 70 ? 'text-red-400' :
                    manipulationScore > 40 ? 'text-orange-400' : 'text-green-400'
                  }`}>
                    {Math.round(manipulationScore)}%
                  </div>
                  <div className="text-lg font-semibold">Manipulation Score</div>
                  <div className="text-sm text-white/60 mt-2">
                    {manipulationScore > 70 ? 'High manipulation detected' :
                     manipulationScore > 40 ? 'Moderate manipulation present' :
                     'Low manipulation levels'}
                  </div>
                </div>
                
                {/* Techniques */}
                {data.propaganda?.techniques?.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-3">Detected Techniques:</h3>
                    <div className="space-y-2">
                      {data.propaganda.techniques.map((technique: string, index: number) => (
                        <div key={index} className="p-3 glass-card">
                          <h4 className="text-orange-400 font-medium">
                            {technique.replace(/([A-Z])/g, ' $1').trim()}
                          </h4>
                          {data.propaganda.explanations?.[index] && (
                            <p className="text-sm text-white/70 mt-1">
                              {data.propaganda.explanations[index]}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {/* Semantic Dimensions */}
                <div>
                  <h3 className="font-semibold mb-3">Semantic Dimensions:</h3>
                  <div className="space-y-3">
                    {data.axes && Object.entries(data.axes).map(([axis, value]) => {
                      const percentage = Math.round((value as number) * 100)
                      const absPercentage = Math.abs(percentage)
                      return (
                        <div key={axis}>
                          <div className="flex justify-between text-sm mb-1">
                            <span>{axis.replace(/_/g, ' ')}</span>
                            <span className="font-bold text-purple-400">
                              {percentage > 0 ? '+' : ''}{percentage}%
                            </span>
                          </div>
                          <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-600 to-purple-400 transition-all"
                              style={{ 
                                width: `${absPercentage}%`,
                                marginLeft: percentage < 0 ? `${50 - absPercentage/2}%` : '50%'
                              }}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* Actions */}
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href={`/?q=${encodeURIComponent(term)}&type=${type}`} className="flex-1">
                <Button className="btn-primary w-full">
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Analyze Your Own Text
                </Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="glass-card hover:bg-white/10 w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Try VibeScope
                </Button>
              </Link>
            </div>
            
            {/* Footer */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-sm text-white/50">
                VibeScope uses AI to analyze language patterns and detect manipulation techniques.
              </p>
              <p className="text-xs text-white/40 mt-2">
                This analysis was shared {new Date(shareData.createdAt).toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}