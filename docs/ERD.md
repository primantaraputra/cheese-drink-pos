# ENTITY RELATIONSHIP DIAGRAM (ERD) — CHEESE DRINK POS

Dokumen ini memvisualisasikan seluruh skema basis data PostgreSQL Supabase yang digunakan oleh aplikasi kasir **Cheese Drink POS**.

---

## 1. Diagram Konseptual & Relasi (Mermaid)

```mermaid
erDiagram
    PROFILES ||--o{ SHIFTS : "buka_tutup"
    PROFILES ||--o{ ORDERS : "melayani"
    PROFILES ||--o{ EXPENSES : "mencatat"
    PROFILES ||--o{ STOCK_MOVEMENTS : "mencatat"
    PROFILES ||--o{ AUDIT_LOGS : "pelaku"

    CATEGORIES ||--o{ PRODUCTS : "mengelompokkan"
    PRODUCTS ||--o{ PRODUCT_VARIANTS : "memiliki"
    PRODUCTS ||--o{ PRODUCT_MODIFIER_GROUPS : "dihubungkan"
    MODIFIER_GROUPS ||--o{ PRODUCT_MODIFIER_GROUPS : "dihubungkan"
    MODIFIER_GROUPS ||--o{ MODIFIERS : "berisi"

    PRODUCTS ||--o{ RECIPES : "memiliki"
    INGREDIENTS ||--o{ RECIPES : "bahan_resep"

    CUSTOMERS ||--o{ ORDERS : "melakukan"
    DISCOUNTS ||--o{ ORDERS : "menerapkan"
    SHIFTS ||--o{ ORDERS : "mencakup"
    SHIFTS ||--o{ EXPENSES : "memotong_laci"

    ORDERS ||--|{ ORDER_ITEMS : "berisi"
    ORDER_ITEMS ||--o{ ORDER_ITEM_MODIFIERS : "memiliki"
    ORDERS ||--|{ PAYMENTS : "dibayar_lewat"

    PRODUCTS ||--o{ STOCK_MOVEMENTS : "mutasi"
    INGREDIENTS ||--o{ STOCK_MOVEMENTS : "mutasi"
    ORDERS ||--o{ STOCK_MOVEMENTS : "referensi"

    PROFILES {
        uuid id PK
        text full_name
        text phone
        user_role role
        boolean is_active
        text avatar_url
        timestamptz created_at
    }

    STORE_SETTINGS {
        int id PK
        text store_name
        text tagline
        text address
        text phone
        text receipt_header
        text receipt_footer
        int receipt_paper_width
        boolean tax_enabled
        numeric tax_percent
        boolean tax_inclusive
        boolean service_enabled
        numeric service_percent
        int rounding_unit
        boolean require_owner_pin_for_void
        text owner_void_pin_hash
    }

    CATEGORIES {
        uuid id PK
        text name
        category_type type
        int sort_order
        boolean is_active
    }

    PRODUCTS {
        uuid id PK
        uuid category_id FK
        text name
        text sku
        text description
        numeric base_price
        numeric cost_price
        text image_url
        boolean is_active
        boolean is_available
        boolean is_favorite
        boolean track_stock
        numeric current_stock
        numeric low_stock_threshold
    }

    PRODUCT_VARIANTS {
        uuid id PK
        uuid product_id FK
        text name
        text sku
        numeric price
        numeric cost_price
        int sort_order
        boolean is_active
    }

    MODIFIER_GROUPS {
        uuid id PK
        text name
        modifier_selection selection_type
        int min_select
        int max_select
        boolean is_required
    }

    MODIFIERS {
        uuid id PK
        uuid group_id FK
        text name
        numeric price_delta
        int sort_order
        boolean is_available
    }

    INGREDIENTS {
        uuid id PK
        text name
        text unit
        numeric current_stock
        numeric min_stock
        numeric cost_per_unit
    }

    RECIPES {
        uuid id PK
        uuid product_id FK
        uuid ingredient_id FK
        numeric quantity
    }

    CUSTOMERS {
        uuid id PK
        text name
        text phone
        text email
        text notes
        int visit_count
        numeric total_spent
        timestamptz last_visit
    }

    DISCOUNTS {
        uuid id PK
        text name
        text code
        discount_type type
        numeric value
        numeric max_discount
        numeric min_purchase
        boolean is_active
    }

    SHIFTS {
        uuid id PK
        uuid cashier_id FK
        shift_status status
        timestamptz opened_at
        timestamptz closed_at
        numeric opening_cash
        numeric expected_cash
        numeric actual_cash
        numeric cash_difference
        text note
    }

    ORDERS {
        uuid id PK
        text order_no
        int queue_no
        uuid shift_id FK
        uuid cashier_id FK
        uuid customer_id FK
        order_type order_type
        order_channel channel
        text table_no
        order_status status
        numeric subtotal
        numeric discount_amount
        numeric service_amount
        numeric tax_amount
        numeric rounding_amount
        numeric total
        numeric paid_amount
        numeric change_amount
        numeric total_cost
        text note
        timestamptz created_at
        timestamptz paid_at
        timestamptz voided_at
        uuid voided_by FK
        text void_reason
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        uuid variant_id FK
        text product_name
        text variant_name
        numeric unit_price
        numeric unit_cost
        int qty
        numeric subtotal
        text note
    }

    ORDER_ITEM_MODIFIERS {
        uuid id PK
        uuid order_item_id FK
        uuid modifier_id FK
        text modifier_name
        numeric price_delta
    }

    PAYMENTS {
        uuid id PK
        uuid order_id FK
        payment_method method
        numeric amount
        text reference_no
    }

    EXPENSES {
        uuid id PK
        uuid shift_id FK
        date expense_date
        text category
        text description
        numeric amount
        boolean paid_from_drawer
        uuid created_by FK
    }

    STOCK_MOVEMENTS {
        uuid id PK
        uuid product_id FK
        uuid ingredient_id FK
        stock_movement_type type
        numeric qty_change
        numeric balance_after
        uuid order_id FK
        numeric unit_cost
        text note
        uuid created_by FK
        timestamptz created_at
    }

    AUDIT_LOGS {
        bigint id PK
        uuid user_id FK
        text action
        text entity
        text entity_id
        jsonb old_data
        jsonb new_data
        timestamptz created_at
    }
```

---

## 2. Rincian Tipe Data Khusus (Postgres Enums)

1. **`user_role`**: `owner`, `cashier`.
2. **`order_type`**: `dine_in`, `take_away`, `delivery`.
3. **`order_channel`**: `walk_in`, `gofood`, `grabfood`, `shopeefood`, `whatsapp`, `other`.
4. **`order_status`**: `held`, `completed`, `void`.
5. **`payment_method`**: `cash`, `qris`, `bank_transfer`, `ewallet`, `other`.
6. **`discount_type`**: `percent`, `fixed`.
7. **`shift_status`**: `open`, `closed`.
8. **`stock_movement_type`**: `purchase`, `sale`, `sale_void`, `adjustment`, `waste`, `opening`.
9. **`category_type`**: `food`, `drink`, `other`.
10. **`modifier_selection`**: `single`, `multiple`.
