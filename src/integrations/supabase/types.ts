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
      listings: {
        Row: {
          category: string
          condition: Database["public"]["Enums"]["listing_condition"]
          created_at: string
          currency: string
          description: string
          id: string
          image_urls: string[]
          original_price_cents: number | null
          price_cents: number
          shipping_cents: number
          slug: string
          status: Database["public"]["Enums"]["listing_status"]
          stock: number
          store_id: string
          tags: string[]
          title: string
          updated_at: string
          weight_oz: number
        }
        Insert: {
          category: string
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_urls?: string[]
          original_price_cents?: number | null
          price_cents: number
          shipping_cents?: number
          slug: string
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id: string
          tags?: string[]
          title: string
          updated_at?: string
          weight_oz?: number
        }
        Update: {
          category?: string
          condition?: Database["public"]["Enums"]["listing_condition"]
          created_at?: string
          currency?: string
          description?: string
          id?: string
          image_urls?: string[]
          original_price_cents?: number | null
          price_cents?: number
          shipping_cents?: number
          slug?: string
          status?: Database["public"]["Enums"]["listing_status"]
          stock?: number
          store_id?: string
          tags?: string[]
          title?: string
          updated_at?: string
          weight_oz?: number
        }
        Relationships: [
          {
            foreignKeyName: "listings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          listing_id: string
          order_id: string
          quantity: number
          title: string
          unit_price_cents: number
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          listing_id: string
          order_id: string
          quantity: number
          title: string
          unit_price_cents: number
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          listing_id?: string
          order_id?: string
          quantity?: number
          title?: string
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_email: string | null
          buyer_id: string
          created_at: string
          currency: string
          id: string
          platform_fee_cents: number
          seller_payout_cents: number
          shipping_address: Json | null
          shipping_cents: number
          shipping_name: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          subtotal_cents: number
          total_cents: number
          updated_at: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_id: string
          created_at?: string
          currency?: string
          id?: string
          platform_fee_cents: number
          seller_payout_cents: number
          shipping_address?: Json | null
          shipping_cents?: number
          shipping_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents: number
          total_cents: number
          updated_at?: string
        }
        Update: {
          buyer_email?: string | null
          buyer_id?: string
          created_at?: string
          currency?: string
          id?: string
          platform_fee_cents?: number
          seller_payout_cents?: number
          shipping_address?: Json | null
          shipping_cents?: number
          shipping_name?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          subtotal_cents?: number
          total_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      stores: {
        Row: {
          banner_url: string | null
          bio: string | null
          created_at: string
          handle: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          handle: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          bio?: string | null
          created_at?: string
          handle?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean
          updated_at?: string
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
      listing_condition: "new" | "like_new" | "good" | "vintage"
      listing_status: "draft" | "active" | "sold" | "archived"
      order_status: "pending" | "paid" | "fulfilled" | "cancelled" | "refunded"
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
      listing_condition: ["new", "like_new", "good", "vintage"],
      listing_status: ["draft", "active", "sold", "archived"],
      order_status: ["pending", "paid", "fulfilled", "cancelled", "refunded"],
    },
  },
} as const
