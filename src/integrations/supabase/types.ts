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
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          actor_label: string | null
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_label?: string | null
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          enabled: boolean
          flag_key: string
          id: string
          metadata: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key: string
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          enabled?: boolean
          flag_key?: string
          id?: string
          metadata?: Json
          updated_at?: string
        }
        Relationships: []
      }
      game_configs: {
        Row: {
          config: Json
          created_at: string
          game_key: string
          house_edge: number
          id: string
          is_enabled: boolean
          max_bet: number
          min_bet: number
          name: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          game_key: string
          house_edge?: number
          id?: string
          is_enabled?: boolean
          max_bet?: number
          min_bet?: number
          name: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          game_key?: string
          house_edge?: number
          id?: string
          is_enabled?: boolean
          max_bet?: number
          min_bet?: number
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      payment_methods: {
        Row: {
          account_number: string
          created_at: string
          id: string
          instructions: string | null
          is_active: boolean
          kind: string
          label: string
          min_deposit: number
          min_withdraw: number
          supports_deposit: boolean
          supports_withdraw: boolean
          updated_at: string
        }
        Insert: {
          account_number: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind: string
          label: string
          min_deposit?: number
          min_withdraw?: number
          supports_deposit?: boolean
          supports_withdraw?: boolean
          updated_at?: string
        }
        Update: {
          account_number?: string
          created_at?: string
          id?: string
          instructions?: string | null
          is_active?: boolean
          kind?: string
          label?: string
          min_deposit?: number
          min_withdraw?: number
          supports_deposit?: boolean
          supports_withdraw?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          last_cashback_at: string | null
          last_daily_bonus_at: string | null
          last_weekly_bonus_at: string | null
          phone: string | null
          referral_code: string
          referred_by: string | null
          updated_at: string
          username: string | null
          vip_tier: Database["public"]["Enums"]["vip_tier"]
          wallet_balance: number
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          last_cashback_at?: string | null
          last_daily_bonus_at?: string | null
          last_weekly_bonus_at?: string | null
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          username?: string | null
          vip_tier?: Database["public"]["Enums"]["vip_tier"]
          wallet_balance?: number
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          last_cashback_at?: string | null
          last_daily_bonus_at?: string | null
          last_weekly_bonus_at?: string | null
          phone?: string | null
          referral_code?: string
          referred_by?: string | null
          updated_at?: string
          username?: string | null
          vip_tier?: Database["public"]["Enums"]["vip_tier"]
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          bonus_fixed: number
          bonus_pct: number
          code: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          max_bonus: number
          max_uses_per_user: number
          max_uses_total: number | null
          min_deposit: number
          name: string
          type: Database["public"]["Enums"]["promo_type"]
          updated_at: string
          valid_from: string | null
          valid_until: string | null
          wagering_multiplier: number
        }
        Insert: {
          bonus_fixed?: number
          bonus_pct?: number
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_bonus?: number
          max_uses_per_user?: number
          max_uses_total?: number | null
          min_deposit?: number
          name: string
          type?: Database["public"]["Enums"]["promo_type"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          wagering_multiplier?: number
        }
        Update: {
          bonus_fixed?: number
          bonus_pct?: number
          code?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          max_bonus?: number
          max_uses_per_user?: number
          max_uses_total?: number | null
          min_deposit?: number
          name?: string
          type?: Database["public"]["Enums"]["promo_type"]
          updated_at?: string
          valid_from?: string | null
          valid_until?: string | null
          wagering_multiplier?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          admin_note: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          game_id: string | null
          id: string
          payment_method_id: string | null
          receiver_account: string | null
          round_id: string | null
          sender_account: string | null
          status: Database["public"]["Enums"]["txn_status"]
          txn_reference: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at: string
          user_id: string
          user_note: string | null
        }
        Insert: {
          admin_note?: string | null
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          payment_method_id?: string | null
          receiver_account?: string | null
          round_id?: string | null
          sender_account?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          txn_reference?: string | null
          type: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id: string
          user_note?: string | null
        }
        Update: {
          admin_note?: string | null
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          game_id?: string | null
          id?: string
          payment_method_id?: string | null
          receiver_account?: string | null
          round_id?: string | null
          sender_account?: string | null
          status?: Database["public"]["Enums"]["txn_status"]
          txn_reference?: string | null
          type?: Database["public"]["Enums"]["txn_type"]
          updated_at?: string
          user_id?: string
          user_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_payment_method_id_fkey"
            columns: ["payment_method_id"]
            isOneToOne: false
            referencedRelation: "payment_methods"
            referencedColumns: ["id"]
          },
        ]
      }
      user_promotions: {
        Row: {
          activated_at: string
          completed_at: string | null
          created_at: string
          granted_amount: number
          id: string
          promotion_id: string
          source_txn_id: string | null
          status: Database["public"]["Enums"]["user_promo_status"]
          updated_at: string
          user_id: string
          wagering_progress: number
          wagering_required: number
        }
        Insert: {
          activated_at?: string
          completed_at?: string | null
          created_at?: string
          granted_amount?: number
          id?: string
          promotion_id: string
          source_txn_id?: string | null
          status?: Database["public"]["Enums"]["user_promo_status"]
          updated_at?: string
          user_id: string
          wagering_progress?: number
          wagering_required?: number
        }
        Update: {
          activated_at?: string
          completed_at?: string | null
          created_at?: string
          granted_amount?: number
          id?: string
          promotion_id?: string
          source_txn_id?: string | null
          status?: Database["public"]["Enums"]["user_promo_status"]
          updated_at?: string
          user_id?: string
          wagering_progress?: number
          wagering_required?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_promotions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vip_tier_configs: {
        Row: {
          cashback_pct: number
          created_at: string
          daily_bonus: number
          id: string
          max_deposit_amount: number
          max_withdraw_amount: number
          min_deposit_amount: number
          min_deposit_total: number
          min_withdraw_amount: number
          sort_order: number
          tier: string
          updated_at: string
          weekly_bonus: number
        }
        Insert: {
          cashback_pct?: number
          created_at?: string
          daily_bonus?: number
          id?: string
          max_deposit_amount?: number
          max_withdraw_amount?: number
          min_deposit_amount?: number
          min_deposit_total?: number
          min_withdraw_amount?: number
          sort_order?: number
          tier: string
          updated_at?: string
          weekly_bonus?: number
        }
        Update: {
          cashback_pct?: number
          created_at?: string
          daily_bonus?: number
          id?: string
          max_deposit_amount?: number
          max_withdraw_amount?: number
          min_deposit_amount?: number
          min_deposit_total?: number
          min_withdraw_amount?: number
          sort_order?: number
          tier?: string
          updated_at?: string
          weekly_bonus?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_promo_code: {
        Args: { _code: string }
        Returns: {
          granted_amount: number
          message: string
          user_promotion_id: string
          wagering_required: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      preview_daily_bonuses: {
        Args: never
        Returns: {
          amount: number
          tier: string
          user_id: string
        }[]
      }
      preview_daily_cashback: {
        Args: never
        Returns: {
          amount: number
          cashback_pct: number
          tier: string
          user_id: string
          yday_deposits: number
        }[]
      }
      preview_weekly_bonuses: {
        Args: never
        Returns: {
          amount: number
          tier: string
          user_id: string
        }[]
      }
      recompute_vip_tier: { Args: { _user_id: string }; Returns: undefined }
      record_audit: {
        Args: {
          _action: string
          _actor_id: string
          _actor_label: string
          _details: Json
          _target_id: string
          _target_type: string
        }
        Returns: string
      }
      run_daily_bonuses: {
        Args: never
        Returns: {
          credited_users: number
          total_amount: number
        }[]
      }
      run_daily_cashback: {
        Args: never
        Returns: {
          credited_users: number
          total_amount: number
        }[]
      }
      run_weekly_bonuses: {
        Args: never
        Returns: {
          credited_users: number
          total_amount: number
        }[]
      }
      wallet_mutate: {
        Args: {
          _amount: number
          _game_id?: string
          _note?: string
          _round_id?: string
          _type: Database["public"]["Enums"]["txn_type"]
        }
        Returns: {
          new_balance: number
          txn_id: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      promo_type: "deposit_bonus" | "free_credit" | "cashback"
      txn_status: "pending" | "approved" | "rejected" | "cancelled"
      txn_type:
        | "deposit"
        | "withdraw"
        | "bonus"
        | "cashback"
        | "bet"
        | "win"
        | "refund"
      user_promo_status: "active" | "completed" | "expired" | "cancelled"
      vip_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond"
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
      app_role: ["admin", "user"],
      promo_type: ["deposit_bonus", "free_credit", "cashback"],
      txn_status: ["pending", "approved", "rejected", "cancelled"],
      txn_type: [
        "deposit",
        "withdraw",
        "bonus",
        "cashback",
        "bet",
        "win",
        "refund",
      ],
      user_promo_status: ["active", "completed", "expired", "cancelled"],
      vip_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
    },
  },
} as const
