import { supabase } from './client'

export async function getAnalysisHistory(userId: string, limit?: number) {
  const query = (supabase
    .from('analysis_history') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (limit) {
    query.limit(limit)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching analysis history:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

export async function getUserStatistics(userId: string) {
  const { data, error } = await (supabase
    .from('user_statistics') as any)
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') { // Ignore "not found" errors
    console.error('Error fetching user statistics:', error)
    return { data: null, error }
  }

  // Return default stats if none exist
  return { 
    data: data || {
      total_analyses: 0,
      favorite_count: 0,
      streak_days: 0,
      last_analysis: null,
      words_analyzed: 0,
      sentences_analyzed: 0,
      comparisons_made: 0,
      manipulation_detected: 0
    }, 
    error: null 
  }
}

export async function getUserCollections(userId: string) {
  const { data, error } = await (supabase
    .from('user_collections') as any)
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching collections:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

export async function getUserAchievements(userId: string) {
  const { data, error } = await (supabase
    .from('user_achievements') as any)
    .select('*')
    .eq('user_id', userId)
    .order('unlocked_at', { ascending: false })

  if (error) {
    console.error('Error fetching achievements:', error)
    return { data: null, error }
  }

  return { data, error: null }
}