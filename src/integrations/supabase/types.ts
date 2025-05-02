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
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          expires_at: string | null
          id: string
          identifications_granted: number
          is_active: boolean
          max_uses: number | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          identifications_granted: number
          is_active?: boolean
          max_uses?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          identifications_granted?: number
          is_active?: boolean
          max_uses?: number | null
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          id: string
          identifications_granted: number
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          id?: string
          identifications_granted: number
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          id?: string
          identifications_granted?: number
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupon_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_identifications: {
        Row: {
          created_at: string | null
          details: Json | null
          drug_name: string | null
          id: string
          image_url: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          drug_name?: string | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          drug_name?: string | null
          id?: string
          image_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      drugs: {
        Row: {
          brand_names: string[]
          category: string
          contraindications: string[]
          created_at: string | null
          description: string
          dosage_and_admin: string
          drug_class: string
          generic_name: string
          id: string
          image_url: string | null
          indications: string[]
          interactions: string[]
          manufacturer: string
          mechanism: string
          name: string
          package_image_url: string | null
          pregnancy: string
          prescription_status: string
          side_effects: string[]
          storage: string
          updated_at: string | null
          verified: boolean
          warnings: string[]
        }
        Insert: {
          brand_names?: string[]
          category: string
          contraindications?: string[]
          created_at?: string | null
          description: string
          dosage_and_admin: string
          drug_class: string
          generic_name: string
          id?: string
          image_url?: string | null
          indications?: string[]
          interactions?: string[]
          manufacturer: string
          mechanism: string
          name: string
          package_image_url?: string | null
          pregnancy: string
          prescription_status: string
          side_effects?: string[]
          storage: string
          updated_at?: string | null
          verified?: boolean
          warnings?: string[]
        }
        Update: {
          brand_names?: string[]
          category?: string
          contraindications?: string[]
          created_at?: string | null
          description?: string
          dosage_and_admin?: string
          drug_class?: string
          generic_name?: string
          id?: string
          image_url?: string | null
          indications?: string[]
          interactions?: string[]
          manufacturer?: string
          mechanism?: string
          name?: string
          package_image_url?: string | null
          pregnancy?: string
          prescription_status?: string
          side_effects?: string[]
          storage?: string
          updated_at?: string | null
          verified?: boolean
          warnings?: string[]
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string
          features: Json
          id: string
          monthly_identifications: number
          name: string
          price_inr: number
        }
        Insert: {
          created_at?: string
          description: string
          features: Json
          id?: string
          monthly_identifications: number
          name: string
          price_inr: number
        }
        Update: {
          created_at?: string
          description?: string
          features?: Json
          id?: string
          monthly_identifications?: number
          name?: string
          price_inr?: number
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          created_at: string
          id: string
          identifications_used: number
          plan_id: string
          razorpay_subscription_id: string | null
          status: string
          subscription_end: string
          subscription_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          identifications_used?: number
          plan_id: string
          razorpay_subscription_id?: string | null
          status: string
          subscription_end: string
          subscription_start?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          identifications_used?: number
          plan_id?: string
          razorpay_subscription_id?: string | null
          status?: string
          subscription_end?: string
          subscription_start?: string
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
