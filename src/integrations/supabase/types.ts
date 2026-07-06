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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      boarding_signups: {
        Row: {
          addon_bedding: boolean
          addon_blanketing: boolean
          addon_grooming: boolean
          addon_hay: boolean
          addon_pasture_feeding: boolean
          addon_training: boolean
          address: string | null
          admin_notes: string | null
          created_at: string
          email: string
          emergency_authorize: boolean
          emergency_limit: string | null
          feed_plan: string
          full_name: string
          horse_age: string | null
          horse_breed: string | null
          horse_color: string | null
          horse_name: string
          horse_sex: string
          id: string
          monthly_amount: number
          phone: string | null
          status: string
          tier: string
          updated_at: string
          user_id: string | null
          vet_name: string | null
          vet_phone: string | null
        }
        Insert: {
          addon_bedding?: boolean
          addon_blanketing?: boolean
          addon_grooming?: boolean
          addon_hay?: boolean
          addon_pasture_feeding?: boolean
          addon_training?: boolean
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email: string
          emergency_authorize?: boolean
          emergency_limit?: string | null
          feed_plan: string
          full_name: string
          horse_age?: string | null
          horse_breed?: string | null
          horse_color?: string | null
          horse_name: string
          horse_sex: string
          id?: string
          monthly_amount: number
          phone?: string | null
          status?: string
          tier: string
          updated_at?: string
          user_id?: string | null
          vet_name?: string | null
          vet_phone?: string | null
        }
        Update: {
          addon_bedding?: boolean
          addon_blanketing?: boolean
          addon_grooming?: boolean
          addon_hay?: boolean
          addon_pasture_feeding?: boolean
          addon_training?: boolean
          address?: string | null
          admin_notes?: string | null
          created_at?: string
          email?: string
          emergency_authorize?: boolean
          emergency_limit?: string | null
          feed_plan?: string
          full_name?: string
          horse_age?: string | null
          horse_breed?: string | null
          horse_color?: string | null
          horse_name?: string
          horse_sex?: string
          id?: string
          monthly_amount?: number
          phone?: string | null
          status?: string
          tier?: string
          updated_at?: string
          user_id?: string | null
          vet_name?: string | null
          vet_phone?: string | null
        }
        Relationships: []
      }
      client_documents: {
        Row: {
          created_at: string
          document_type: string
          docusign_status: string | null
          envelope_id: string | null
          expires_at: string | null
          id: string
          notes: string | null
          pdf_url: string | null
          recipient_email: string | null
          sent_at: string | null
          sign_token: string | null
          signature_data: string | null
          signed_at: string | null
          signing_url: string | null
          status: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          document_type: string
          docusign_status?: string | null
          envelope_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          sign_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signing_url?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          document_type?: string
          docusign_status?: string | null
          envelope_id?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          pdf_url?: string | null
          recipient_email?: string | null
          sent_at?: string | null
          sign_token?: string | null
          signature_data?: string | null
          signed_at?: string | null
          signing_url?: string | null
          status?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_group_members: {
        Row: {
          contact_id: string
          created_at: string
          group_id: string
          id: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          group_id: string
          id?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          group_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          company: string | null
          created_at: string
          created_by: string
          email: string
          id: string
          name: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          created_by: string
          email: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          company?: string | null
          created_at?: string
          created_by?: string
          email?: string
          id?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      docusign_tokens: {
        Row: {
          access_token: string
          account_id: string | null
          base_uri: string | null
          created_at: string | null
          expires_at: string
          id: string
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          account_id?: string | null
          base_uri?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          account_id?: string | null
          base_uri?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_account_access: {
        Row: {
          can_delete: boolean
          can_read: boolean
          can_send: boolean
          created_at: string
          email_account_id: string
          id: string
          user_id: string
        }
        Insert: {
          can_delete?: boolean
          can_read?: boolean
          can_send?: boolean
          created_at?: string
          email_account_id: string
          id?: string
          user_id: string
        }
        Update: {
          can_delete?: boolean
          can_read?: boolean
          can_send?: boolean
          created_at?: string
          email_account_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_account_access_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      email_accounts: {
        Row: {
          created_at: string
          display_name: string
          email_address: string
          id: string
          imap_host: string
          imap_port: number
          is_shared: boolean
          password: string
          smtp_host: string
          smtp_port: number
          updated_at: string
          username: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email_address: string
          id?: string
          imap_host?: string
          imap_port?: number
          is_shared?: boolean
          password: string
          smtp_host?: string
          smtp_port?: number
          updated_at?: string
          username: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email_address?: string
          id?: string
          imap_host?: string
          imap_port?: number
          is_shared?: boolean
          password?: string
          smtp_host?: string
          smtp_port?: number
          updated_at?: string
          username?: string
        }
        Relationships: []
      }
      email_signatures: {
        Row: {
          created_at: string
          email_account_id: string | null
          id: string
          is_default: boolean
          name: string
          signature_html: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_account_id?: string | null
          id?: string
          is_default?: boolean
          name?: string
          signature_html?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_account_id?: string | null
          id?: string
          is_default?: boolean
          name?: string
          signature_html?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_signatures_email_account_id_fkey"
            columns: ["email_account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      horse_care_logs: {
        Row: {
          created_at: string
          description: string | null
          id: string
          incident_type: string
          logged_by: string
          photo_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          logged_by: string
          photo_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          incident_type?: string
          logged_by?: string
          photo_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      horse_use_logs: {
        Row: {
          activity_type: string
          created_at: string
          duration_minutes: number | null
          horse_name: string
          id: string
          logged_by: string
          notes: string | null
          ride_date: string
          rider_id: string | null
          rider_name: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          horse_name: string
          id?: string
          logged_by: string
          notes?: string | null
          ride_date?: string
          rider_id?: string | null
          rider_name: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          duration_minutes?: number | null
          horse_name?: string
          id?: string
          logged_by?: string
          notes?: string | null
          ride_date?: string
          rider_id?: string | null
          rider_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "horse_use_logs_rider_id_fkey"
            columns: ["rider_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_bookings: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          slot_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          slot_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          slot_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_bookings_slot_id_fkey"
            columns: ["slot_id"]
            isOneToOne: false
            referencedRelation: "lesson_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_signups: {
        Row: {
          admin_notes: string | null
          age: number | null
          created_at: string
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          experience_level: string
          full_name: string
          goals: string | null
          horse_preference: string
          id: string
          own_horse_name: string | null
          phone: string | null
          preferred_days: string[] | null
          preferred_time: string | null
          special_needs: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          age?: number | null
          created_at?: string
          email: string
          emergency_contact_name: string
          emergency_contact_phone: string
          experience_level?: string
          full_name: string
          goals?: string | null
          horse_preference?: string
          id?: string
          own_horse_name?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_time?: string | null
          special_needs?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          age?: number | null
          created_at?: string
          email?: string
          emergency_contact_name?: string
          emergency_contact_phone?: string
          experience_level?: string
          full_name?: string
          goals?: string | null
          horse_preference?: string
          id?: string
          own_horse_name?: string | null
          phone?: string | null
          preferred_days?: string[] | null
          preferred_time?: string | null
          special_needs?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      lesson_slots: {
        Row: {
          created_at: string
          created_by: string | null
          end_time: string
          id: string
          is_recurring: boolean
          max_capacity: number
          notes: string | null
          recurring_day_of_week: number | null
          slot_date: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          end_time: string
          id?: string
          is_recurring?: boolean
          max_capacity?: number
          notes?: string | null
          recurring_day_of_week?: number | null
          slot_date: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          end_time?: string
          id?: string
          is_recurring?: boolean
          max_capacity?: number
          notes?: string | null
          recurring_day_of_week?: number | null
          slot_date?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      mailing_list_subscribers: {
        Row: {
          email: string
          id: string
          list_id: string
          name: string | null
          subscribed: boolean
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          list_id: string
          name?: string | null
          subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          list_id?: string
          name?: string | null
          subscribed?: boolean
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mailing_list_subscribers_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "mailing_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      mailing_lists: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          full_name: string | null
          id: string
          is_boarder: boolean
          phone: string | null
          preferred_farrier_name: string | null
          preferred_farrier_phone: string | null
          preferred_vet_name: string | null
          preferred_vet_phone: string | null
          secondary_emergency_contact_name: string | null
          secondary_emergency_contact_phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          is_boarder?: boolean
          phone?: string | null
          preferred_farrier_name?: string | null
          preferred_farrier_phone?: string | null
          preferred_vet_name?: string | null
          preferred_vet_phone?: string | null
          secondary_emergency_contact_name?: string | null
          secondary_emergency_contact_phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          full_name?: string | null
          id?: string
          is_boarder?: boolean
          phone?: string | null
          preferred_farrier_name?: string | null
          preferred_farrier_phone?: string | null
          preferred_vet_name?: string | null
          preferred_vet_phone?: string | null
          secondary_emergency_contact_name?: string | null
          secondary_emergency_contact_phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_emails: {
        Row: {
          account_id: string | null
          bcc_addresses: string[] | null
          body: string
          cc_addresses: string[] | null
          created_at: string
          created_by: string
          error: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          signature: string | null
          status: string
          subject: string
          to_addresses: string[]
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          bcc_addresses?: string[] | null
          body: string
          cc_addresses?: string[] | null
          created_at?: string
          created_by: string
          error?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          signature?: string | null
          status?: string
          subject: string
          to_addresses: string[]
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          bcc_addresses?: string[] | null
          body?: string
          cc_addresses?: string[] | null
          created_at?: string
          created_by?: string
          error?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          signature?: string | null
          status?: string
          subject?: string
          to_addresses?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_emails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "email_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_alert_recipients: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      supply_inventory: {
        Row: {
          category: string
          created_at: string
          id: string
          image_url: string | null
          last_restocked_at: string | null
          low_stock_notified_at: string | null
          low_threshold: number | null
          notes: string | null
          quantity: number
          supply_name: string
          unit: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_restocked_at?: string | null
          low_stock_notified_at?: string | null
          low_threshold?: number | null
          notes?: string | null
          quantity?: number
          supply_name: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          image_url?: string | null
          last_restocked_at?: string | null
          low_stock_notified_at?: string | null
          low_threshold?: number | null
          notes?: string | null
          quantity?: number
          supply_name?: string
          unit?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      supply_log: {
        Row: {
          change_amount: number
          change_type: string
          created_at: string
          id: string
          logged_by: string
          notes: string | null
          supply_id: string
        }
        Insert: {
          change_amount: number
          change_type?: string
          created_at?: string
          id?: string
          logged_by: string
          notes?: string | null
          supply_id: string
        }
        Update: {
          change_amount?: number
          change_type?: string
          created_at?: string
          id?: string
          logged_by?: string
          notes?: string | null
          supply_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_log_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      supply_receipts: {
        Row: {
          amount: number
          category: string
          created_at: string
          id: string
          notes: string | null
          purchase_date: string
          quantity: number | null
          receipt_image_url: string | null
          supply_id: string | null
          unit: string | null
          updated_at: string
          uploaded_by: string
          vendor: string
        }
        Insert: {
          amount: number
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          quantity?: number | null
          receipt_image_url?: string | null
          supply_id?: string | null
          unit?: string | null
          updated_at?: string
          uploaded_by: string
          vendor: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          id?: string
          notes?: string | null
          purchase_date?: string
          quantity?: number | null
          receipt_image_url?: string | null
          supply_id?: string | null
          unit?: string | null
          updated_at?: string
          uploaded_by?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "supply_receipts_supply_id_fkey"
            columns: ["supply_id"]
            isOneToOne: false
            referencedRelation: "supply_inventory"
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
    }
    Enums: {
      app_role: "admin" | "user" | "super_admin"
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
      app_role: ["admin", "user", "super_admin"],
    },
  },
} as const
