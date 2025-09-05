import { supabase } from './client'

export interface AnalysisData {
  type: 'word' | 'sentence' | 'comparison'
  input: string
  axes?: Record<string, number>
  manipulation?: {
    overallManipulation: number
    emotionalManipulation: number
    strategicAmbiguity: number
    loadedLanguage: number
    fearTactics: number
    appealToAuthority: number
    bandwagon: number
    falseDichotomy: number
    gaslighting: number
    techniques: string[]
    explanations: string[]
  }
  neighbors?: Array<{ term: string; distance: number }>
}

export async function saveAnalysis(data: AnalysisData) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated' }
  }

  const analysisRecord = {
    user_id: user.id,
    analysis_type: data.type,
    input_text: data.input,
    results: {
      type: data.type,
      timestamp: new Date().toISOString(),
    } as any,
    axes_scores: data.axes || null,
    manipulation_scores: data.manipulation || null,
    neighbors: data.neighbors || null,
  }

  if (data.axes) {
    analysisRecord.results.axes = data.axes
  }
  if (data.manipulation) {
    analysisRecord.results.manipulation = data.manipulation
  }
  if (data.neighbors) {
    analysisRecord.results.neighbors = data.neighbors
  }

  const { data: saved, error } = await supabase
    .from('analysis_history')
    .insert(analysisRecord)
    .select()
    .single()

  if (error) {
    console.error('Error saving analysis:', error)
    return { error: error.message }
  }

  return { data: saved }
}

export async function toggleFavorite(analysisId: number) {
  const { data: analysis, error: fetchError } = await supabase
    .from('analysis_history')
    .select('is_favorite')
    .eq('id', analysisId)
    .single()

  if (fetchError) {
    return { error: fetchError.message }
  }

  const { error } = await supabase
    .from('analysis_history')
    .update({ is_favorite: !analysis.is_favorite })
    .eq('id', analysisId)

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getRecentAnalyses(limit = 10) {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated', data: [] }
  }

  const { data, error } = await supabase
    .from('analysis_history')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching analyses:', error)
    return { error: error.message, data: [] }
  }

  return { data, error: null }
}

export async function getUserStatistics() {
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return { error: 'User not authenticated', data: null }
  }

  const { data, error } = await supabase
    .from('user_statistics')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
    console.error('Error fetching statistics:', error)
    return { error: error.message, data: null }
  }

  return { data: data || {
    words_analyzed: 0,
    sentences_analyzed: 0,
    comparisons_made: 0,
    manipulation_detected: 0,
    streak_days: 0,
  }, error: null }
}