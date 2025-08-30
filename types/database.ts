export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: 'super_admin' | 'product_manager' | 'viewer';
          two_factor_enabled: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: 'super_admin' | 'product_manager' | 'viewer';
          two_factor_enabled?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: 'super_admin' | 'product_manager' | 'viewer';
          two_factor_enabled?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      gift_items: {
        Row: {
          id: string;
          sku: string;
          name: string;
          category: string;
          description: string | null;
          tags: Json | null;
          base_image_url: string;
          thumbnail_url: string | null;
          status: 'draft' | 'active' | 'archived';
          horizontal_enabled: boolean;
          vertical_enabled: boolean;
          all_over_enabled: boolean;
          created_by: string;
          updated_by: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          sku: string;
          name: string;
          category: string;
          description?: string | null;
          tags?: Json | null;
          base_image_url: string;
          thumbnail_url?: string | null;
          status?: 'draft' | 'active' | 'archived';
          horizontal_enabled?: boolean;
          vertical_enabled?: boolean;
          all_over_enabled?: boolean;
          created_by: string;
          updated_by?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          sku?: string;
          name?: string;
          category?: string;
          description?: string | null;
          tags?: Json | null;
          base_image_url?: string;
          thumbnail_url?: string | null;
          status?: 'draft' | 'active' | 'archived';
          horizontal_enabled?: boolean;
          vertical_enabled?: boolean;
          all_over_enabled?: boolean;
          created_by?: string;
          updated_by?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      placement_constraints: {
        Row: {
          id: string;
          item_id: string;
          placement_type: 'horizontal' | 'vertical' | 'all_over';
          constraint_image_url: string;
          detected_area_pixels: number | null;
          detected_area_percentage: number | null;
          min_logo_width: number | null;
          min_logo_height: number | null;
          max_logo_width: number | null;
          max_logo_height: number | null;
          default_x_position: number | null;
          default_y_position: number | null;
          guidelines_text: string | null;
          pattern_settings: Json | null;
          is_validated: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          placement_type: 'horizontal' | 'vertical' | 'all_over';
          constraint_image_url: string;
          detected_area_pixels?: number | null;
          detected_area_percentage?: number | null;
          min_logo_width?: number | null;
          min_logo_height?: number | null;
          max_logo_width?: number | null;
          max_logo_height?: number | null;
          default_x_position?: number | null;
          default_y_position?: number | null;
          guidelines_text?: string | null;
          pattern_settings?: Json | null;
          is_validated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          placement_type?: 'horizontal' | 'vertical' | 'all_over';
          constraint_image_url?: string;
          detected_area_pixels?: number | null;
          detected_area_percentage?: number | null;
          min_logo_width?: number | null;
          min_logo_height?: number | null;
          max_logo_width?: number | null;
          max_logo_height?: number | null;
          default_x_position?: number | null;
          default_y_position?: number | null;
          guidelines_text?: string | null;
          pattern_settings?: Json | null;
          is_validated?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      mockup_sessions: {
        Row: {
          id: string;
          session_id: string | null;
          item_id: string;
          template_id: string | null;
          original_logo_url: string;
          processed_logo_url: string | null;
          mockup_url: string | null;
          generation_params: Json | null;
          status: 'processing' | 'completed' | 'failed';
          created_at: string;
          expires_at: string | null;
        };
        Insert: {
          id?: string;
          session_id?: string | null;
          item_id: string;
          template_id?: string | null;
          original_logo_url: string;
          processed_logo_url?: string | null;
          mockup_url?: string | null;
          generation_params?: Json | null;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
          expires_at?: string | null;
        };
        Update: {
          id?: string;
          session_id?: string | null;
          item_id?: string;
          template_id?: string | null;
          original_logo_url?: string;
          processed_logo_url?: string | null;
          mockup_url?: string | null;
          generation_params?: Json | null;
          status?: 'processing' | 'completed' | 'failed';
          created_at?: string;
          expires_at?: string | null;
        };
      };
      audit_log: {
        Row: {
          id: string;
          admin_user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values: Json | null;
          new_values: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_user_id: string;
          action: string;
          entity_type: string;
          entity_id: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_user_id?: string;
          action?: string;
          entity_type?: string;
          entity_id?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      admin_role: 'super_admin' | 'product_manager' | 'viewer';
      item_status: 'draft' | 'active' | 'archived';
      placement_type: 'horizontal' | 'vertical' | 'all_over';
      session_status: 'processing' | 'completed' | 'failed';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
