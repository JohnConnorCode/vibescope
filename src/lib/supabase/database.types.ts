export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis_history: {
        Row: {
          accessed_at: string | null
          analysis_type: string | null
          axes_scores: Json | null
          created_at: string | null
          id: number
          input_text: string
          is_favorite: boolean | null
          manipulation_scores: Json | null
          neighbors: Json | null
          notes: string | null
          results: Json
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          accessed_at?: string | null
          analysis_type?: string | null
          axes_scores?: Json | null
          created_at?: string | null
          id?: number
          input_text: string
          is_favorite?: boolean | null
          manipulation_scores?: Json | null
          neighbors?: Json | null
          notes?: string | null
          results: Json
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          accessed_at?: string | null
          analysis_type?: string | null
          axes_scores?: Json | null
          created_at?: string | null
          id?: number
          input_text?: string
          is_favorite?: boolean | null
          manipulation_scores?: Json | null
          neighbors?: Json | null
          notes?: string | null
          results?: Json
          tags?: string[] | null
          user_id?: string | null
        }
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          id: string
          settings: Json | null
          total_analyses: number | null
          total_favorites: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          settings?: Json | null
          total_analyses?: number | null
          total_favorites?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          settings?: Json | null
          total_analyses?: number | null
          total_favorites?: number | null
          updated_at?: string | null
          username?: string | null
        }
      }
      user_statistics: {
        Row: {
          comparisons_made: number | null
          favorite_dimensions: string[] | null
          last_analysis_date: string | null
          manipulation_detected: number | null
          most_analyzed_words: string[] | null
          sentences_analyzed: number | null
          streak_days: number | null
          total_time_minutes: number | null
          updated_at: string | null
          user_id: string
          words_analyzed: number | null
        }
        Insert: {
          comparisons_made?: number | null
          favorite_dimensions?: string[] | null
          last_analysis_date?: string | null
          manipulation_detected?: number | null
          most_analyzed_words?: string[] | null
          sentences_analyzed?: number | null
          streak_days?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id: string
          words_analyzed?: number | null
        }
        Update: {
          comparisons_made?: number | null
          favorite_dimensions?: string[] | null
          last_analysis_date?: string | null
          manipulation_detected?: number | null
          most_analyzed_words?: string[] | null
          sentences_analyzed?: number | null
          streak_days?: number | null
          total_time_minutes?: number | null
          updated_at?: string | null
          user_id?: string
          words_analyzed?: number | null
        }
      }
      user_collections: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          is_public: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_public?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          is_public?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
      }
      user_achievements: {
        Row: {
          achievement_data: Json | null
          achievement_type: string
          earned_at: string | null
          id: number
          user_id: string | null
        }
        Insert: {
          achievement_data?: Json | null
          achievement_type: string
          earned_at?: string | null
          id?: number
          user_id?: string | null
        }
        Update: {
          achievement_data?: Json | null
          achievement_type?: string
          earned_at?: string | null
          id?: number
          user_id?: string | null
        }
      }
    }
    Views: {
      favorite_analyses: {
        Row: {
          accessed_at: string | null
          analysis_type: string | null
          axes_scores: Json | null
          created_at: string | null
          id: number | null
          input_text: string | null
          is_favorite: boolean | null
          manipulation_scores: Json | null
          neighbors: Json | null
          notes: string | null
          results: Json | null
          tags: string[] | null
          user_id: string | null
        }
      }
    }
  }
}