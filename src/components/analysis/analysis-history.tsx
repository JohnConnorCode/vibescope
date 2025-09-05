'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { History, Search, Clock, TrendingUp, Shield, Star, Trash2, Filter } from 'lucide-react'

interface HistoryItem {
  id: string
  term: string
  type: 'word' | 'sentence'
  timestamp: Date
  score?: number
  isFavorite: boolean
}

interface AnalysisHistoryProps {
  onSelectItem: (term: string) => void
  userId?: string
}

export function AnalysisHistory({ onSelectItem, userId }: AnalysisHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [filteredHistory, setFilteredHistory] = useState<HistoryItem[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'word' | 'sentence' | 'favorite'>('all')
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    loadHistory()
  }, [userId])

  useEffect(() => {
    filterHistory()
  }, [searchQuery, filterType, history])

  const loadHistory = () => {
    // Load from localStorage for now
    const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      const items = JSON.parse(saved)
      setHistory(items.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })))
    }
  }

  const filterHistory = () => {
    let filtered = [...history]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.term.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply type filter
    switch (filterType) {
      case 'word':
        filtered = filtered.filter(item => item.type === 'word')
        break
      case 'sentence':
        filtered = filtered.filter(item => item.type === 'sentence')
        break
      case 'favorite':
        filtered = filtered.filter(item => item.isFavorite)
        break
    }

    // Sort by timestamp (most recent first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    setFilteredHistory(filtered)
  }

  const addToHistory = (term: string, type: 'word' | 'sentence', score?: number) => {
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      term,
      type,
      timestamp: new Date(),
      score,
      isFavorite: false
    }

    const updatedHistory = [newItem, ...history.filter(h => h.term !== term)].slice(0, 100)
    setHistory(updatedHistory)

    // Save to localStorage
    const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }

  const toggleFavorite = (id: string) => {
    const updatedHistory = history.map(item =>
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    )
    setHistory(updatedHistory)

    // Save to localStorage
    const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }

  const deleteItem = (id: string) => {
    const updatedHistory = history.filter(item => item.id !== id)
    setHistory(updatedHistory)

    // Save to localStorage
    const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }

  const clearHistory = () => {
    if (confirm('Are you sure you want to clear all history?')) {
      setHistory([])
      const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
      localStorage.removeItem(storageKey)
    }
  }

  const formatTime = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
    return date.toLocaleDateString()
  }

  const displayedItems = isExpanded ? filteredHistory : filteredHistory.slice(0, 5)

  if (history.length === 0) {
    return null
  }

  return (
    <div className="glass-card-elevated p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Recent Analyses</h3>
          <span className="text-sm text-white/50">({history.length})</span>
        </div>
        {history.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearHistory}
            className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="space-y-3 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="input-dark pl-10 h-10"
          />
        </div>

        <div className="flex gap-2">
          {(['all', 'word', 'sentence', 'favorite'] as const).map(type => (
            <Button
              key={type}
              variant="ghost"
              size="sm"
              onClick={() => setFilterType(type)}
              className={`glass-card hover:bg-white/10 ${
                filterType === type ? 'bg-white/10 border-purple-400' : ''
              }`}
            >
              {type === 'all' && <Filter className="h-3 w-3 mr-1" />}
              {type === 'word' && <TrendingUp className="h-3 w-3 mr-1" />}
              {type === 'sentence' && <Shield className="h-3 w-3 mr-1" />}
              {type === 'favorite' && <Star className="h-3 w-3 mr-1" />}
              <span className="capitalize">{type === 'favorite' ? 'Favorites' : type}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* History Items */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {displayedItems.map(item => (
          <div
            key={item.id}
            className="glass-card p-3 hover:bg-white/5 transition-all group"
          >
            <div className="flex items-start justify-between">
              <button
                onClick={() => onSelectItem(item.term)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  {item.type === 'word' ? (
                    <TrendingUp className="h-4 w-4 text-blue-400 shrink-0" />
                  ) : (
                    <Shield className="h-4 w-4 text-orange-400 shrink-0" />
                  )}
                  <span className="font-medium text-sm truncate">
                    {item.type === 'sentence' 
                      ? `"${item.term.substring(0, 50)}${item.term.length > 50 ? '...' : ''}"`
                      : item.term}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1">
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatTime(item.timestamp)}
                  </span>
                  {item.score !== undefined && (
                    <span className="text-xs text-purple-400">
                      Score: {item.score}
                    </span>
                  )}
                </div>
              </button>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => toggleFavorite(item.id)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <Star 
                    className={`h-4 w-4 ${item.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'}`}
                  />
                </button>
                <button
                  onClick={() => deleteItem(item.id)}
                  className="p-1.5 hover:bg-white/10 rounded transition-colors"
                >
                  <Trash2 className="h-4 w-4 text-white/40 hover:text-red-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Show More/Less */}
      {filteredHistory.length > 5 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-3 glass-card hover:bg-white/10"
        >
          {isExpanded ? 'Show Less' : `Show ${filteredHistory.length - 5} More`}
        </Button>
      )}

      {filteredHistory.length === 0 && searchQuery && (
        <div className="text-center py-8 text-white/50">
          <p className="text-sm">No results found for "{searchQuery}"</p>
        </div>
      )}
    </div>
  )
}

// Export the addToHistory function for use in other components
export const addToAnalysisHistory = (
  term: string, 
  type: 'word' | 'sentence', 
  score?: number,
  userId?: string
) => {
  const storageKey = userId ? `vibescope_history_${userId}` : 'vibescope_history_anon'
  const saved = localStorage.getItem(storageKey)
  const history = saved ? JSON.parse(saved) : []
  
  const newItem = {
    id: Date.now().toString(),
    term,
    type,
    timestamp: new Date().toISOString(),
    score,
    isFavorite: false
  }

  const updatedHistory = [newItem, ...history.filter((h: any) => h.term !== term)].slice(0, 100)
  localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
}