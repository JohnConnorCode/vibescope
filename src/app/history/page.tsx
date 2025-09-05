'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth/auth-provider'
import { redirect } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getAnalysisHistory } from '@/lib/supabase/user-data'
import { toggleFavorite, deleteAnalysis } from '@/lib/supabase/save-analysis'
import { 
  Search, Filter, Calendar, Heart, Trash2, 
  ArrowLeft, TrendingUp, Clock, Tag
} from 'lucide-react'

interface AnalysisItem {
  id: number
  type: 'word' | 'sentence'
  input: string
  createdAt: string
  isFavorite: boolean
  axes?: Record<string, number>
  notes?: string
  tags?: string[]
}

export default function HistoryPage() {
  const { user } = useAuth()
  const [analyses, setAnalyses] = useState<AnalysisItem[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<AnalysisItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'word' | 'sentence' | 'favorite'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'alphabetical'>('date')

  useEffect(() => {
    if (!user) {
      redirect('/')
    }
  }, [user])

  useEffect(() => {
    loadHistory()
  }, [user])

  useEffect(() => {
    filterAndSort()
  }, [analyses, searchTerm, filterType, sortBy])

  const loadHistory = async () => {
    if (!user) return

    setLoading(true)
    try {
      const result = await getAnalysisHistory(user.id)
      if (result.data) {
        setAnalyses(result.data.map(item => ({
          id: item.id,
          type: item.type as 'word' | 'sentence',
          input: item.input,
          createdAt: item.created_at,
          isFavorite: item.is_favorite || false,
          axes: item.axes as Record<string, number>,
          notes: item.notes || undefined,
          tags: item.tags || []
        })))
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSort = () => {
    let filtered = [...analyses]

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.input.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply type filter
    if (filterType === 'word') {
      filtered = filtered.filter(item => item.type === 'word')
    } else if (filterType === 'sentence') {
      filtered = filtered.filter(item => item.type === 'sentence')
    } else if (filterType === 'favorite') {
      filtered = filtered.filter(item => item.isFavorite)
    }

    // Apply sorting
    if (sortBy === 'alphabetical') {
      filtered.sort((a, b) => a.input.localeCompare(b.input))
    } else {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    setFilteredAnalyses(filtered)
  }

  const handleToggleFavorite = async (id: number) => {
    const result = await toggleFavorite(id)
    if (result.success) {
      setAnalyses(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
      ))
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this analysis?')) return
    
    const result = await deleteAnalysis(id)
    if (result.success) {
      setAnalyses(prev => prev.filter(item => item.id !== id))
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(to bottom right, #4c1d95, #581c87, #312e81)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => window.location.href = '/dashboard'}
              variant="ghost"
              size="sm"
              style={{ color: 'rgba(255, 255, 255, 0.7)' }}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold" style={{ color: 'white' }}>
              Analysis History
            </h1>
          </div>
        </div>

        {/* Filters and Search */}
        <Card style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }} className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4" 
                  style={{ color: 'rgba(255, 255, 255, 0.5)' }} />
                <Input
                  placeholder="Search analyses, notes, or tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white'
                  }}
                />
              </div>

              {/* Type Filter */}
              <div className="flex gap-2">
                {(['all', 'word', 'sentence', 'favorite'] as const).map(type => (
                  <Button
                    key={type}
                    variant={filterType === type ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilterType(type)}
                    style={{
                      backgroundColor: filterType === type 
                        ? 'rgba(139, 92, 246, 0.3)' 
                        : 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                      color: 'white'
                    }}
                  >
                    {type === 'favorite' ? <Heart className="h-4 w-4 mr-1" /> : null}
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Button>
                ))}
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'date' | 'alphabetical')}
                className="px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                <option value="date">Latest First</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Total
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {analyses.length}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6" style={{ color: '#67e8f9' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Words
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {analyses.filter(a => a.type === 'word').length}
                  </p>
                </div>
                <Tag className="h-6 w-6" style={{ color: '#c4b5fd' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Sentences
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {analyses.filter(a => a.type === 'sentence').length}
                  </p>
                </div>
                <MessageSquare className="h-6 w-6" style={{ color: '#f9a8d4' }} />
              </div>
            </CardContent>
          </Card>

          <Card style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                    Favorites
                  </p>
                  <p className="text-xl font-bold" style={{ color: 'white' }}>
                    {analyses.filter(a => a.isFavorite).length}
                  </p>
                </div>
                <Heart className="h-6 w-6" style={{ color: '#ef4444' }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Results */}
        <Card style={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <CardHeader>
            <CardTitle style={{ color: 'white' }}>
              {filteredAnalyses.length} Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>Loading your history...</p>
              </div>
            ) : filteredAnalyses.length > 0 ? (
              <div className="space-y-3">
                {filteredAnalyses.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="p-4 rounded-lg transition-all hover:bg-white/5"
                    style={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg" style={{ color: 'white' }}>
                            {analysis.input}
                          </span>
                          <span 
                            className="px-2 py-0.5 rounded-full text-xs"
                            style={{
                              backgroundColor: analysis.type === 'word' 
                                ? 'rgba(103, 232, 249, 0.2)' 
                                : 'rgba(249, 168, 212, 0.2)',
                              color: analysis.type === 'word' ? '#67e8f9' : '#f9a8d4'
                            }}
                          >
                            {analysis.type}
                          </span>
                        </div>
                        
                        {analysis.notes && (
                          <p className="text-sm mb-2" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                            {analysis.notes}
                          </p>
                        )}
                        
                        {analysis.tags && analysis.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {analysis.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  backgroundColor: 'rgba(139, 92, 246, 0.2)',
                                  color: '#c4b5fd'
                                }}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                          <Clock className="h-3 w-3" />
                          <span>{new Date(analysis.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          onClick={() => handleToggleFavorite(analysis.id)}
                          variant="ghost"
                          size="sm"
                          style={{ color: analysis.isFavorite ? '#ef4444' : 'rgba(255, 255, 255, 0.5)' }}
                        >
                          <Heart className={`h-4 w-4 ${analysis.isFavorite ? 'fill-current' : ''}`} />
                        </Button>
                        
                        <Button
                          onClick={() => window.location.href = `/?q=${encodeURIComponent(analysis.input)}`}
                          variant="ghost"
                          size="sm"
                          style={{ color: 'rgba(255, 255, 255, 0.7)' }}
                        >
                          View
                        </Button>
                        
                        <Button
                          onClick={() => handleDelete(analysis.id)}
                          variant="ghost"
                          size="sm"
                          style={{ color: 'rgba(255, 68, 68, 0.7)' }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p style={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                  {searchTerm || filterType !== 'all' 
                    ? 'No analyses match your filters' 
                    : 'No analyses yet. Start exploring!'}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { MessageSquare } from 'lucide-react'