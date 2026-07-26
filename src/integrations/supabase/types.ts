export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      chats: {
        Row: {
          ai_response: string
          created_at: string
          document_id: string
          id: string
          source_reference: string | null
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          created_at?: string
          document_id: string
          id?: string
          source_reference?: string | null
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          created_at?: string
          document_id?: string
          id?: string
          source_reference?: string | null
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "chats_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string
          created_at: string
          file_name: string
          file_size: number
          file_type: string
          file_url: string | null
          id: string
          page_count: number | null
          processing_error: string | null
          processing_status: string
          processing_step: string | null
          upload_date: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          file_name: string
          file_size?: number
          file_type: string
          file_url?: string | null
          id?: string
          page_count?: number | null
          processing_error?: string | null
          processing_status?: string
          processing_step?: string | null
          upload_date?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string | null
          id?: string
          page_count?: number | null
          processing_error?: string | null
          processing_status?: string
          processing_step?: string | null
          upload_date?: string
          user_id?: string
        }
        Relationships: []
      }
      explanations: {
        Row: {
          created_at: string
          difficulty_level: string
          document_id: string
          explanation: string
          id: string
          original_text: string
          terms: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          difficulty_level?: string
          document_id: string
          explanation: string
          id?: string
          original_text: string
          terms?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          difficulty_level?: string
          document_id?: string
          explanation?: string
          id?: string
          original_text?: string
          terms?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explanations_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      history: {
        Row: {
          ai_feature_used: string
          document_id: string
          id: string
          last_accessed: string
          user_id: string
        }
        Insert: {
          ai_feature_used: string
          document_id: string
          id?: string
          last_accessed?: string
          user_id: string
        }
        Update: {
          ai_feature_used?: string
          document_id?: string
          id?: string
          last_accessed?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "history_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      insights: {
        Row: {
          created_at: string
          definitions: Json
          document_id: string
          id: string
          important_dates: Json
          important_quotes: Json
          key_ideas: Json
          people: Json
          themes: Json
          timeline: Json
          user_id: string
          vocabulary: Json
        }
        Insert: {
          created_at?: string
          definitions?: Json
          document_id: string
          id?: string
          important_dates?: Json
          important_quotes?: Json
          key_ideas?: Json
          people?: Json
          themes?: Json
          timeline?: Json
          user_id: string
          vocabulary?: Json
        }
        Update: {
          created_at?: string
          definitions?: Json
          document_id?: string
          id?: string
          important_dates?: Json
          important_quotes?: Json
          key_ideas?: Json
          people?: Json
          themes?: Json
          timeline?: Json
          user_id?: string
          vocabulary?: Json
        }
        Relationships: [
          {
            foreignKeyName: "insights_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          answer_key: Json
          created_at: string
          document_id: string
          flashcards: Json
          id: string
          long_questions: Json
          mcqs: Json
          notes: string | null
          short_questions: Json
          user_id: string
        }
        Insert: {
          answer_key?: Json
          created_at?: string
          document_id: string
          flashcards?: Json
          id?: string
          long_questions?: Json
          mcqs?: Json
          notes?: string | null
          short_questions?: Json
          user_id: string
        }
        Update: {
          answer_key?: Json
          created_at?: string
          document_id?: string
          flashcards?: Json
          id?: string
          long_questions?: Json
          mcqs?: Json
          notes?: string | null
          short_questions?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "study_materials_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      study_progress: {
        Row: {
          cards_reviewed: number
          last_study_date: string | null
          streak_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cards_reviewed?: number
          last_study_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cards_reviewed?: number
          last_study_date?: string | null
          streak_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      summaries: {
        Row: {
          created_at: string
          document_id: string
          id: string
          reading_time: number | null
          summary_text: string
          summary_type: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          reading_time?: number | null
          summary_text: string
          summary_type?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          reading_time?: number | null
          summary_text?: string
          summary_type?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "summaries_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      user_settings: {
        Row: {
          ai_model: string
          email_notifications: boolean
          language: string
          save_history: boolean
          study_reminders: boolean
          theme: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_model?: string
          email_notifications?: boolean
          language?: string
          save_history?: boolean
          study_reminders?: boolean
          theme?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_model?: string
          email_notifications?: boolean
          language?: string
          save_history?: boolean
          study_reminders?: boolean
          theme?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
