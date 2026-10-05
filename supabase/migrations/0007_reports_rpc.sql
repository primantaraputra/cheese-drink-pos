-- ==============================================================================
-- 0007_reports_rpc.sql
-- RPC Agregasi Laporan Keuangan, Penjualan, Produk, Kasir, Shift, Jam Sibuk
-- Seluruh waktu difilter berdasarkan zona waktu Asia/Jakarta (WIB)
-- ==============================================================================

-- 1. Ringkasan Penjualan & KPI Dashboard (Owner)
create or replace function get_sales_summary(p_start_date date, p_end_date date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'total_sales', coalesce(sum(o.total), 0),
    'total_orders', count(o.id),
    'total_subtotal', coalesce(sum(o.subtotal), 0),
    'total_discount', coalesce(sum(o.discount_amount), 0),
    'total_tax', coalesce(sum(o.tax_amount), 0),
    'total_service', coalesce(sum(o.service_amount), 0),
    'total_cost', coalesce(sum(o.total_cost), 0),
    'gross_profit', coalesce(sum(o.total - o.tax_amount - o.service_amount - o.total_cost), 0),
    'avg_ticket', case when count(o.id) > 0 then round(coalesce(sum(o.total), 0) / count(o.id)) else 0 end,
    'void_count', (
      select count(*) from orders
      where (created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
        and status = 'void'
    ),
    'void_amount', (
      select coalesce(sum(total), 0) from orders
      where (created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
        and status = 'void'
    )
  ) into v_result
  from orders o
  where (o.created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and o.status = 'completed';

  return v_result;
end;
$$;

-- 2. Tren Penjualan Harian (Chart 7/30 Hari)
create or replace function get_sales_by_day(p_start_date date, p_end_date date)
returns table (
  sale_date text,
  total_sales numeric,
  order_count bigint
)
language sql security definer set search_path = public as $$
  select
    to_char((created_at at time zone 'Asia/Jakarta')::date, 'YYYY-MM-DD') as sale_date,
    coalesce(sum(total), 0) as total_sales,
    count(id) as order_count
  from orders
  where (created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and status = 'completed'
  group by (created_at at time zone 'Asia/Jakarta')::date
  order by (created_at at time zone 'Asia/Jakarta')::date asc;
$$;

-- 3. Analisis Jam Sibuk (00:00 - 23:00)
create or replace function get_sales_by_hour(p_start_date date, p_end_date date)
returns table (
  sale_hour int,
  total_sales numeric,
  order_count bigint
)
language sql security definer set search_path = public as $$
  select
    extract(hour from created_at at time zone 'Asia/Jakarta')::int as sale_hour,
    coalesce(sum(total), 0) as total_sales,
    count(id) as order_count
  from orders
  where (created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and status = 'completed'
  group by extract(hour from created_at at time zone 'Asia/Jakarta')::int
  order by sale_hour asc;
$$;

-- 4. Produk Terlaris (Top Selling Products)
create or replace function get_top_products(p_start_date date, p_end_date date, p_limit int default 10)
returns table (
  product_id uuid,
  product_name text,
  total_qty numeric,
  total_sales numeric
)
language sql security definer set search_path = public as $$
  select
    oi.product_id,
    oi.product_name,
    coalesce(sum(oi.qty), 0) as total_qty,
    coalesce(sum(oi.subtotal), 0) as total_sales
  from order_items oi
  join orders o on o.id = oi.order_id
  where (o.created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and o.status = 'completed'
  group by oi.product_id, oi.product_name
  order by total_qty desc
  limit coalesce(p_limit, 10);
$$;

-- 5. Penjualan Berdasarkan Kategori
create or replace function get_sales_by_category(p_start_date date, p_end_date date)
returns table (
  category_id uuid,
  category_name text,
  total_qty numeric,
  total_sales numeric
)
language sql security definer set search_path = public as $$
  select
    c.id as category_id,
    c.name as category_name,
    coalesce(sum(oi.qty), 0) as total_qty,
    coalesce(sum(oi.subtotal), 0) as total_sales
  from categories c
  join products p on p.category_id = c.id
  join order_items oi on oi.product_id = p.id
  join orders o on o.id = oi.order_id
  where (o.created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and o.status = 'completed'
  group by c.id, c.name
  order by total_sales desc;
$$;

-- 6. Komposisi Metode Pembayaran
create or replace function get_sales_by_payment_method(p_start_date date, p_end_date date)
returns table (
  payment_method text,
  total_amount numeric,
  transaction_count bigint
)
language sql security definer set search_path = public as $$
  select
    p.method::text as payment_method,
    coalesce(sum(p.amount), 0) as total_amount,
    count(p.id) as transaction_count
  from payments p
  join orders o on o.id = p.order_id
  where (o.created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and o.status = 'completed'
  group by p.method
  order by total_amount desc;
$$;

-- 7. Kinerja Penjualan Kasir
create or replace function get_sales_by_cashier(p_start_date date, p_end_date date)
returns table (
  cashier_id uuid,
  cashier_name text,
  total_orders bigint,
  total_sales numeric,
  void_count bigint
)
language sql security definer set search_path = public as $$
  select
    pr.id as cashier_id,
    pr.full_name as cashier_name,
    count(distinct o.id) filter (where o.status = 'completed') as total_orders,
    coalesce(sum(o.total) filter (where o.status = 'completed'), 0) as total_sales,
    count(distinct o.id) filter (where o.status = 'void') as void_count
  from profiles pr
  left join orders o on o.cashier_id = pr.id
    and (o.created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
  group by pr.id, pr.full_name
  order by total_sales desc;
$$;

-- 8. Laporan Laba Rugi Sederhana
create or replace function get_profit_loss(p_start_date date, p_end_date date)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_gross_sales numeric := 0;
  v_discounts numeric := 0;
  v_net_sales numeric := 0;
  v_cogs numeric := 0;
  v_gross_profit numeric := 0;
  v_expenses numeric := 0;
  v_net_profit numeric := 0;
begin
  -- Total penjualan kotor dan diskon
  select
    coalesce(sum(subtotal), 0),
    coalesce(sum(discount_amount), 0),
    coalesce(sum(total_cost), 0)
  into v_gross_sales, v_discounts, v_cogs
  from orders
  where (created_at at time zone 'Asia/Jakarta')::date between p_start_date and p_end_date
    and status = 'completed';

  v_net_sales := v_gross_sales - v_discounts;
  v_gross_profit := v_net_sales - v_cogs;

  -- Total beban operasional
  select coalesce(sum(amount), 0) into v_expenses
  from expenses
  where expense_date between p_start_date and p_end_date;

  v_net_profit := v_gross_profit - v_expenses;

  return jsonb_build_object(
    'gross_sales', v_gross_sales,
    'discounts', v_discounts,
    'net_sales', v_net_sales,
    'cogs', v_cogs,
    'gross_profit', v_gross_profit,
    'expenses', v_expenses,
    'net_profit', v_net_profit
  );
end;
$$;
