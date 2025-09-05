'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Upload, Download, Play, Pause, CheckCircle, AlertCircle, Loader2, BarChart, TrendingUp, FileSpreadsheet } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface BatchAnalysisProps {
  onAnalyze: (term: string) => Promise<any>
}

interface BatchItem {
  id: string
  text: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  result?: any
  error?: string
}

interface BatchReport {
  totalItems: number
  completed: number
  failed: number
  avgManipulationScore?: number
  topPatterns: string[]
  insights: string[]
}

export function BatchAnalysis({ onAnalyze }: BatchAnalysisProps) {
  const [items, setItems] = useState<BatchItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [progress, setProgress] = useState(0)
  const [report, setReport] = useState<BatchReport | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      const lines = content.split('\n').filter(line => line.trim())
      
      const newItems: BatchItem[] = lines.map((text, index) => ({
        id: `batch-${Date.now()}-${index}`,
        text: text.trim(),
        status: 'pending'
      }))
      
      setItems(newItems)
      setReport(null)
    }
    
    reader.readAsText(file)
  }

  const handleTextAreaInput = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim())
    const newItems: BatchItem[] = lines.map((text, index) => ({
      id: `batch-${Date.now()}-${index}`,
      text: text.trim(),
      status: 'pending'
    }))
    
    setItems(newItems)
    setReport(null)
  }

  const processBatch = async () => {
    if (items.length === 0) return
    
    setIsProcessing(true)
    setIsPaused(false)
    abortControllerRef.current = new AbortController()
    
    const results: any[] = []
    let completed = 0
    let failed = 0
    
    for (let i = 0; i < items.length; i++) {
      if (isPaused || abortControllerRef.current?.signal.aborted) break
      
      const item = items[i]
      
      // Update status to processing
      setItems(prev => prev.map(it => 
        it.id === item.id ? { ...it, status: 'processing' as const } : it
      ))
      
      try {
        const result = await onAnalyze(item.text)
        results.push(result)
        completed++
        
        // Update with result
        setItems(prev => prev.map(it => 
          it.id === item.id ? { ...it, status: 'completed' as const, result } : it
        ))
      } catch (error) {
        failed++
        setItems(prev => prev.map(it => 
          it.id === item.id ? { 
            ...it, 
            status: 'error' as const, 
            error: error instanceof Error ? error.message : 'Failed to analyze'
          } : it
        ))
      }
      
      setProgress(((i + 1) / items.length) * 100)
      
      // Add small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Generate report
    generateReport(results, completed, failed)
    setIsProcessing(false)
  }

  const generateReport = (results: any[], completed: number, failed: number) => {
    const manipulationScores = results
      .filter(r => r?.propaganda?.overallManipulation)
      .map(r => r.propaganda.overallManipulation)
    
    const avgManipulationScore = manipulationScores.length > 0
      ? manipulationScores.reduce((a, b) => a + b, 0) / manipulationScores.length
      : undefined
    
    // Extract common patterns
    const patterns: Record<string, number> = {}
    results.forEach(result => {
      if (result?.propaganda?.techniques) {
        result.propaganda.techniques.forEach((technique: string) => {
          patterns[technique] = (patterns[technique] || 0) + 1
        })
      }
    })
    
    const topPatterns = Object.entries(patterns)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([pattern]) => pattern)
    
    // Generate insights
    const insights: string[] = []
    if (avgManipulationScore !== undefined) {
      if (avgManipulationScore > 70) {
        insights.push('High manipulation detected across analyzed texts')
      } else if (avgManipulationScore < 30) {
        insights.push('Low manipulation levels in analyzed content')
      }
    }
    
    if (topPatterns.length > 0) {
      insights.push(`Most common technique: ${topPatterns[0]}`)
    }
    
    if (completed > 0) {
      insights.push(`${Math.round((completed / items.length) * 100)}% success rate`)
    }
    
    setReport({
      totalItems: items.length,
      completed,
      failed,
      avgManipulationScore,
      topPatterns,
      insights
    })
  }

  const pauseProcessing = () => {
    setIsPaused(true)
    abortControllerRef.current?.abort()
  }

  const resumeProcessing = () => {
    setIsPaused(false)
    processBatch()
  }

  const downloadResults = () => {
    const data = {
      timestamp: new Date().toISOString(),
      items: items.map(item => ({
        text: item.text,
        status: item.status,
        result: item.result,
        error: item.error
      })),
      report
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-analysis-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadCSV = () => {
    let csv = 'Text,Status,Manipulation Score,Techniques\n'
    
    items.forEach(item => {
      const score = item.result?.propaganda?.overallManipulation || ''
      const techniques = item.result?.propaganda?.techniques?.join('; ') || ''
      csv += `"${item.text.replace(/"/g, '""')}","${item.status}","${score}","${techniques}"\n`
    })
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-analysis-${Date.now()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <div className="glass-card-elevated p-6">
        <CardHeader className="px-0 pt-0">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-400" />
            Batch Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="glass-card hover:bg-white/10 flex-1"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload File (.txt, .csv)
              </Button>
              
              <Button
                variant="outline"
                onClick={() => {
                  const text = prompt('Paste your text (one item per line):')
                  if (text) handleTextAreaInput(text)
                }}
                className="glass-card hover:bg-white/10 flex-1"
                disabled={isProcessing}
              >
                <FileText className="h-4 w-4 mr-2" />
                Paste Text
              </Button>
            </div>
            
            {items.length > 0 && (
              <div className="p-4 glass-card">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    {items.length} items loaded
                  </span>
                  <div className="flex gap-2">
                    {!isProcessing ? (
                      <Button
                        size="sm"
                        onClick={processBatch}
                        className="btn-primary"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start Analysis
                      </Button>
                    ) : isPaused ? (
                      <Button
                        size="sm"
                        onClick={resumeProcessing}
                        className="btn-primary"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={pauseProcessing}
                        variant="outline"
                        className="glass-card hover:bg-white/10"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </Button>
                    )}
                  </div>
                </div>
                
                {isProcessing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs text-white/60">
                      Processing... {Math.round(progress)}%
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </div>

      {/* Results Section */}
      {items.length > 0 && (
        <div className="glass-card-elevated p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle>Results</CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {items.slice(0, 50).map(item => (
                <div key={item.id} className="glass-card p-3 flex items-center justify-between">
                  <span className="text-sm truncate flex-1 mr-4">
                    {item.text.substring(0, 50)}...
                  </span>
                  <div className="flex items-center gap-2">
                    {item.status === 'pending' && <Loader2 className="h-4 w-4 text-gray-400" />}
                    {item.status === 'processing' && <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />}
                    {item.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-400" />}
                    {item.status === 'error' && <AlertCircle className="h-4 w-4 text-red-400" />}
                    {item.result?.propaganda?.overallManipulation && (
                      <span className="text-xs font-bold text-purple-400">
                        {Math.round(item.result.propaganda.overallManipulation)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {items.length > 50 && (
                <p className="text-center text-white/50 text-sm py-2">
                  And {items.length - 50} more...
                </p>
              )}
            </div>
            
            {/* Export Buttons */}
            {items.some(item => item.status === 'completed') && (
              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadResults}
                  className="glass-card hover:bg-white/10"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Export JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadCSV}
                  className="glass-card hover:bg-white/10"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-1" />
                  Export CSV
                </Button>
              </div>
            )}
          </CardContent>
        </div>
      )}

      {/* Report Section */}
      {report && (
        <div className="glass-card-elevated p-6">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5 text-purple-400" />
              Analysis Report
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {report.totalItems}
                </div>
                <div className="text-xs text-white/60">Total Items</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-green-400">
                  {report.completed}
                </div>
                <div className="text-xs text-white/60">Completed</div>
              </div>
              <div className="glass-card p-4 text-center">
                <div className="text-2xl font-bold text-red-400">
                  {report.failed}
                </div>
                <div className="text-xs text-white/60">Failed</div>
              </div>
              {report.avgManipulationScore !== undefined && (
                <div className="glass-card p-4 text-center">
                  <div className="text-2xl font-bold text-orange-400">
                    {Math.round(report.avgManipulationScore)}%
                  </div>
                  <div className="text-xs text-white/60">Avg. Manipulation</div>
                </div>
              )}
            </div>
            
            {report.topPatterns.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-medium mb-2">Top Patterns</h4>
                <div className="flex flex-wrap gap-2">
                  {report.topPatterns.map((pattern, index) => (
                    <span key={index} className="chip chip-primary text-xs">
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {report.insights.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Insights</h4>
                <div className="space-y-1">
                  {report.insights.map((insight, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <TrendingUp className="h-3 w-3 text-purple-400 mt-0.5" />
                      <p className="text-xs text-white/80">{insight}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </div>
      )}
    </div>
  )
}