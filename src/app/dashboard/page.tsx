'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/auth-provider'
import { getRecentAnalyses, getUserStatistics } from '@/lib/supabase/save-analysis'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, TrendingUp, Brain, Shield, Clock, Calendar,
  ChevronRight, Sparkles, Target, Award
} from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<any>(null)
  const [recentAnalyses, setRecentAnalyses] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
      return
    }

    if (user) {
      loadDashboardData()
    }
  }, [user, authLoading, router])

  const loadDashboardData = async () => {
    const [statsResult, analysesResult] = await Promise.all([
      getUserStatistics(),
      getRecentAnalyses(5)
    ])

    setStats(statsResult.data)
    setRecentAnalyses(analysesResult.data || [])
    setLoading(false)
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, #4c1d95, #581c87, #312e81)' }}>
        <div className="text-white">Loading dashboard...</div>
      </div>
    )
  }

  const statCards = [
    { 
      icon: Brain, 
      label: 'Words Analyzed', 
      value: stats?.words_analyzed || 0,
      color: '#67e8f9'
    },
    { 
      icon: Shield, 
      label: 'Sentences Analyzed', 
      value: stats?.sentences_analyzed || 0,
      color: '#c4b5fd'
    },
    { 
      icon: Target, 
      label: 'Manipulations Detected', 
      value: stats?.manipulation_detected || 0,
      color: '#f9a8d4'
    },
    { 
      icon: Award, 
      label: 'Day Streak', 
      value: stats?.streak_days || 0,
      color: '#10b981'
    },
  ]

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #4c1d95, #581c87, #312e81)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'white' }}>
            Welcome back, {user?.email?.split('@')[0]}! 👋
          </h1>
          <p style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Track your semantic analysis journey and discover insights
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, index) => (
            <Card 
              key={index}
              className="border-0"
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div 
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${stat.color}20` }}
                  >
                    <stat.icon className="h-6 w-6" style={{ color: stat.color }} />
                  </div>
                  <TrendingUp className="h-4 w-4" style={{ color: '#10b981' }} />
                </div>
                <div className="text-2xl font-bold" style={{ color: 'white' }}>
                  {stat.value.toLocaleString()}
                </div>
                <div className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Analyses */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold" style={{ color: 'white' }}>
                Recent Analyses
              </h2>
              <Link href="/history">
                <Button variant="ghost" size="sm" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
            
            <div className="space-y-3">
              {recentAnalyses.length > 0 ? (
                recentAnalyses.map((analysis) => (
                  <Card 
                    key={analysis.id}
                    className="cursor-pointer hover:scale-[1.02] transition-transform"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                    onClick={() => {
                      // Navigate to the analysis or re-run it
                      router.push(`/?q=${encodeURIComponent(analysis.input_text)}`)
                    }}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {analysis.analysis_type === 'word' ? (
                              <Brain className="h-4 w-4" style={{ color: '#67e8f9' }} />
                            ) : (
                              <Shield className="h-4 w-4" style={{ color: '#f9a8d4' }} />
                            )}
                            <span className="text-sm font-medium" style={{ color: 'white' }}>
                              {analysis.input_text}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                            <span>{analysis.analysis_type}</span>
                            <span>{new Date(analysis.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {analysis.is_favorite && (
                          <Sparkles className="h-4 w-4" style={{ color: '#fbbf24' }} />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div 
                  className="text-center py-8 rounded-lg"
                  style={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)'
                  }}
                >
                  <Brain className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(255, 255, 255, 0.3)' }} />
                  <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    No analyses yet
                  </p>
                  <Link href="/">
                    <Button 
                      className="mt-4"
                      style={{ 
                        background: 'linear-gradient(to right, #8b5cf6, #9333ea)',
                        color: 'white'
                      }}
                    >
                      Start Analyzing
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Insights Panel */}
          <div>
            <h2 className="text-xl font-semibold mb-4" style={{ color: 'white' }}>
              Your Insights
            </h2>
            
            <Card 
              style={{ 
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}
            >
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(103, 232, 249, 0.2)' }}
                    >
                      <BarChart3 className="h-5 w-5" style={{ color: '#67e8f9' }} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'white' }}>
                        Analysis Patterns
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        You tend to analyze more positive words than negative ones. 
                        Your most explored dimension is "concrete-abstract".
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(249, 168, 212, 0.2)' }}
                    >
                      <Shield className="h-5 w-5" style={{ color: '#f9a8d4' }} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'white' }}>
                        Manipulation Detection
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        You've identified emotional manipulation in 65% of analyzed sentences. 
                        Most common: loaded language and false dichotomy.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: 'rgba(16, 185, 129, 0.2)' }}
                    >
                      <Award className="h-5 w-5" style={{ color: '#10b981' }} />
                    </div>
                    <div>
                      <h3 className="font-medium mb-1" style={{ color: 'white' }}>
                        Achievement Unlocked!
                      </h3>
                      <p className="text-sm" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                        "Word Explorer" - You've analyzed over 50 unique words! 
                        Keep going to unlock more achievements.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4" style={{ color: 'white' }}>
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/">
              <Button 
                className="w-full h-auto py-4"
                variant="outline"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <Brain className="h-5 w-5 mr-2" />
                Analyze New Word
              </Button>
            </Link>
            <Link href="/compare">
              <Button 
                className="w-full h-auto py-4"
                variant="outline"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <Target className="h-5 w-5 mr-2" />
                Compare Words
              </Button>
            </Link>
            <Link href="/favorites">
              <Button 
                className="w-full h-auto py-4"
                variant="outline"
                style={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <Sparkles className="h-5 w-5 mr-2" />
                View Favorites
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}