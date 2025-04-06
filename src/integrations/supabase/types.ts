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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
