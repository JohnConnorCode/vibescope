'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, FileText, FileJson, Image, Share2, Copy, Check, Link } from 'lucide-react'

interface ExportAnalysisProps {
  data: any
  term: string
  type: 'word' | 'sentence'
}

export function ExportAnalysis({ data, term, type }: ExportAnalysisProps) {
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)

  const exportAsJSON = () => {
    setDownloading(true)
    const exportData = {
      term,
      type,
      timestamp: new Date().toISOString(),
      analysis: data,
      metadata: {
        app: 'VibeScope',
        version: '1.0.0'
      }
    }
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibescope-${term.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setTimeout(() => setDownloading(false), 1000)
  }

  const exportAsText = () => {
    setDownloading(true)
    let textContent = `VibeScope Analysis Report\n${'='.repeat(50)}\n\n`
    textContent += `Term: ${term}\n`
    textContent += `Type: ${type}\n`
    textContent += `Date: ${new Date().toLocaleString()}\n\n`
    
    if (type === 'sentence' && data.propaganda) {
      textContent += `Manipulation Analysis\n${'-'.repeat(30)}\n`
      textContent += `Overall Score: ${Math.round(data.propaganda.overallManipulation)}/100\n\n`
      
      Object.entries(data.propaganda).forEach(([key, value]) => {
        if (key !== 'overallManipulation' && key !== 'techniques' && key !== 'explanations' && typeof value === 'number') {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
          textContent += `${label}: ${Math.round(value)}/100\n`
        }
      })
      
      if (data.propaganda.techniques?.length > 0) {
        textContent += `\nDetected Techniques:\n`
        data.propaganda.techniques.forEach((technique: string, index: number) => {
          textContent += `\n${index + 1}. ${technique}\n`
          if (data.propaganda.explanations?.[index]) {
            textContent += `   ${data.propaganda.explanations[index]}\n`
          }
        })
      }
    }
    
    if (data.axes) {
      textContent += `\nSemantic Dimensions\n${'-'.repeat(30)}\n`
      Object.entries(data.axes).forEach(([axis, value]) => {
        const score = Math.round((value as number) * 100)
        textContent += `${axis}: ${score > 0 ? '+' : ''}${score}%\n`
      })
    }
    
    if (data.neighbors?.length > 0) {
      textContent += `\nSimilar Terms\n${'-'.repeat(30)}\n`
      data.neighbors.slice(0, 10).forEach((neighbor: any) => {
        const similarity = Math.round((1 - neighbor.distance) * 100)
        textContent += `${neighbor.term} (${similarity}% similar)\n`
      })
    }
    
    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vibescope-${term.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setTimeout(() => setDownloading(false), 1000)
  }

  const copyShareLink = () => {
    // In a real app, this would generate a shareable link
    const shareUrl = `${window.location.origin}/share/${btoa(term).replace(/=/g, '')}`
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const exportAsImage = async () => {
    setDownloading(true)
    // This would require a library like html2canvas
    // For now, we'll just show a message
    alert('Image export coming soon! For now, you can take a screenshot.')
    setTimeout(() => setDownloading(false), 1000)
  }

  return (
    <div className="glass-card-elevated p-6">
      <div className="flex items-center gap-2 mb-4">
        <Download className="h-5 w-5 text-purple-400" />
        <h3 className="text-lg font-semibold">Export & Share</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button
          variant="ghost"
          onClick={exportAsJSON}
          disabled={downloading}
          className="glass-card hover:bg-white/10 flex flex-col items-center gap-2 h-auto py-4"
        >
          <FileJson className="h-5 w-5 text-blue-400" />
          <span className="text-xs">JSON</span>
        </Button>

        <Button
          variant="ghost"
          onClick={exportAsText}
          disabled={downloading}
          className="glass-card hover:bg-white/10 flex flex-col items-center gap-2 h-auto py-4"
        >
          <FileText className="h-5 w-5 text-green-400" />
          <span className="text-xs">Text</span>
        </Button>

        <Button
          variant="ghost"
          onClick={exportAsImage}
          disabled={downloading}
          className="glass-card hover:bg-white/10 flex flex-col items-center gap-2 h-auto py-4"
        >
          <Image className="h-5 w-5 text-purple-400" />
          <span className="text-xs">Image</span>
        </Button>

        <Button
          variant="ghost"
          onClick={copyShareLink}
          className="glass-card hover:bg-white/10 flex flex-col items-center gap-2 h-auto py-4"
        >
          {copied ? (
            <>
              <Check className="h-5 w-5 text-green-400" />
              <span className="text-xs">Copied!</span>
            </>
          ) : (
            <>
              <Link className="h-5 w-5 text-orange-400" />
              <span className="text-xs">Share Link</span>
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 p-3 glass-card">
        <p className="text-xs text-white/50 text-center">
          Export your analysis in various formats or create a shareable link
        </p>
      </div>
    </div>
  )
}