'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Save, 
  Folder, 
  Star, 
  Trash2, 
  Search,
  Calendar,
  Tag,
  FileText,
  Download,
  Share2,
  Filter,
  FolderOpen,
  Clock
} from 'lucide-react'

interface SavedAnalysis {
  id: string
  title: string
  text: string
  type: 'word' | 'sentence'
  result: any
  tags: string[]
  notes: string
  createdAt: Date
  isFavorite: boolean
  folder?: string
}

interface SavedAnalysesProps {
  userId?: string
  onLoad: (analysis: SavedAnalysis) => void
}

export function SavedAnalyses({ userId, onLoad }: SavedAnalysesProps) {
  const [analyses, setAnalyses] = useState<SavedAnalysis[]>([])
  const [filteredAnalyses, setFilteredAnalyses] = useState<SavedAnalysis[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'score'>('date')
  const [folders, setFolders] = useState<string[]>(['Work', 'Research', 'Personal'])
  const [allTags, setAllTags] = useState<string[]>([])

  useEffect(() => {
    loadSavedAnalyses()
  }, [userId])

  useEffect(() => {
    filterAnalyses()
  }, [searchQuery, selectedFolder, selectedTags, sortBy, analyses])

  const loadSavedAnalyses = () => {
    const storageKey = userId ? `vibescope_saved_${userId}` : 'vibescope_saved_anon'
    const saved = localStorage.getItem(storageKey)
    
    if (saved) {
      const parsedAnalyses = JSON.parse(saved).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt)
      }))
      setAnalyses(parsedAnalyses)
      
      // Extract all unique tags
      const tags = new Set<string>()
      parsedAnalyses.forEach((analysis: SavedAnalysis) => {
        analysis.tags?.forEach(tag => tags.add(tag))
      })
      setAllTags(Array.from(tags))
    }
  }

  const saveAnalysis = (
    title: string,
    text: string,
    type: 'word' | 'sentence',
    result: any,
    tags: string[] = [],
    notes: string = '',
    folder?: string
  ) => {
    const newAnalysis: SavedAnalysis = {
      id: Date.now().toString(),
      title,
      text,
      type,
      result,
      tags,
      notes,
      createdAt: new Date(),
      isFavorite: false,
      folder
    }

    const updatedAnalyses = [newAnalysis, ...analyses]
    setAnalyses(updatedAnalyses)

    // Save to localStorage
    const storageKey = userId ? `vibescope_saved_${userId}` : 'vibescope_saved_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedAnalyses))
  }

  const filterAnalyses = () => {
    let filtered = [...analyses]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(analysis =>
        analysis.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        analysis.notes?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Folder filter
    if (selectedFolder) {
      filtered = filtered.filter(analysis => analysis.folder === selectedFolder)
    }

    // Tags filter
    if (selectedTags.length > 0) {
      filtered = filtered.filter(analysis =>
        selectedTags.some(tag => analysis.tags?.includes(tag))
      )
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title)
        case 'score':
          const scoreA = a.result?.propaganda?.overallManipulation || 0
          const scoreB = b.result?.propaganda?.overallManipulation || 0
          return scoreB - scoreA
        case 'date':
        default:
          return b.createdAt.getTime() - a.createdAt.getTime()
      }
    })

    setFilteredAnalyses(filtered)
  }

  const toggleFavorite = (id: string) => {
    const updatedAnalyses = analyses.map(analysis =>
      analysis.id === id ? { ...analysis, isFavorite: !analysis.isFavorite } : analysis
    )
    setAnalyses(updatedAnalyses)
    
    const storageKey = userId ? `vibescope_saved_${userId}` : 'vibescope_saved_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedAnalyses))
  }

  const deleteAnalysis = (id: string) => {
    const updatedAnalyses = analyses.filter(analysis => analysis.id !== id)
    setAnalyses(updatedAnalyses)
    
    const storageKey = userId ? `vibescope_saved_${userId}` : 'vibescope_saved_anon'
    localStorage.setItem(storageKey, JSON.stringify(updatedAnalyses))
  }

  const exportAnalyses = () => {
    const dataStr = JSON.stringify(filteredAnalyses, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    
    const exportFileDefaultName = `vibescope-saved-${Date.now()}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="glass-card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Save className="h-5 w-5 text-purple-400" />
              Saved Analyses
              <span className="text-sm text-white/50">({analyses.length})</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportAnalyses}
              className="glass-card hover:bg-white/10"
            >
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-white/40" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search saved analyses..."
                className="input-dark pl-10"
              />
            </div>

            {/* Folder Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFolder(null)}
                className={`glass-card hover:bg-white/10 ${
                  !selectedFolder ? 'bg-white/10 border-purple-400' : ''
                }`}
              >
                <FolderOpen className="h-3 w-3 mr-1" />
                All Folders
              </Button>
              {folders.map(folder => (
                <Button
                  key={folder}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFolder(folder)}
                  className={`glass-card hover:bg-white/10 ${
                    selectedFolder === folder ? 'bg-white/10 border-purple-400' : ''
                  }`}
                >
                  <Folder className="h-3 w-3 mr-1" />
                  {folder}
                </Button>
              ))}
            </div>

            {/* Tag Filter */}
            {allTags.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {allTags.map(tag => (
                  <Button
                    key={tag}
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (selectedTags.includes(tag)) {
                        setSelectedTags(selectedTags.filter(t => t !== tag))
                      } else {
                        setSelectedTags([...selectedTags, tag])
                      }
                    }}
                    className={`glass-card hover:bg-white/10 ${
                      selectedTags.includes(tag) ? 'bg-white/10 border-purple-400' : ''
                    }`}
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Button>
                ))}
              </div>
            )}

            {/* Sort Options */}
            <div className="flex gap-2">
              <span className="text-sm text-white/60 self-center">Sort by:</span>
              {(['date', 'title', 'score'] as const).map(option => (
                <Button
                  key={option}
                  variant="ghost"
                  size="sm"
                  onClick={() => setSortBy(option)}
                  className={`glass-card hover:bg-white/10 ${
                    sortBy === option ? 'bg-white/10 border-purple-400' : ''
                  }`}
                >
                  {option === 'date' && <Calendar className="h-3 w-3 mr-1" />}
                  {option === 'title' && <FileText className="h-3 w-3 mr-1" />}
                  {option === 'score' && <Filter className="h-3 w-3 mr-1" />}
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Analyses Grid */}
      {filteredAnalyses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAnalyses.map(analysis => (
            <Card key={analysis.id} className="glass-card-elevated hover:scale-[1.02] transition-transform">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-sm truncate flex-1">{analysis.title}</h3>
                  <button
                    onClick={() => toggleFavorite(analysis.id)}
                    className="p-1 hover:bg-white/10 rounded transition-colors"
                  >
                    <Star 
                      className={`h-4 w-4 ${
                        analysis.isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-white/40'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-white/60 mb-3 line-clamp-2">
                  {analysis.text}
                </p>

                {analysis.folder && (
                  <div className="flex items-center gap-1 mb-2">
                    <Folder className="h-3 w-3 text-purple-400" />
                    <span className="text-xs text-purple-400">{analysis.folder}</span>
                  </div>
                )}

                {analysis.tags.length > 0 && (
                  <div className="flex gap-1 flex-wrap mb-3">
                    {analysis.tags.map(tag => (
                      <span key={tag} className="chip text-xs px-2 py-0.5">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-white/50 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {analysis.createdAt.toLocaleDateString()}
                  </span>
                  {analysis.result?.propaganda?.overallManipulation && (
                    <span className="text-orange-400 font-semibold">
                      {Math.round(analysis.result.propaganda.overallManipulation)}% manipulation
                    </span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onLoad(analysis)}
                    className="glass-card hover:bg-white/10 flex-1"
                  >
                    Load
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteAnalysis(analysis.id)}
                    className="glass-card hover:bg-white/10 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card-elevated">
          <CardContent className="p-12 text-center">
            <Save className="h-12 w-12 text-purple-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Saved Analyses</h3>
            <p className="text-white/60">
              {searchQuery || selectedFolder || selectedTags.length > 0
                ? 'No analyses match your filters'
                : 'Save your analyses to access them later'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Export the save function for use in other components
export const saveAnalysisToStorage = (
  title: string,
  text: string,
  type: 'word' | 'sentence',
  result: any,
  tags: string[] = [],
  notes: string = '',
  folder?: string,
  userId?: string
) => {
  const storageKey = userId ? `vibescope_saved_${userId}` : 'vibescope_saved_anon'
  const saved = localStorage.getItem(storageKey)
  const analyses = saved ? JSON.parse(saved) : []
  
  const newAnalysis = {
    id: Date.now().toString(),
    title,
    text,
    type,
    result,
    tags,
    notes,
    createdAt: new Date().toISOString(),
    isFavorite: false,
    folder
  }
  
  analyses.unshift(newAnalysis)
  localStorage.setItem(storageKey, JSON.stringify(analyses))
}