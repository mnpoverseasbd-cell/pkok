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
      transactions: {
        Row: {
          admin_note: string | null
          amount: number
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          payment_method_id: string | null
          receiver_account: string | null
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
          id?: string
          payment_method_id?: string | null
          receiver_account?: string | null
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
          id?: string
          payment_method_id?: string | null
          receiver_account?: string | null
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      recompute_vip_tier: { Args: { _user_id: string }; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "user"
      txn_status: "pending" | "approved" | "rejected" | "cancelled"
      txn_type: "deposit" | "withdraw" | "bonus"
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
      txn_status: ["pending", "approved", "rejected", "cancelled"],
      txn_type: ["deposit", "withdraw", "bonus"],
      vip_tier: ["bronze", "silver", "gold", "platinum", "diamond"],
    },
  },
} as const
