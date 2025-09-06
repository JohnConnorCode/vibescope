'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  FileText, 
  Download, 
  Printer,
  Share2,
  Calendar,
  BarChart,
  Shield,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface ReportGeneratorProps {
  analysisData: any
  historicalData?: any[]
  userId?: string
}

export function ReportGenerator({ analysisData, historicalData, userId }: ReportGeneratorProps) {
  const [reportTitle, setReportTitle] = useState(`VibeScope Analysis Report - ${new Date().toLocaleDateString()}`)
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeRecommendations, setIncludeRecommendations] = useState(true)
  const [includeHistory, setIncludeHistory] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateRecommendations = (data: any) => {
    const recommendations = []
    
    if (data.propaganda?.overallManipulation > 70) {
      recommendations.push({
        type: 'critical',
        title: 'High Manipulation Detected',
        description: 'This content shows significant manipulation techniques. Consider fact-checking and seeking alternative sources.',
        icon: AlertTriangle
      })
    } else if (data.propaganda?.overallManipulation > 40) {
      recommendations.push({
        type: 'warning',
        title: 'Moderate Manipulation Present',
        description: 'Some manipulation techniques detected. Read critically and verify key claims.',
        icon: AlertTriangle
      })
    } else if (data.propaganda?.overallManipulation) {
      recommendations.push({
        type: 'success',
        title: 'Low Manipulation Score',
        description: 'This content appears relatively neutral with minimal manipulation techniques.',
        icon: CheckCircle
      })
    }

    // Add specific technique recommendations
    if (data.propaganda?.fearTactics > 60) {
      recommendations.push({
        type: 'warning',
        title: 'Fear-Based Messaging',
        description: 'High levels of fear tactics detected. Consider the emotional impact and seek balanced perspectives.',
        icon: AlertTriangle
      })
    }

    if (data.propaganda?.gaslighting > 60) {
      recommendations.push({
        type: 'critical',
        title: 'Reality Distortion Detected',
        description: 'Significant gaslighting techniques present. Verify facts from multiple reliable sources.',
        icon: XCircle
      })
    }

    // Semantic recommendations
    if (data.axes) {
      const extremeAxes = Object.entries(data.axes).filter(([_, value]) => Math.abs(value as number) > 0.7)
      if (extremeAxes.length > 0) {
        recommendations.push({
          type: 'info',
          title: 'Strong Semantic Patterns',
          description: `This content shows strong bias in ${extremeAxes.length} semantic dimensions. Consider the underlying perspectives.`,
          icon: Brain
        })
      }
    }

    return recommendations
  }

  const generateHTMLReport = () => {
    const recommendations = generateRecommendations(analysisData)
    
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${reportTitle}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
        }
        
        .container {
            max-width: 1000px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
        }
        
        .header .date {
            opacity: 0.9;
            font-size: 1.1em;
        }
        
        .content {
            padding: 40px;
        }
        
        .section {
            margin-bottom: 40px;
        }
        
        .section h2 {
            color: #7c3aed;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
            font-size: 1.8em;
        }
        
        .metric-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
            border: 1px solid #e5e7eb;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #7c3aed;
        }
        
        .metric-label {
            color: #6b7280;
            margin-top: 5px;
        }
        
        .score-bar {
            width: 100%;
            height: 30px;
            background: #e5e7eb;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .score-fill {
            height: 100%;
            transition: width 0.3s ease;
        }
        
        .score-low { background: #10b981; }
        .score-medium { background: #f59e0b; }
        .score-high { background: #ef4444; }
        
        .recommendation {
            background: #f9fafb;
            border-left: 4px solid;
            padding: 15px;
            margin: 15px 0;
            border-radius: 4px;
        }
        
        .recommendation.critical { border-color: #ef4444; }
        .recommendation.warning { border-color: #f59e0b; }
        .recommendation.success { border-color: #10b981; }
        .recommendation.info { border-color: #3b82f6; }
        
        .recommendation h3 {
            margin-bottom: 5px;
            color: #1f2937;
        }
        
        .recommendation p {
            color: #6b7280;
        }
        
        .techniques-list {
            list-style: none;
            padding: 0;
        }
        
        .techniques-list li {
            background: #f3f4f6;
            padding: 10px 15px;
            margin: 10px 0;
            border-radius: 6px;
            border-left: 3px solid #7c3aed;
        }
        
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            border-top: 1px solid #e5e7eb;
        }
        
        .chart-placeholder {
            background: #f3f4f6;
            border: 2px dashed #d1d5db;
            border-radius: 8px;
            padding: 40px;
            text-align: center;
            color: #9ca3af;
            margin: 20px 0;
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            .container {
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>${reportTitle}</h1>
            <div class="date">Generated on ${new Date().toLocaleString()}</div>
        </div>
        
        <div class="content">
            <!-- Analysis Overview -->
            <div class="section">
                <h2>Analysis Overview</h2>
                <div class="metric-grid">
                    <div class="metric-card">
                        <div class="metric-value">${analysisData.type === 'sentence' ? 'Sentence' : 'Word'}</div>
                        <div class="metric-label">Analysis Type</div>
                    </div>
                    ${analysisData.propaganda ? `
                    <div class="metric-card">
                        <div class="metric-value">${Math.round(analysisData.propaganda.overallManipulation)}%</div>
                        <div class="metric-label">Manipulation Score</div>
                    </div>
                    ` : ''}
                    ${analysisData.neighbors ? `
                    <div class="metric-card">
                        <div class="metric-value">${analysisData.neighbors.length}</div>
                        <div class="metric-label">Similar Terms</div>
                    </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 20px;">
                    <strong>Analyzed Text:</strong>
                    <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-top: 10px; font-style: italic;">
                        "${analysisData.term}"
                    </div>
                </div>
            </div>
            
            ${analysisData.propaganda ? `
            <!-- Manipulation Analysis -->
            <div class="section">
                <h2>Manipulation Analysis</h2>
                
                ${Object.entries(analysisData.propaganda)
                  .filter(([key]) => !['overallManipulation', 'techniques', 'explanations'].includes(key))
                  .map(([key, value]) => {
                    const score = value as number
                    if (score === 0) return ''
                    const scoreClass = score > 70 ? 'score-high' : score > 40 ? 'score-medium' : 'score-low'
                    return `
                    <div style="margin: 20px 0;">
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                            <span>${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
                            <strong>${Math.round(score)}%</strong>
                        </div>
                        <div class="score-bar">
                            <div class="score-fill ${scoreClass}" style="width: ${score}%"></div>
                        </div>
                    </div>
                    `
                  }).join('')}
                
                ${analysisData.propaganda.techniques?.length > 0 ? `
                <h3 style="margin-top: 30px; margin-bottom: 15px;">Detected Techniques</h3>
                <ul class="techniques-list">
                    ${analysisData.propaganda.techniques.map((technique: string, index: number) => `
                    <li>
                        <strong>${technique.replace(/([A-Z])/g, ' $1').trim()}</strong>
                        ${analysisData.propaganda.explanations?.[index] ? `
                        <p style="margin-top: 5px; font-size: 0.95em;">${analysisData.propaganda.explanations[index]}</p>
                        ` : ''}
                    </li>
                    `).join('')}
                </ul>
                ` : ''}
            </div>
            ` : ''}
            
            ${analysisData.axes ? `
            <!-- Semantic Analysis -->
            <div class="section">
                <h2>Semantic Dimensions</h2>
                ${includeCharts ? '<div class="chart-placeholder">Semantic radar chart would appear here in the app</div>' : ''}
                
                <div style="margin-top: 20px;">
                    ${Object.entries(analysisData.axes).map(([axis, value]) => {
                        const percentage = Math.round((value as number) * 100)
                        const absPercentage = Math.abs(percentage)
                        const scoreClass = absPercentage > 70 ? 'score-high' : absPercentage > 40 ? 'score-medium' : 'score-low'
                        return `
                        <div style="margin: 15px 0;">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                                <span>${axis}</span>
                                <strong>${percentage > 0 ? '+' : ''}${percentage}%</strong>
                            </div>
                            <div class="score-bar">
                                <div class="score-fill ${scoreClass}" style="width: ${absPercentage}%; margin-left: ${percentage < 0 ? (50 - absPercentage/2) : 50}%;"></div>
                            </div>
                        </div>
                        `
                    }).join('')}
                </div>
            </div>
            ` : ''}
            
            ${includeRecommendations && recommendations.length > 0 ? `
            <!-- Recommendations -->
            <div class="section">
                <h2>Recommendations</h2>
                ${recommendations.map(rec => `
                <div class="recommendation ${rec.type}">
                    <h3>${rec.title}</h3>
                    <p>${rec.description}</p>
                </div>
                `).join('')}
            </div>
            ` : ''}
            
            ${includeHistory && historicalData && historicalData.length > 0 ? `
            <!-- Historical Context -->
            <div class="section">
                <h2>Historical Analysis Context</h2>
                <p>This analysis is part of ${historicalData.length} total analyses performed.</p>
                ${includeCharts ? '<div class="chart-placeholder">Historical trend chart would appear here</div>' : ''}
            </div>
            ` : ''}
        </div>
        
        <div class="footer">
            <p>Generated by VibeScope • AI-Powered Language Analysis</p>
            <p style="margin-top: 5px; font-size: 0.9em;">© ${new Date().getFullYear()} VibeScope. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
    
    return html
  }

  const downloadReport = (format: 'html' | 'pdf') => {
    setIsGenerating(true)
    
    setTimeout(() => {
      if (format === 'html') {
        const html = generateHTMLReport()
        const blob = new Blob([html], { type: 'text/html' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `vibescope-report-${Date.now()}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else if (format === 'pdf') {
        // For PDF, we'll open the HTML in a new window and let the user print to PDF
        const html = generateHTMLReport()
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(html)
          newWindow.document.close()
          setTimeout(() => {
            newWindow.print()
          }, 500)
        }
      }
      
      setIsGenerating(false)
    }, 1000)
  }

  const shareReport = () => {
    const html = generateHTMLReport()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    if (navigator.share) {
      navigator.share({
        title: reportTitle,
        text: 'Check out my VibeScope analysis report',
        url: url
      }).catch(console.error)
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(url).then(() => {
        alert('Report link copied to clipboard!')
      })
    }
  }

  if (!analysisData) {
    return (
      <Card className="glass-card-elevated">
        <CardContent className="p-12 text-center">
          <FileText className="h-12 w-12 text-purple-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No Analysis Data</h3>
          <p className="text-white/60">
            Complete an analysis first to generate a report
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="glass-card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-purple-400" />
          Generate Analysis Report
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Report Title */}
          <div>
            <label className="text-sm font-medium mb-2 block">Report Title</label>
            <Input
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
              className="input-dark"
              placeholder="Enter report title..."
            />
          </div>

          {/* Report Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium mb-2 block">Include in Report:</label>
            
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCharts}
                onChange={(e) => setIncludeCharts(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="flex items-center gap-2">
                <BarChart className="h-4 w-4 text-purple-400" />
                Visual Charts & Graphs
              </span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRecommendations}
                onChange={(e) => setIncludeRecommendations(e.target.checked)}
                className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
              />
              <span className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-400" />
                AI Recommendations
              </span>
            </label>

            {historicalData && historicalData.length > 0 && (
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHistory}
                  onChange={(e) => setIncludeHistory(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-600 bg-gray-800 text-purple-500 focus:ring-purple-500"
                />
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-purple-400" />
                  Historical Context
                </span>
              </label>
            )}
          </div>

          {/* Preview Section */}
          <div className="p-4 glass-card">
            <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-400" />
              Report Preview
            </h4>
            <div className="space-y-2 text-sm text-white/70">
              <p>• Analysis of: "{analysisData.term?.slice(0, 50)}..."</p>
              {analysisData.propaganda && (
                <p>• Manipulation Score: {Math.round(analysisData.propaganda.overallManipulation)}%</p>
              )}
              {analysisData.propaganda?.techniques?.length > 0 && (
                <p>• Detected Techniques: {analysisData.propaganda.techniques.length}</p>
              )}
              {includeRecommendations && (
                <p>• AI Recommendations: {generateRecommendations(analysisData).length}</p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => downloadReport('html')}
              disabled={isGenerating}
              className="btn-primary flex-1"
            >
              {isGenerating ? (
                <>
                  <div className="loading-spinner w-4 h-4 mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Download HTML
                </>
              )}
            </Button>

            <Button
              onClick={() => downloadReport('pdf')}
              disabled={isGenerating}
              variant="outline"
              className="glass-card hover:bg-white/10 flex-1"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print to PDF
            </Button>

            <Button
              onClick={shareReport}
              disabled={isGenerating}
              variant="outline"
              className="glass-card hover:bg-white/10"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Info Note */}
          <div className="text-xs text-white/50 text-center">
            Reports include detailed analysis, visualizations, and AI-powered recommendations
          </div>
        </div>
      </CardContent>
    </Card>
  )
}