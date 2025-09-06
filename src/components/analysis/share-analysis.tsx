'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Share2, 
  Link2, 
  Twitter,
  Copy,
  Check,
  MessageCircle,
  Mail,
  Facebook,
  Linkedin,
  ExternalLink
} from 'lucide-react'

interface ShareAnalysisProps {
  analysisData: any
  term: string
  type: 'word' | 'sentence'
}

export function ShareAnalysis({ analysisData, term, type }: ShareAnalysisProps) {
  const [copied, setCopied] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const generateShareableLink = async () => {
    setIsGenerating(true)
    
    try {
      // Create a shareable link
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          term,
          type,
          data: analysisData,
          expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
        })
      })
      
      if (response.ok) {
        const { id, url } = await response.json()
        // Use the URL from the response or construct it
        const shareUrl = url || `${window.location.origin}/share/${id}`
        setShareUrl(shareUrl)
        return shareUrl
      }
    } catch (error) {
      console.error('Failed to create shareable link:', error)
    } finally {
      setIsGenerating(false)
    }
    
    // Fallback: create URL with query params
    const params = new URLSearchParams({
      q: term,
      type: type
    })
    const url = `${window.location.origin}?${params.toString()}`
    setShareUrl(url)
    return url
  }

  const copyToClipboard = async () => {
    const url = shareUrl || await generateShareableLink()
    if (url) {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const shareToTwitter = async () => {
    const url = shareUrl || await generateShareableLink()
    const text = type === 'sentence' && analysisData.propaganda
      ? `I analyzed this text with VibeScope and found ${Math.round(analysisData.propaganda.overallManipulation)}% manipulation score: "${term.slice(0, 100)}..."`
      : `Check out the semantic analysis of "${term}" on VibeScope`
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`
    window.open(twitterUrl, '_blank')
  }

  const shareToLinkedIn = async () => {
    const url = shareUrl || await generateShareableLink()
    const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
    window.open(linkedinUrl, '_blank')
  }

  const shareToFacebook = async () => {
    const url = shareUrl || await generateShareableLink()
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`
    window.open(facebookUrl, '_blank')
  }

  const shareToReddit = async () => {
    const url = shareUrl || await generateShareableLink()
    const title = `VibeScope Analysis: ${term.slice(0, 100)}`
    const redditUrl = `https://reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
    window.open(redditUrl, '_blank')
  }

  const shareViaEmail = async () => {
    const url = shareUrl || await generateShareableLink()
    const subject = `VibeScope Analysis: ${term.slice(0, 50)}`
    const body = type === 'sentence' && analysisData.propaganda
      ? `I analyzed this text with VibeScope:\n\n"${term}"\n\nManipulation Score: ${Math.round(analysisData.propaganda.overallManipulation)}%\n\nView full analysis: ${url}`
      : `Check out this VibeScope analysis of "${term}":\n\n${url}`
    
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailtoUrl
  }

  const getManipulationBadge = () => {
    if (type !== 'sentence' || !analysisData.propaganda) return null
    
    const score = analysisData.propaganda.overallManipulation
    const level = score > 70 ? 'HIGH' : score > 40 ? 'MODERATE' : 'LOW'
    const color = score > 70 ? 'text-red-400' : score > 40 ? 'text-orange-400' : 'text-green-400'
    
    return (
      <div className="flex items-center gap-2 mb-4">
        <span className={`text-2xl font-bold ${color}`}>
          {Math.round(score)}%
        </span>
        <span className="text-sm text-white/60">
          {level} MANIPULATION DETECTED
        </span>
      </div>
    )
  }

  return (
    <Card className="glass-card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-purple-400" />
            Share Analysis
          </div>
          {shareUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(shareUrl, '_blank')}
              className="glass-card hover:bg-white/10"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Manipulation Badge for Headlines */}
          {getManipulationBadge()}

          {/* Quick Share Message */}
          <div className="p-4 glass-card">
            <p className="text-sm text-white/80 mb-2">
              {type === 'sentence' 
                ? '📰 Share this headline/tweet analysis:' 
                : '📊 Share this word analysis:'}
            </p>
            <p className="text-xs text-white/60 italic">
              "{term.slice(0, 100)}{term.length > 100 ? '...' : ''}"
            </p>
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="flex gap-2">
              <input
                type="text"
                value={shareUrl}
                readOnly
                className="input-dark flex-1 text-sm"
                onClick={(e) => e.currentTarget.select()}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={copyToClipboard}
                className="glass-card hover:bg-white/10"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-400" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          )}

          {/* Social Share Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={shareToTwitter}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <Twitter className="h-4 w-4" />
              Twitter
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareToLinkedIn}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <Linkedin className="h-4 w-4" />
              LinkedIn
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareToFacebook}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <Facebook className="h-4 w-4" />
              Facebook
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareToReddit}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Reddit
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={shareViaEmail}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              Email
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={copyToClipboard}
              disabled={isGenerating}
              className="glass-card hover:bg-white/10 flex items-center gap-2"
            >
              <Link2 className="h-4 w-4" />
              Copy Link
            </Button>
          </div>

          {/* Generate Link Button */}
          {!shareUrl && (
            <Button
              onClick={generateShareableLink}
              disabled={isGenerating}
              className="btn-primary w-full"
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Share2 className="h-4 w-4 mr-2" />
                  Generate Shareable Link
                </>
              )}
            </Button>
          )}

          {/* Info Text */}
          <p className="text-xs text-white/50 text-center">
            {type === 'sentence' 
              ? 'Share this analysis to help others identify manipulation in headlines and social media'
              : 'Share this semantic analysis with colleagues and researchers'}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}