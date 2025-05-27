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
      ai_agents: {
        Row: {
          created_at: string
          id: string
          name: string
          purpose: string
          tasks: string
          tools: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          purpose: string
          tasks: string
          tools?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purpose?: string
          tasks?: string
          tools?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      crawling_urls: {
        Row: {
          created_at: string
          id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          url?: string
        }
        Relationships: []
      }
      knowledge_base_files: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          name: string
          size: number | null
          type: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          name: string
          size?: number | null
          type: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          name?: string
          size?: number | null
          type?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      proposal_analyses: {
        Row: {
          content: Json
          created_at: string | null
          id: string
          proposal_id: string | null
          recommended_action: string | null
          relevance_score: number | null
        }
        Insert: {
          content: Json
          created_at?: string | null
          id?: string
          proposal_id?: string | null
          recommended_action?: string | null
          relevance_score?: number | null
        }
        Update: {
          content?: Json
          created_at?: string | null
          id?: string
          proposal_id?: string | null
          recommended_action?: string | null
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_analyses_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_files: {
        Row: {
          content_type: string | null
          file_path: string
          filename: string
          id: string
          proposal_id: string
          size: number | null
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          content_type?: string | null
          file_path: string
          filename: string
          id?: string
          proposal_id: string
          size?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          content_type?: string | null
          file_path?: string
          filename?: string
          id?: string
          proposal_id?: string
          size?: number | null
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposal_files_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      proposal_prompts: {
        Row: {
          created_at: string
          id: string
          name: string
          purpose: string
          tasks: string
          tools: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          purpose: string
          tasks: string
          tools?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          purpose?: string
          tasks?: string
          tools?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      proposal_templates: {
        Row: {
          content_type: string | null
          created_at: string
          file_path: string
          filename: string
          id: string
          name: string
          size: number | null
          type: string
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_path: string
          filename: string
          id?: string
          name: string
          size?: number | null
          type: string
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_path?: string
          filename?: string
          id?: string
          name?: string
          size?: number | null
          type?: string
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          client: string | null
          company: string | null
          created_at: string
          date: string
          deadline: string | null
          description: string | null
          id: string
          source: string | null
          status: string
          submission_date: string | null
          title: string
          value: string | null
        }
        Insert: {
          client?: string | null
          company?: string | null
          created_at?: string
          date: string
          deadline?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status: string
          submission_date?: string | null
          title: string
          value?: string | null
        }
        Update: {
          client?: string | null
          company?: string | null
          created_at?: string
          date?: string
          deadline?: string | null
          description?: string | null
          id?: string
          source?: string | null
          status?: string
          submission_date?: string | null
          title?: string
          value?: string | null
        }
        Relationships: []
      }
      qualification_resources: {
        Row: {
          content_type: string | null
          created_at: string | null
          description: string | null
          file_path: string | null
          id: string
          name: string
          size: number | null
          type: string
          uploaded_by: string | null
          url: string | null
        }
        Insert: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          name: string
          size?: number | null
          type: string
          uploaded_by?: string | null
          url?: string | null
        }
        Update: {
          content_type?: string | null
          created_at?: string | null
          description?: string | null
          file_path?: string | null
          id?: string
          name?: string
          size?: number | null
          type?: string
          uploaded_by?: string | null
          url?: string | null
        }
        Relationships: []
      }
      qualification_rules: {
        Row: {
          budget_thresholds: Json
          created_at: string | null
          id: string
          keyword_weights: Json
          minimum_relevancy_score: number
          sector_weights: Json
          updated_at: string | null
        }
        Insert: {
          budget_thresholds?: Json
          created_at?: string | null
          id?: string
          keyword_weights?: Json
          minimum_relevancy_score?: number
          sector_weights?: Json
          updated_at?: string | null
        }
        Update: {
          budget_thresholds?: Json
          created_at?: string | null
          id?: string
          keyword_weights?: Json
          minimum_relevancy_score?: number
          sector_weights?: Json
          updated_at?: string | null
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
