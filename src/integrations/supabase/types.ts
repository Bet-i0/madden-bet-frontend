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
          {
            foreignKeyName: "bankroll_transactions_reference_bet_id_fkey"
            columns: ["reference_bet_id"]
            isOneToOne: false
            referencedRelation: "user_clv"
            referencedColumns: ["bet_id"]
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
          {
            foreignKeyName: "bet_legs_bet_id_fkey"
            columns: ["bet_id"]
            isOneToOne: false
            referencedRelation: "user_clv"
            referencedColumns: ["bet_id"]
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
      books: {
        Row: {
          code: string
          created_at: string
          id: number
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
          name?: string
        }
        Relationships: []
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
      feature_flags: {
        Row: {
          created_at: string
          enabled: boolean
          key: string
          note: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          key: string
          note?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          key?: string
          note?: string | null
          updated_at?: string
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
      ingest_runs: {
        Row: {
          books_seen: Json | null
          created_at: string
          duration_ms: number
          error: string | null
          function: string
          id: number
          requests_remaining: number | null
          rows_inserted: number
          sport: string | null
          success: boolean
        }
        Insert: {
          books_seen?: Json | null
          created_at?: string
          duration_ms: number
          error?: string | null
          function: string
          id?: number
          requests_remaining?: number | null
          rows_inserted: number
          sport?: string | null
          success: boolean
        }
        Update: {
          books_seen?: Json | null
          created_at?: string
          duration_ms?: number
          error?: string | null
          function?: string
          id?: number
          requests_remaining?: number | null
          rows_inserted?: number
          sport?: string | null
          success?: boolean
        }
        Relationships: []
      }
      injury_news_cache: {
        Row: {
          confidence: number
          created_at: string
          expires_at: string
          headline: string
          id: number
          player: string
          published_at: string
          source: string | null
          status: string
          updated_at: string
          url: string | null
        }
        Insert: {
          confidence: number
          created_at?: string
          expires_at: string
          headline: string
          id?: number
          player: string
          published_at: string
          source?: string | null
          status: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          confidence?: number
          created_at?: string
          expires_at?: string
          headline?: string
          id?: number
          player?: string
          published_at?: string
          source?: string | null
          status?: string
          updated_at?: string
          url?: string | null
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
      odds_closing: {
        Row: {
          bookmaker: string
          captured_at: string
          created_at: string
          decimal_odds: number
          game_date: string
          id: string
          league: string
          line: number | null
          market: string
          selection: string
          sport: string
          team1: string
          team2: string
        }
        Insert: {
          bookmaker: string
          captured_at?: string
          created_at?: string
          decimal_odds: number
          game_date: string
          id?: string
          league: string
          line?: number | null
          market: string
          selection: string
          sport: string
          team1: string
          team2: string
        }
        Update: {
          bookmaker?: string
          captured_at?: string
          created_at?: string
          decimal_odds?: number
          game_date?: string
          id?: string
          league?: string
          line?: number | null
          market?: string
          selection?: string
          sport?: string
          team1?: string
          team2?: string
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
      player_props_history: {
        Row: {
          bookmaker: string
          event_id: string | null
          event_key: string
          game_date: string
          id: number
          league: string
          line: number | null
          market: string
          odds: number
          player: string
          seen_at: string
          seen_minute: string
          side: string | null
          sport: string
          team: string
          team1: string
          team2: string
        }
        Insert: {
          bookmaker: string
          event_id?: string | null
          event_key: string
          game_date: string
          id?: number
          league: string
          line?: number | null
          market: string
          odds: number
          player: string
          seen_at?: string
          seen_minute: string
          side?: string | null
          sport: string
          team: string
          team1: string
          team2: string
        }
        Update: {
          bookmaker?: string
          event_id?: string | null
          event_key?: string
          game_date?: string
          id?: number
          league?: string
          line?: number | null
          market?: string
          odds?: number
          player?: string
          seen_at?: string
          seen_minute?: string
          side?: string | null
          sport?: string
          team?: string
          team1?: string
          team2?: string
        }
        Relationships: []
      }
      player_props_snapshots: {
        Row: {
          bookmaker: string
          created_at: string
          event_id: string | null
          game_date: string
          id: string
          last_updated: string
          league: string
          line: number | null
          market: string
          odds: number
          player: string
          side: string | null
          sport: string
          team: string | null
          team1: string
          team2: string
        }
        Insert: {
          bookmaker: string
          created_at?: string
          event_id?: string | null
          game_date: string
          id?: string
          last_updated?: string
          league: string
          line?: number | null
          market: string
          odds: number
          player: string
          side?: string | null
          sport: string
          team?: string | null
          team1: string
          team2: string
        }
        Update: {
          bookmaker?: string
          created_at?: string
          event_id?: string | null
          game_date?: string
          id?: string
          last_updated?: string
          league?: string
          line?: number | null
          market?: string
          odds?: number
          player?: string
          side?: string | null
          sport?: string
          team?: string | null
          team1?: string
          team2?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          accessibility_preferences: Json | null
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
          unit_size: number | null
          updated_at: string
          user_id: string
          website_url: string | null
          zapier_webhook_url: string | null
        }
        Insert: {
          accessibility_preferences?: Json | null
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
          unit_size?: number | null
          updated_at?: string
          user_id: string
          website_url?: string | null
          zapier_webhook_url?: string | null
        }
        Update: {
          accessibility_preferences?: Json | null
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
          unit_size?: number | null
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
      strategy_content: {
        Row: {
          confidence: number
          content: Json
          created_at: string
          expected_roi: string
          id: string
          picks: Json
          strategy_id: string
          strategy_name: string
          timeframe: string
          updated_at: string
          valid_until: string
        }
        Insert: {
          confidence?: number
          content: Json
          created_at?: string
          expected_roi?: string
          id?: string
          picks?: Json
          strategy_id: string
          strategy_name: string
          timeframe?: string
          updated_at?: string
          valid_until: string
        }
        Update: {
          confidence?: number
          content?: Json
          created_at?: string
          expected_roi?: string
          id?: string
          picks?: Json
          strategy_id?: string
          strategy_name?: string
          timeframe?: string
          updated_at?: string
          valid_until?: string
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
      teams: {
        Row: {
          created_at: string
          external_id: string | null
          id: number
          league: string
          name: string
          short_name: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: number
          league: string
          name: string
          short_name: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: number
          league?: string
          name?: string
          short_name?: string
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
      best_odds: {
        Row: {
          bookmaker: string | null
          game_date: string | null
          last_updated: string | null
          league: string | null
          market: string | null
          odds: number | null
          rank: number | null
          sport: string | null
          team1: string | null
          team2: string | null
        }
        Relationships: []
      }
      best_prop_odds: {
        Row: {
          best_bookmaker: string | null
          best_odds: number | null
          book_count: number | null
          game_date: string | null
          last_updated: string | null
          league: string | null
          line: number | null
          market: string | null
          player: string | null
          sport: string | null
          team: string | null
        }
        Relationships: []
      }
      latest_injury_status_v: {
        Row: {
          confidence: number | null
          headline: string | null
          player: string | null
          published_at: string | null
          source: string | null
          status: string | null
          url: string | null
        }
        Relationships: []
      }
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
      line_moves: {
        Row: {
          avg_odds: number | null
          book_count: number | null
          game_date: string | null
          league: string | null
          line: number | null
          market: string | null
          minute_bucket: string | null
          player: string | null
          sport: string | null
          team1: string | null
          team2: string | null
        }
        Relationships: []
      }
      next_best_odds: {
        Row: {
          best_bookmaker: string | null
          best_odds: number | null
          edge_bps: number | null
          game_date: string | null
          league: string | null
          line: number | null
          market: string | null
          next_best_bookmaker: string | null
          next_best_odds: number | null
          player: string | null
          sport: string | null
          team1: string | null
          team2: string | null
        }
        Relationships: []
      }
      prop_consensus_odds_v: {
        Row: {
          book_count: number | null
          consensus_odds: number | null
          consensus_prob: number | null
          game_date: string | null
          line: number | null
          market: string | null
          player: string | null
        }
        Relationships: []
      }
      prop_latest_minute_v: {
        Row: {
          bookmaker: string | null
          event_key: string | null
          line: number | null
          market: string | null
          minute_bucket: string | null
          odds: number | null
          player: string | null
        }
        Relationships: []
      }
      user_clv: {
        Row: {
          bet_id: string | null
          bet_leg_id: string | null
          bet_status: Database["public"]["Enums"]["bet_status"] | null
          closing_bookmaker: string | null
          closing_decimal_odds: number | null
          clv_bps: number | null
          clv_tier: string | null
          game_date: string | null
          league: string | null
          market: string | null
          placed_decimal_odds: number | null
          selection: string | null
          settled_at: string | null
          sport: string | null
          team1: string | null
          team2: string | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cleanup_old_player_props: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      compute_prop_edges: {
        Args: Record<PropertyKey, never>
        Returns: {
          best_book: string
          best_odds: number
          book_count: number
          consensus_odds: number
          edge_percent: number
          event_id: string
          game_date: string
          league: string
          line: number
          market: string
          player: string
          side: string
          sport: string
          team1: string
          team2: string
        }[]
      }
      fn_consensus_prob_at: {
        Args: {
          anchor: string
          p_event_key: string
          p_line: number
          p_market: string
          p_player: string
        }
        Returns: {
          book_count: number
          consensus_prob: number
        }[]
      }
      fn_injury_candidates: {
        Args: { as_of?: string; top_n?: number }
        Returns: {
          bookmaker: string
          consensus_change_60m: number
          consensus_prob_60m: number
          consensus_prob_now: number
          game_date: string
          lag_prob: number
          line: number
          market: string
          odds: number
          pick_score: number
          player: string
          published_at: string
          status: string
        }[]
      }
      fn_momentum_surge: {
        Args: {
          as_of?: string
          lookback_mins_1?: number
          lookback_mins_2?: number
          top_n?: number
        }
        Returns: {
          book_change_15m: number
          book_count: number
          book_prob_15m: number
          book_prob_now: number
          bookmaker: string
          consensus_change_15m: number
          consensus_change_60m: number
          consensus_prob_15m: number
          consensus_prob_60m: number
          consensus_prob_now: number
          game_date: string
          lag_prob: number
          line: number
          market: string
          momentum_score: number
          odds_now: number
          player: string
        }[]
      }
      fn_value_hunter: {
        Args: { as_of?: string; top_n?: number }
        Returns: {
          best_book: string
          best_odds: number
          book_count: number
          consensus_odds: number
          edge_bps: number
          edge_prob: number
          game_date: string
          line: number
          market: string
          player: string
        }[]
      }
      get_closing_prices: {
        Args: {
          p_game_date: string
          p_league: string
          p_sport: string
          p_team1: string
          p_team2: string
        }
        Returns: {
          bookmaker: string
          captured_at: string
          decimal_odds: number
          line: number
          market: string
          selection: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_best_odds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_best_prop_odds: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_prop_momentum: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      upsert_strategy_content: {
        Args: {
          p_confidence: number
          p_content: Json
          p_expected_roi: string
          p_picks: Json
          p_strategy_id: string
          p_strategy_name: string
          p_timeframe: string
          p_valid_until: string
        }
        Returns: string
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
