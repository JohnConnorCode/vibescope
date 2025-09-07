'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  BarChart3, 
  PieChart, 
  Calendar,
  Hash,
  Eye,
  Brain,
  Shield,
  Sparkles,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RePieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadialBarChart, RadialBar } from 'recharts'

interface InsightsDashboardProps {
  userId?: string
}

interface DashboardStats {
  totalAnalyses: number
  weeklyGrowth: number
  averageScore: number
  topTerms: { term: string; count: number }[]
  sentimentTrend: { date: string; positive: number; negative: number; neutral: number }[]
  manipulationDistribution: { range: string; count: number; color: string }[]
  hourlyActivity: { hour: number; count: number }[]
  categoryBreakdown: { category: string; value: number; color: string }[]
}

export function InsightsDashboard({ userId }: InsightsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'all'>('week')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [userId, timeRange])

  const loadDashboardData = () => {
    setIsLoading(true)
    
    // Load from localStorage and calculate stats
    const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      const history = JSON.parse(saved)
      const now = new Date()
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      
      // Filter by time range
      const filteredHistory = history.filter((item: any) => {
        const itemDate = new Date(item.timestamp)
        if (timeRange === 'week') return itemDate > weekAgo
        if (timeRange === 'month') return itemDate > monthAgo
        return true
      })
      
      // Only show stats if we have meaningful data (at least 5 analyses)
      if (filteredHistory.length < 5) {
        setStats(null)
      } else {
        // Calculate stats
        const stats: DashboardStats = {
          totalAnalyses: filteredHistory.length,
          weeklyGrowth: calculateGrowth(history),
          averageScore: calculateAverageScore(filteredHistory),
          topTerms: calculateTopTerms(filteredHistory),
          sentimentTrend: calculateSentimentTrend(filteredHistory),
          manipulationDistribution: calculateManipulationDistribution(filteredHistory),
          hourlyActivity: calculateHourlyActivity(filteredHistory),
          categoryBreakdown: calculateCategoryBreakdown(filteredHistory)
        }
        
        setStats(stats)
      }
    } else {
      // No data yet - set null to show empty state
      setStats(null)
    }
    
    setTimeout(() => setIsLoading(false), 500)
  }

  const calculateGrowth = (history: any[]) => {
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
    
    const thisWeek = history.filter(item => new Date(item.timestamp) > weekAgo).length
    const lastWeek = history.filter(item => {
      const date = new Date(item.timestamp)
      return date > twoWeeksAgo && date <= weekAgo
    }).length
    
    if (lastWeek === 0) return 100
    return ((thisWeek - lastWeek) / lastWeek) * 100
  }

  const calculateAverageScore = (history: any[]) => {
    const scores = history.filter(item => item.score).map(item => item.score)
    if (scores.length === 0) return 0
    return scores.reduce((a, b) => a + b, 0) / scores.length
  }

  const calculateTopTerms = (history: any[]) => {
    const termCounts: Record<string, number> = {}
    history.forEach(item => {
      if (item.type === 'word') {
        termCounts[item.term] = (termCounts[item.term] || 0) + 1
      }
    })
    
    return Object.entries(termCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([term, count]) => ({ term, count }))
  }

  const calculateSentimentTrend = (history: any[]) => {
    // This would need actual sentiment data
    return []
  }

  const calculateManipulationDistribution = (history: any[]) => {
    const ranges = [
      { min: 0, max: 20, label: '0-20%', color: '#10b981' },
      { min: 21, max: 40, label: '21-40%', color: '#3b82f6' },
      { min: 41, max: 60, label: '41-60%', color: '#f59e0b' },
      { min: 61, max: 80, label: '61-80%', color: '#ef4444' },
      { min: 81, max: 100, label: '81-100%', color: '#dc2626' }
    ]
    
    return ranges.map(range => ({
      range: range.label,
      count: history.filter(item => {
        const score = item.score || 0
        return score >= range.min && score <= range.max
      }).length,
      color: range.color
    }))
  }

  const calculateHourlyActivity = (history: any[]) => {
    const hourCounts = Array(24).fill(0)
    history.forEach(item => {
      const hour = new Date(item.timestamp).getHours()
      hourCounts[hour]++
    })
    
    return hourCounts.map((count, hour) => ({ hour, count }))
  }

  const calculateCategoryBreakdown = (history: any[]) => {
    const words = history.filter(item => item.type === 'word').length
    const sentences = history.filter(item => item.type === 'sentence').length
    
    return [
      { category: 'Words', value: words, color: '#8b5cf6' },
      { category: 'Sentences', value: sentences, color: '#ec4899' }
    ]
  }

  if (isLoading) {
    return (
      <div className="glass-card-elevated p-12 text-center">
        <div className="loading-spinner mx-auto mb-4" />
        <p className="text-white/60">Loading insights...</p>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="glass-card-elevated p-12 text-center">
        <Activity className="h-12 w-12 text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Insights Coming Soon</h3>
        <p className="text-white/60 mb-2">Analyze at least 5 texts to see your insights dashboard</p>
        <p className="text-white/40 text-sm">Your analysis history is stored locally and used to generate personalized insights</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="h-6 w-6 text-purple-400" />
          Insights Dashboard
        </h2>
        
        <div className="flex gap-2">
          {(['week', 'month', 'all'] as const).map(range => (
            <Button
              key={range}
              variant="ghost"
              size="sm"
              onClick={() => setTimeRange(range)}
              className={`glass-card hover:bg-white/10 ${
                timeRange === range ? 'bg-white/10 border-purple-400' : ''
              }`}
            >
              {range === 'week' && 'Last 7 Days'}
              {range === 'month' && 'Last 30 Days'}
              {range === 'all' && 'All Time'}
            </Button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Total Analyses</p>
                <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Weekly Growth</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  {stats.weeklyGrowth > 0 ? (
                    <>
                      <ArrowUp className="h-4 w-4 text-green-400" />
                      <span className="text-green-400">+{stats.weeklyGrowth.toFixed(1)}%</span>
                    </>
                  ) : stats.weeklyGrowth < 0 ? (
                    <>
                      <ArrowDown className="h-4 w-4 text-red-400" />
                      <span className="text-red-400">{stats.weeklyGrowth.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <Minus className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-400">0%</span>
                    </>
                  )}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Avg. Score</p>
                <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
              </div>
              <Brain className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card-elevated">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-white/60">Top Term</p>
                <p className="text-lg font-bold truncate">
                  {stats.topTerms[0]?.term || 'N/A'}
                </p>
              </div>
              <Hash className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sentiment Trend */}
        {stats.sentimentTrend.length > 0 && (
          <Card className="glass-card-elevated">
            <CardHeader>
              <CardTitle>Sentiment Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={stats.sentimentTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(26, 22, 37, 0.95)', 
                      border: '1px solid rgba(255,255,255,0.1)' 
                    }}
                  />
                  <Area type="monotone" dataKey="positive" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="neutral" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Area type="monotone" dataKey="negative" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.6} />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Manipulation Distribution */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Manipulation Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={stats.manipulationDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis dataKey="range" stroke="rgba(255,255,255,0.5)" />
                <YAxis stroke="rgba(255,255,255,0.5)" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(26, 22, 37, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                />
                <Bar dataKey="count">
                  {stats.manipulationDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Terms */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Top Analyzed Terms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topTerms.map((term, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate">{term.term}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 bg-gray-700 rounded-full w-24">
                      <div 
                        className="h-2 bg-gradient-to-r from-purple-500 to-purple-400 rounded-full"
                        style={{ width: `${(term.count / stats.topTerms[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/60 w-8 text-right">{term.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Analysis Types</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <RePieChart>
                <Pie
                  data={stats.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(26, 22, 37, 0.95)', 
                    border: '1px solid rgba(255,255,255,0.1)' 
                  }}
                />
              </RePieChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 mt-4">
              {stats.categoryBreakdown.map((cat, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-xs">{cat.category}: {cat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Hourly Activity */}
        <Card className="glass-card-elevated">
          <CardHeader>
            <CardTitle>Activity Heatmap</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-1">
              {stats.hourlyActivity.slice(0, 12).map((hour, index) => (
                <div
                  key={index}
                  className="h-8 rounded flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: `rgba(139, 92, 246, ${Math.min(hour.count / 20, 1)})`,
                  }}
                  title={`${index}:00 - ${hour.count} analyses`}
                >
                  {index}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-1 mt-1">
              {stats.hourlyActivity.slice(12, 24).map((hour, index) => (
                <div
                  key={index + 12}
                  className="h-8 rounded flex items-center justify-center text-xs"
                  style={{
                    backgroundColor: `rgba(139, 92, 246, ${Math.min(hour.count / 20, 1)})`,
                  }}
                  title={`${index + 12}:00 - ${hour.count} analyses`}
                >
                  {index + 12}
                </div>
              ))}
            </div>
            <p className="text-xs text-white/50 mt-2 text-center">Hours of the day (0-23)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}