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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      ai_suggestions_cache: {
        Row: {
          category: string
          created_at: string
          expires_at: string
          id: string
          suggestions: Json
          trend_id: number
        }
        Insert: {
          category: string
          created_at?: string
          expires_at?: string
          id?: string
          suggestions?: Json
          trend_id: number
        }
        Update: {
          category?: string
          created_at?: string
          expires_at?: string
          id?: string
          suggestions?: Json
          trend_id?: number
        }
        Relationships: []
      }
      ai_usage_logs: {
        Row: {
          cost: number | null
          created_at: string
          endpoint: string
          id: string
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string
          endpoint: string
          id?: string
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string
          endpoint?: string
          id?: string
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: []
      }
      bankroll_transactions: {
        Row: {
          amount: number
          bankroll_id: string
          created_at: string
          id: string
          notes: string | null
          reference_bet_id: string | null
          type: string
          updated_at: string
        }
        Insert: {
          amount: number
          bankroll_id: string
          created_at?: string
          id?: string
          notes?: string | null
          reference_bet_id?: string | null
          type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bankroll_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          reference_bet_id?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bankroll_transactions_bankroll_id_fkey"
            columns: ["bankroll_id"]
            isOneToOne: false
            referencedRelation: "bankrolls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bankroll_transactions_reference_bet_id_fkey"
            columns: ["reference_bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      bankrolls: {
        Row: {
          archived: boolean
          created_at: string
          currency: string
          id: string
          kelly_fraction: number | null
          name: string
          staking_strategy: string
          starting_balance: number
          unit_size: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          archived?: boolean
          created_at?: string
          currency?: string
          id?: string
          kelly_fraction?: number | null
          name: string
          staking_strategy?: string
          starting_balance?: number
          unit_size?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          archived?: boolean
          created_at?: string
          currency?: string
          id?: string
          kelly_fraction?: number | null
          name?: string
          staking_strategy?: string
          starting_balance?: number
          unit_size?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bet_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          shared_bet_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          shared_bet_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          shared_bet_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bet_legs: {
        Row: {
          bet_id: string
          bet_market: string
          bet_selection: string
          closing_odds: number | null
          created_at: string
          game_date: string | null
          id: string
          league: string
          odds: number | null
          open_odds: number | null
          result: Database["public"]["Enums"]["bet_status"] | null
          sport: string
          team1: string
          team2: string
        }
        Insert: {
          bet_id: string
          bet_market: string
          bet_selection: string
          closing_odds?: number | null
          created_at?: string
          game_date?: string | null
          id?: string
          league: string
          odds?: number | null
          open_odds?: number | null
          result?: Database["public"]["Enums"]["bet_status"] | null
          sport: string
          team1: string
          team2: string
        }
        Update: {
          bet_id?: string
          bet_market?: string
          bet_selection?: string
          closing_odds?: number | null
          created_at?: string
          game_date?: string | null
          id?: string
          league?: string
          odds?: number | null
          open_odds?: number | null
          result?: Database["public"]["Enums"]["bet_status"] | null
          sport?: string
          team1?: string
          team2?: string
        }
        Relationships: [
          {
            foreignKeyName: "bet_legs_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "bets"
            referencedColumns: ["id"]
          },
        ]
      }
      bet_reactions: {
        Row: {
          created_at: string
          id: string
          shared_bet_id: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shared_bet_id: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shared_bet_id?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      bets: {
        Row: {
          ai_suggested: boolean | null
          bankroll_id: string | null
          bet_type: Database["public"]["Enums"]["bet_type"]
          created_at: string
          id: string
          is_public: boolean
          notes: string | null
          potential_payout: number | null
          settled_at: string | null
          sportsbook: string | null
          stake: number
          status: Database["public"]["Enums"]["bet_status"]
          tags: string[]
          tailed_from_shared_bet_id: string | null
          total_odds: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_suggested?: boolean | null
          bankroll_id?: string | null
          bet_type?: Database["public"]["Enums"]["bet_type"]
          created_at?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          potential_payout?: number | null
          settled_at?: string | null
          sportsbook?: string | null
          stake: number
          status?: Database["public"]["Enums"]["bet_status"]
          tags?: string[]
          tailed_from_shared_bet_id?: string | null
          total_odds?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_suggested?: boolean | null
          bankroll_id?: string | null
          bet_type?: Database["public"]["Enums"]["bet_type"]
          created_at?: string
          id?: string
          is_public?: boolean
          notes?: string | null
          potential_payout?: number | null
          settled_at?: string | null
          sportsbook?: string | null
          stake?: number
          status?: Database["public"]["Enums"]["bet_status"]
          tags?: string[]
          tailed_from_shared_bet_id?: string | null
          total_odds?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bets_bankroll_id_fkey"
            columns: ["bankroll_id"]
            isOneToOne: false
            referencedRelation: "bankrolls"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      follows: {
        Row: {
          created_at: string
          followed_id: string
          follower_id: string
          id: string
        }
        Insert: {
          created_at?: string
          followed_id: string
          follower_id: string
          id?: string
        }
        Update: {
          created_at?: string
          followed_id?: string
          follower_id?: string
          id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json
          id: string
          read: boolean
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          read?: boolean
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          read?: boolean
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      odds_snapshots: {
        Row: {
          bookmaker: string
          created_at: string
          game_date: string | null
          id: string
          last_updated: string
          league: string
          market: string
          odds: number
          sport: string
          team1: string
          team2: string
        }
        Insert: {
          bookmaker: string
          created_at?: string
          game_date?: string | null
          id?: string
          last_updated?: string
          league: string
          market: string
          odds: number
          sport: string
          team1: string
          team2: string
        }
        Update: {
          bookmaker?: string
          created_at?: string
          game_date?: string | null
          id?: string
          last_updated?: string
          league?: string
          market?: string
          odds?: number
          sport?: string
          team1?: string
          team2?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auto_save_bets: boolean | null
          avatar_url: string | null
          banner_url: string | null
          bio: string | null
          created_at: string
          default_sportsbook: string | null
          display_name: string | null
          id: string
          location: string | null
          notification_preferences: Json
          odds_format: string | null
          public_profile: boolean
          updated_at: string
          user_id: string
          website_url: string | null
          zapier_webhook_url: string | null
        }
        Insert: {
          auto_save_bets?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          default_sportsbook?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          notification_preferences?: Json
          odds_format?: string | null
          public_profile?: boolean
          updated_at?: string
          user_id: string
          website_url?: string | null
          zapier_webhook_url?: string | null
        }
        Update: {
          auto_save_bets?: boolean | null
          avatar_url?: string | null
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          default_sportsbook?: string | null
          display_name?: string | null
          id?: string
          location?: string | null
          notification_preferences?: Json
          odds_format?: string | null
          public_profile?: boolean
          updated_at?: string
          user_id?: string
          website_url?: string | null
          zapier_webhook_url?: string | null
        }
        Relationships: []
      }
      shared_bet_legs: {
        Row: {
          bet_market: string
          bet_selection: string
          created_at: string
          id: string
          league: string
          odds: number | null
          shared_bet_id: string
          sport: string
          team1: string
          team2: string
        }
        Insert: {
          bet_market: string
          bet_selection: string
          created_at?: string
          id?: string
          league: string
          odds?: number | null
          shared_bet_id: string
          sport: string
          team1: string
          team2: string
        }
        Update: {
          bet_market?: string
          bet_selection?: string
          created_at?: string
          id?: string
          league?: string
          odds?: number | null
          shared_bet_id?: string
          sport?: string
          team1?: string
          team2?: string
        }
        Relationships: []
      }
      shared_bets: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_active: boolean
          original_bet_id: string
          owner_user_id: string
          title: string | null
          updated_at: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          original_bet_id: string
          owner_user_id: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          original_bet_id?: string
          owner_user_id?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          ai_calls_per_month: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_per_month: number | null
          updated_at: string
        }
        Insert: {
          ai_calls_per_month: number
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_per_month?: number | null
          updated_at?: string
        }
        Update: {
          ai_calls_per_month?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_per_month?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          plan_id: string
          starts_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          plan_id: string
          starts_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          plan_id?: string
          starts_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard_stats: {
        Row: {
          avatar_url: string | null
          bets_count: number | null
          display_name: string | null
          last_settled_at: string | null
          losses: number | null
          profit: number | null
          pushes: number | null
          roi_percent: number | null
          total_staked: number | null
          user_id: string | null
          win_rate_percent: number | null
          wins: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      bet_status: "pending" | "won" | "lost" | "void" | "push"
      bet_type: "single" | "parlay" | "teaser" | "round_robin"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
      bet_status: ["pending", "won", "lost", "void", "push"],
      bet_type: ["single", "parlay", "teaser", "round_robin"],
    },
  },
} as const
