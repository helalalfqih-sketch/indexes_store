export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null;
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean;
          name: string;
          parent_id: string | null;
          slug: string;
          sort: number;
          tenant_id: string;
          updated_at: string;
        };
        Insert: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name: string;
          parent_id?: string | null;
          slug: string;
          sort?: number;
          tenant_id: string;
          updated_at?: string;
        };
        Update: {
          color?: string | null;
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          sort?: number;
          tenant_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_movements: {
        Row: {
          created_at: string;
          created_by: string | null;
          delta: number;
          id: string;
          note: string | null;
          product_id: string;
          reason: string;
          reference: string | null;
          tenant_id: string;
        };
        Insert: {
          created_at?: string;
          created_by?: string | null;
          delta: number;
          id?: string;
          note?: string | null;
          product_id: string;
          reason: string;
          reference?: string | null;
          tenant_id: string;
        };
        Update: {
          created_at?: string;
          created_by?: string | null;
          delta?: number;
          id?: string;
          note?: string | null;
          product_id?: string;
          reason?: string;
          reference?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_movements_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          availability: string | null;
          badge: string | null;
          barcode: string | null;
          brand: string | null;
          category_id: string | null;
          compare_at_price: number | null;
          condition: string | null;
          cost_price: number | null;
          created_at: string;
          currency: string;
          description: string;
          external_id: string | null;
          id: string;
          images: string[];
          is_published: boolean;
          meta_sync_status: string | null;
          model_3d_status: string | null;
          model_3d_thumbnail: string | null;
          model_3d_url: string | null;
          model_url: string | null;
          name: string;
          old_price: number | null;
          price: number;
          rating: number;
          reserved_stock: number;
          reviews_count: number;
          slug: string;
          sku: string | null;
          source_url: string | null;
          stock: number;
          tags: string[];
          tenant_id: string;
          updated_at: string;
          video_playback_id: string | null;
        };
        Insert: {
          availability?: string | null;
          badge?: string | null;
          barcode?: string | null;
          brand?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string;
          currency?: string;
          description?: string;
          external_id?: string | null;
          id?: string;
          images?: string[];
          is_published?: boolean;
          meta_sync_status?: string | null;
          model_3d_status?: string | null;
          model_3d_thumbnail?: string | null;
          model_3d_url?: string | null;
          model_url?: string | null;
          name: string;
          old_price?: number | null;
          price: number;
          rating?: number;
          reserved_stock?: number;
          reviews_count?: number;
          slug: string;
          sku?: string | null;
          source_url?: string | null;
          stock?: number;
          tags?: string[];
          tenant_id: string;
          updated_at?: string;
          video_playback_id?: string | null;
        };
        Update: {
          availability?: string | null;
          badge?: string | null;
          barcode?: string | null;
          brand?: string | null;
          category_id?: string | null;
          compare_at_price?: number | null;
          condition?: string | null;
          cost_price?: number | null;
          created_at?: string;
          currency?: string;
          description?: string;
          external_id?: string | null;
          id?: string;
          images?: string[];
          is_published?: boolean;
          meta_sync_status?: string | null;
          model_3d_status?: string | null;
          model_3d_thumbnail?: string | null;
          model_3d_url?: string | null;
          model_url?: string | null;
          name?: string;
          old_price?: number | null;
          price?: number;
          rating?: number;
          reserved_stock?: number;
          reviews_count?: number;
          slug?: string;
          sku?: string | null;
          source_url?: string | null;
          stock?: number;
          tags?: string[];
          tenant_id?: string;
          updated_at?: string;
          video_playback_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "products_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          full_name: string | null;
          id: string;
          phone: string | null;
          preferred_lang: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id: string;
          phone?: string | null;
          preferred_lang?: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          full_name?: string | null;
          id?: string;
          phone?: string | null;
          preferred_lang?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      tenant_members: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["tenant_role"];
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "tenant_members_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      tenants: {
        Row: {
          created_at: string;
          features: Json;
          id: string;
          name: string;
          owner_user_id: string | null;
          plan: Database["public"]["Enums"]["tenant_plan"];
          settings: Json;
          slug: string;
          status: Database["public"]["Enums"]["tenant_status"];
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          features?: Json;
          id?: string;
          name: string;
          owner_user_id?: string | null;
          plan?: Database["public"]["Enums"]["tenant_plan"];
          settings?: Json;
          slug: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          features?: Json;
          id?: string;
          name?: string;
          owner_user_id?: string | null;
          plan?: Database["public"]["Enums"]["tenant_plan"];
          settings?: Json;
          slug?: string;
          status?: Database["public"]["Enums"]["tenant_status"];
          updated_at?: string;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          customer_name: string | null;
          customer_phone: string | null;
          customer_address: string | null;
          customer_email: string | null;
          notes: string | null;
          status: Database["public"]["Enums"]["order_status"];
          payment_status: Database["public"]["Enums"]["payment_status"];
          payment_provider: string | null;
          total: number;
          currency: string;
          coupon_code: string | null;
          discount_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          customer_email?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_provider?: string | null;
          total: number;
          currency?: string;
          coupon_code?: string | null;
          discount_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          customer_name?: string | null;
          customer_phone?: string | null;
          customer_address?: string | null;
          customer_email?: string | null;
          notes?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          payment_status?: Database["public"]["Enums"]["payment_status"];
          payment_provider?: string | null;
          total?: number;
          currency?: string;
          coupon_code?: string | null;
          discount_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "orders_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          product_name_snapshot: string;
          product_sku_snapshot: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          product_name_snapshot: string;
          product_sku_snapshot?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          tenant_id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          total_price?: number;
          product_name_snapshot?: string;
          product_sku_snapshot?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          tenant_id: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          changed_by: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          tenant_id: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          tenant_id?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status?: Database["public"]["Enums"]["order_status"];
          changed_by?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_history_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_status_history_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      meta_sync_logs: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string | null;
          channel: string;
          action: string;
          status: string;
          error_message: string | null;
          payload: Json | null;
          created_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id?: string | null;
          channel: string;
          action: string;
          status: string;
          error_message?: string | null;
          payload?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string | null;
          channel?: string;
          action?: string;
          status?: string;
          error_message?: string | null;
          payload?: Json | null;
          created_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "meta_sync_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "meta_sync_logs_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
      branches: {
        Row: {
          id: string;
          tenant_id: string;
          name: string;
          slug: string;
          address: string | null;
          city: string | null;
          country: string;
          phone: string | null;
          email: string | null;
          latitude: number | null;
          longitude: number | null;
          is_main_branch: boolean;
          is_active: boolean;
          opening_hours: Json;
          manager_name: string | null;
          manager_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          name: string;
          slug: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_main_branch?: boolean;
          is_active?: boolean;
          opening_hours?: Json;
          manager_name?: string | null;
          manager_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          name?: string;
          slug?: string;
          address?: string | null;
          city?: string | null;
          country?: string;
          phone?: string | null;
          email?: string | null;
          latitude?: number | null;
          longitude?: number | null;
          is_main_branch?: boolean;
          is_active?: boolean;
          opening_hours?: Json;
          manager_name?: string | null;
          manager_phone?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          user_id: string | null;
          order_id: string | null;
          rating: number;
          title: string | null;
          content: string | null;
          is_verified_purchase: boolean;
          is_approved: boolean;
          helpful_count: number;
          images: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id: string;
          user_id?: string | null;
          order_id?: string | null;
          rating: number;
          title?: string | null;
          content?: string | null;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          user_id?: string | null;
          order_id?: string | null;
          rating?: number;
          title?: string | null;
          content?: string | null;
          is_verified_purchase?: boolean;
          is_approved?: boolean;
          helpful_count?: number;
          images?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reviews_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reviews_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      notifications: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          data: Json;
          is_read: boolean;
          read_at: string | null;
          action_url: string | null;
          image_url: string | null;
          priority: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id?: string | null;
          type: Database["public"]["Enums"]["notification_type"];
          title: string;
          message: string;
          data?: Json;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          image_url?: string | null;
          priority?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string | null;
          type?: Database["public"]["Enums"]["notification_type"];
          title?: string;
          message?: string;
          data?: Json;
          is_read?: boolean;
          read_at?: string | null;
          action_url?: string | null;
          image_url?: string | null;
          priority?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      sales_analytics: {
        Row: {
          id: string;
          tenant_id: string;
          product_id: string;
          branch_id: string | null;
          order_id: string | null;
          quantity_sold: number;
          revenue: number;
          cost: number;
          profit: number;
          sale_date: string;
          hour_of_day: number | null;
          day_of_week: number | null;
          customer_type: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          product_id: string;
          branch_id?: string | null;
          order_id?: string | null;
          quantity_sold?: number;
          revenue?: number;
          cost?: number;
          profit?: number;
          sale_date?: string;
          hour_of_day?: number | null;
          day_of_week?: number | null;
          customer_type?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          product_id?: string;
          branch_id?: string | null;
          order_id?: string | null;
          quantity_sold?: number;
          revenue?: number;
          cost?: number;
          profit?: number;
          sale_date?: string;
          hour_of_day?: number | null;
          day_of_week?: number | null;
          customer_type?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "sales_analytics_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_analytics_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_analytics_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sales_analytics_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_configs: {
        Row: {
          id: string;
          tenant_id: string;
          branch_id: string | null;
          phone_number: string;
          display_name: string | null;
          business_id: string | null;
          api_token: string | null;
          webhook_url: string | null;
          is_active: boolean;
          auto_reply: boolean;
          welcome_message: string | null;
          order_template: string | null;
          notify_on_order: boolean;
          notify_on_status: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          branch_id?: string | null;
          phone_number: string;
          display_name?: string | null;
          business_id?: string | null;
          api_token?: string | null;
          webhook_url?: string | null;
          is_active?: boolean;
          auto_reply?: boolean;
          welcome_message?: string | null;
          order_template?: string | null;
          notify_on_order?: boolean;
          notify_on_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          branch_id?: string | null;
          phone_number?: string;
          display_name?: string | null;
          business_id?: string | null;
          api_token?: string | null;
          webhook_url?: string | null;
          is_active?: boolean;
          auto_reply?: boolean;
          welcome_message?: string | null;
          order_template?: string | null;
          notify_on_order?: boolean;
          notify_on_status?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_configs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_configs_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      whatsapp_messages: {
        Row: {
          id: string;
          tenant_id: string;
          config_id: string | null;
          order_id: string | null;
          customer_phone: string;
          message_type: string;
          message_content: string;
          template_name: string | null;
          template_params: Json;
          status: string;
          wa_message_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          read_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          config_id?: string | null;
          order_id?: string | null;
          customer_phone: string;
          message_type?: string;
          message_content: string;
          template_name?: string | null;
          template_params?: Json;
          status?: string;
          wa_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          config_id?: string | null;
          order_id?: string | null;
          customer_phone?: string;
          message_type?: string;
          message_content?: string;
          template_name?: string | null;
          template_params?: Json;
          status?: string;
          wa_message_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_config_id_fkey";
            columns: ["config_id"];
            isOneToOne: false;
            referencedRelation: "whatsapp_configs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "whatsapp_messages_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      product_comparisons: {
        Row: {
          id: string;
          tenant_id: string;
          user_id: string;
          product_ids: string[];
          name: string | null;
          is_saved: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          tenant_id: string;
          user_id: string;
          product_ids: string[];
          name?: string | null;
          is_saved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string;
          user_id?: string;
          product_ids?: string[];
          name?: string | null;
          is_saved?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "product_comparisons_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_comparisons_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      can_manage_tenant: {
        Args: { _tenant_id: string; _user_id: string };
        Returns: boolean;
      };
      create_order_transaction: {
        Args: {
          _tenant_id: string;
          _customer_name: string | null;
          _customer_phone: string | null;
          _customer_address: string | null;
          _customer_email: string | null;
          _notes: string | null;
          _payment_provider: string | null;
          _coupon_code: string | null;
          _discount_amount: number | null;
          _items: string;
        };
        Returns: Json;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      has_tenant_permission: {
        Args: {
          _tenant_id: string;
          _user_id: string;
          _required_role: Database["public"]["Enums"]["tenant_role"];
        };
        Returns: boolean;
      };
      has_tenant_role: {
        Args: {
          _role: Database["public"]["Enums"]["tenant_role"];
          _tenant_id: string;
          _user_id: string;
        };
        Returns: boolean;
      };
      is_tenant_member: {
        Args: { _tenant_id: string; _user_id: string };
        Returns: boolean;
      };
      increment_review_helpful: {
        Args: { _review_id: string };
        Returns: void;
      };
    };
    Enums: {
      app_role: "admin" | "customer";
      order_status:
        "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
      payment_status: "pending" | "paid" | "failed" | "refunded" | "cod";
      tenant_plan: "free" | "pro" | "enterprise";
      tenant_role: "owner" | "staff" | "viewer";
      tenant_status: "active" | "suspended" | "pending";
      notification_type:
        | "order_new"
        | "order_status"
        | "order_cancelled"
        | "review_new"
        | "review_reply"
        | "inventory_low"
        | "inventory_out"
        | "product_published"
        | "product_updated"
        | "system"
        | "promotion"
        | "whatsapp_message";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "customer"],
      tenant_plan: ["free", "pro", "enterprise"],
      tenant_role: ["owner", "staff", "viewer"],
      tenant_status: ["active", "suspended", "pending"],
      notification_type: [
        "order_new",
        "order_status",
        "order_cancelled",
        "review_new",
        "review_reply",
        "inventory_low",
        "inventory_out",
        "product_published",
        "product_updated",
        "system",
        "promotion",
        "whatsapp_message",
      ],
    },
  },
} as const;
