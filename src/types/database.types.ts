export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "owner" | "cashier";
export type OrderType = "dine_in" | "take_away" | "delivery";
export type OrderChannel = "walk_in" | "gofood" | "grabfood" | "shopeefood" | "whatsapp" | "other";
export type OrderStatus = "held" | "completed" | "void";
export type PaymentMethod = "cash" | "qris" | "bank_transfer" | "ewallet" | "other";
export type DiscountType = "percent" | "fixed";
export type ShiftStatus = "open" | "closed";
export type StockMovementType = "purchase" | "sale" | "sale_void" | "adjustment" | "waste" | "opening";
export type CategoryType = "food" | "drink" | "other";
export type ModifierSelection = "single" | "multiple";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: UserRole;
          is_active: boolean;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: UserRole;
          is_active?: boolean;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      store_settings: {
        Row: {
          id: number;
          store_name: string;
          tagline: string | null;
          address: string | null;
          phone: string | null;
          logo_url: string | null;
          instagram: string | null;
          receipt_header: string | null;
          receipt_footer: string | null;
          receipt_paper_width: number;
          show_logo_on_receipt: boolean;
          tax_enabled: boolean;
          tax_percent: number;
          tax_inclusive: boolean;
          service_enabled: boolean;
          service_percent: number;
          rounding_unit: number;
          order_prefix: string;
          low_stock_default: number;
          require_owner_pin_for_void: boolean;
          owner_void_pin_hash: string | null;
          timezone: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          store_name?: string;
          tagline?: string | null;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          instagram?: string | null;
          receipt_header?: string | null;
          receipt_footer?: string | null;
          receipt_paper_width?: number;
          show_logo_on_receipt?: boolean;
          tax_enabled?: boolean;
          tax_percent?: number;
          tax_inclusive?: boolean;
          service_enabled?: boolean;
          service_percent?: number;
          rounding_unit?: number;
          order_prefix?: string;
          low_stock_default?: number;
          require_owner_pin_for_void?: boolean;
          owner_void_pin_hash?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          store_name?: string;
          tagline?: string | null;
          address?: string | null;
          phone?: string | null;
          logo_url?: string | null;
          instagram?: string | null;
          receipt_header?: string | null;
          receipt_footer?: string | null;
          receipt_paper_width?: number;
          show_logo_on_receipt?: boolean;
          tax_enabled?: boolean;
          tax_percent?: number;
          tax_inclusive?: boolean;
          service_enabled?: boolean;
          service_percent?: number;
          rounding_unit?: number;
          order_prefix?: string;
          low_stock_default?: number;
          require_owner_pin_for_void?: boolean;
          owner_void_pin_hash?: string | null;
          timezone?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: CategoryType;
          sort_order: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          type?: CategoryType;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: CategoryType;
          sort_order?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      products: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          sku: string | null;
          description: string | null;
          image_url: string | null;
          base_price: number;
          cost_price: number;
          track_stock: boolean;
          stock_qty: number;
          low_stock_threshold: number | null;
          is_available: boolean;
          is_active: boolean;
          is_favorite: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          sku?: string | null;
          description?: string | null;
          image_url?: string | null;
          base_price: number;
          cost_price?: number;
          track_stock?: boolean;
          stock_qty?: number;
          low_stock_threshold?: number | null;
          is_available?: boolean;
          is_active?: boolean;
          is_favorite?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          sku?: string | null;
          description?: string | null;
          image_url?: string | null;
          base_price?: number;
          cost_price?: number;
          track_stock?: boolean;
          stock_qty?: number;
          low_stock_threshold?: number | null;
          is_available?: boolean;
          is_active?: boolean;
          is_favorite?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          price: number;
          cost_price: number;
          sku: string | null;
          is_default: boolean;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          price: number;
          cost_price?: number;
          sku?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          name?: string;
          price?: number;
          cost_price?: number;
          sku?: string | null;
          is_default?: boolean;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      modifier_groups: {
        Row: {
          id: string;
          name: string;
          selection: ModifierSelection;
          is_required: boolean;
          min_select: number;
          max_select: number | null;
          sort_order: number;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          selection?: ModifierSelection;
          is_required?: boolean;
          min_select?: number;
          max_select?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          selection?: ModifierSelection;
          is_required?: boolean;
          min_select?: number;
          max_select?: number | null;
          sort_order?: number;
          is_active?: boolean;
        };
        Relationships: [];
      };
      modifiers: {
        Row: {
          id: string;
          group_id: string;
          name: string;
          price_delta: number;
          cost_delta: number;
          is_active: boolean;
          sort_order: number;
        };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          price_delta?: number;
          cost_delta?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Update: {
          id?: string;
          group_id?: string;
          name?: string;
          price_delta?: number;
          cost_delta?: number;
          is_active?: boolean;
          sort_order?: number;
        };
        Relationships: [];
      };
      product_modifier_groups: {
        Row: {
          product_id: string;
          group_id: string;
        };
        Insert: {
          product_id: string;
          group_id: string;
        };
        Update: {
          product_id?: string;
          group_id?: string;
        };
        Relationships: [];
      };
      ingredients: {
        Row: {
          id: string;
          name: string;
          unit: string;
          stock_qty: number;
          min_stock: number;
          cost_per_unit: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          unit: string;
          stock_qty?: number;
          min_stock?: number;
          cost_per_unit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          unit?: string;
          stock_qty?: number;
          min_stock?: number;
          cost_per_unit?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      recipes: {
        Row: {
          id: string;
          product_id: string;
          variant_id: string | null;
          ingredient_id: string;
          qty: number;
        };
        Insert: {
          id?: string;
          product_id: string;
          variant_id?: string | null;
          ingredient_id: string;
          qty: number;
        };
        Update: {
          id?: string;
          product_id?: string;
          variant_id?: string | null;
          ingredient_id?: string;
          qty?: number;
        };
        Relationships: [];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string | null;
          notes: string | null;
          total_spent: number;
          visit_count: number;
          last_visit_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone?: string | null;
          notes?: string | null;
          total_spent?: number;
          visit_count?: number;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string | null;
          notes?: string | null;
          total_spent?: number;
          visit_count?: number;
          last_visit_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      discounts: {
        Row: {
          id: string;
          name: string;
          code: string | null;
          type: DiscountType;
          value: number;
          max_discount: number | null;
          min_purchase: number;
          start_at: string | null;
          end_at: string | null;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code?: string | null;
          type: DiscountType;
          value: number;
          max_discount?: number | null;
          min_purchase?: number;
          start_at?: string | null;
          end_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string | null;
          type?: DiscountType;
          value?: number;
          max_discount?: number | null;
          min_purchase?: number;
          start_at?: string | null;
          end_at?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      shifts: {
        Row: {
          id: string;
          cashier_id: string;
          status: ShiftStatus;
          opened_at: string;
          closed_at: string | null;
          opening_cash: number;
          expected_cash: number | null;
          actual_cash: number | null;
          cash_difference: number | null;
          note: string | null;
        };
        Insert: {
          id?: string;
          cashier_id: string;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          opening_cash?: number;
          expected_cash?: number | null;
          actual_cash?: number | null;
          cash_difference?: number | null;
          note?: string | null;
        };
        Update: {
          id?: string;
          cashier_id?: string;
          status?: ShiftStatus;
          opened_at?: string;
          closed_at?: string | null;
          opening_cash?: number;
          expected_cash?: number | null;
          actual_cash?: number | null;
          cash_difference?: number | null;
          note?: string | null;
        };
        Relationships: [];
      };
      daily_counters: {
        Row: {
          counter_date: string;
          last_seq: number;
        };
        Insert: {
          counter_date: string;
          last_seq?: number;
        };
        Update: {
          counter_date?: string;
          last_seq?: number;
        };
        Relationships: [];
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          queue_no: number;
          shift_id: string | null;
          cashier_id: string;
          customer_id: string | null;
          customer_name: string | null;
          order_type: OrderType;
          channel: OrderChannel;
          table_no: string | null;
          status: OrderStatus;
          subtotal: number;
          discount_id: string | null;
          discount_amount: number;
          service_amount: number;
          tax_amount: number;
          rounding_amount: number;
          total: number;
          paid_amount: number;
          change_amount: number;
          total_cost: number;
          note: string | null;
          created_at: string;
          paid_at: string | null;
          voided_at: string | null;
          voided_by: string | null;
          void_reason: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no: string;
          queue_no: number;
          shift_id?: string | null;
          cashier_id: string;
          customer_id?: string | null;
          customer_name?: string | null;
          order_type?: OrderType;
          channel?: OrderChannel;
          table_no?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          discount_id?: string | null;
          discount_amount?: number;
          service_amount?: number;
          tax_amount?: number;
          rounding_amount?: number;
          total?: number;
          paid_amount?: number;
          change_amount?: number;
          total_cost?: number;
          note?: string | null;
          created_at?: string;
          paid_at?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          order_no?: string;
          queue_no?: number;
          shift_id?: string | null;
          cashier_id?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          order_type?: OrderType;
          channel?: OrderChannel;
          table_no?: string | null;
          status?: OrderStatus;
          subtotal?: number;
          discount_id?: string | null;
          discount_amount?: number;
          service_amount?: number;
          tax_amount?: number;
          rounding_amount?: number;
          total?: number;
          paid_amount?: number;
          change_amount?: number;
          total_cost?: number;
          note?: string | null;
          created_at?: string;
          paid_at?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
          void_reason?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          variant_id: string | null;
          product_name: string;
          variant_name: string | null;
          unit_price: number;
          unit_cost: number;
          qty: number;
          modifiers_total: number;
          line_total: number;
          note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name: string;
          variant_name?: string | null;
          unit_price: number;
          unit_cost?: number;
          qty: number;
          modifiers_total?: number;
          line_total: number;
          note?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          product_id?: string | null;
          variant_id?: string | null;
          product_name?: string;
          variant_name?: string | null;
          unit_price?: number;
          unit_cost?: number;
          qty?: number;
          modifiers_total?: number;
          line_total?: number;
          note?: string | null;
        };
        Relationships: [];
      };
      order_item_modifiers: {
        Row: {
          id: string;
          order_item_id: string;
          modifier_id: string | null;
          group_name: string | null;
          name: string;
          price_delta: number;
        };
        Insert: {
          id?: string;
          order_item_id: string;
          modifier_id?: string | null;
          group_name?: string | null;
          name: string;
          price_delta?: number;
        };
        Update: {
          id?: string;
          order_item_id?: string;
          modifier_id?: string | null;
          group_name?: string | null;
          name?: string;
          price_delta?: number;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          method: PaymentMethod;
          amount: number;
          reference_no: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          method: PaymentMethod;
          amount: number;
          reference_no?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          method?: PaymentMethod;
          amount?: number;
          reference_no?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      expenses: {
        Row: {
          id: string;
          shift_id: string | null;
          expense_date: string;
          category: string;
          description: string | null;
          amount: number;
          paid_from_drawer: boolean;
          receipt_url: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          shift_id?: string | null;
          expense_date?: string;
          category: string;
          description?: string | null;
          amount: number;
          paid_from_drawer?: boolean;
          receipt_url?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          shift_id?: string | null;
          expense_date?: string;
          category?: string;
          description?: string | null;
          amount?: number;
          paid_from_drawer?: boolean;
          receipt_url?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          product_id: string | null;
          ingredient_id: string | null;
          type: StockMovementType;
          qty_change: number;
          balance_after: number | null;
          order_id: string | null;
          unit_cost: number | null;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          product_id?: string | null;
          ingredient_id?: string | null;
          type: StockMovementType;
          qty_change: number;
          balance_after?: number | null;
          order_id?: string | null;
          unit_cost?: number | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          product_id?: string | null;
          ingredient_id?: string | null;
          type?: StockMovementType;
          qty_change?: number;
          balance_after?: number | null;
          order_id?: string | null;
          unit_cost?: number | null;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      audit_logs: {
        Row: {
          id: number;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          old_data: Json | null;
          new_data: Json | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          old_data?: Json | null;
          new_data?: Json | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      open_shift: {
        Args: {
          p_opening_cash: number;
        };
        Returns: string;
      };
      close_shift: {
        Args: {
          p_shift_id: string;
          p_actual_cash: number;
          p_note?: string;
        };
        Returns: Json;
      };
      set_owner_void_pin: {
        Args: {
          p_new_pin: string;
        };
        Returns: boolean;
      };
      verify_owner_void_pin: {
        Args: {
          p_pin: string;
        };
        Returns: boolean;
      };
      void_order: {
        Args: {
          p_order_id: string;
          p_reason: string;
          p_pin?: string | null;
        };
        Returns: Json;
      };
      get_sales_summary: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
      get_sales_by_day: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          sale_date: string;
          total_sales: number;
          order_count: number;
        }[];
      };
      get_sales_by_hour: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          sale_hour: number;
          total_sales: number;
          order_count: number;
        }[];
      };
      get_top_products: {
        Args: {
          p_start_date: string;
          p_end_date: string;
          p_limit?: number;
        };
        Returns: {
          product_id: string;
          product_name: string;
          total_qty: number;
          total_sales: number;
        }[];
      };
      get_sales_by_category: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          category_id: string;
          category_name: string;
          total_qty: number;
          total_sales: number;
        }[];
      };
      get_sales_by_payment_method: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          payment_method: string;
          total_amount: number;
          transaction_count: number;
        }[];
      };
      get_sales_by_cashier: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: {
          cashier_id: string;
          cashier_name: string;
          total_orders: number;
          total_sales: number;
          void_count: number;
        }[];
      };
      get_profit_loss: {
        Args: {
          p_start_date: string;
          p_end_date: string;
        };
        Returns: Json;
      };
    };
    Enums: {
      user_role: UserRole;
      order_type: OrderType;
      order_channel: OrderChannel;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      discount_type: DiscountType;
      shift_status: ShiftStatus;
      stock_movement_type: StockMovementType;
      category_type: CategoryType;
      modifier_selection: ModifierSelection;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
