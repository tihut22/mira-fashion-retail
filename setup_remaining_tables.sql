-- Run this in your Supabase SQL Editor to finish setting up products, orders, and package_batches:
-- https://supabase.com/dashboard/project/siizfdctcqjwjonibets/sql

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id TEXT DEFAULT '',
  sku TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  details JSONB DEFAULT '[]'::JSONB,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,
  shipping_price NUMERIC,
  tax_rate NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT TRUE,
  online_stock_quantity INTEGER DEFAULT 10,
  is_ordered_item BOOLEAN DEFAULT FALSE,
  images JSONB DEFAULT '[]'::JSONB,
  variants JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);

-- 2. PACKAGE BATCHES TABLE (Cargo / Import Shipments)
CREATE TABLE IF NOT EXISTS public.package_batches (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  batch_code TEXT NOT NULL,
  batch_name TEXT DEFAULT '',
  source_currency TEXT DEFAULT 'AED',
  source_amount NUMERIC DEFAULT 0,
  exchange_rate NUMERIC DEFAULT 0,
  total_package_cost NUMERIC DEFAULT 0,
  package_shipping_cost NUMERIC DEFAULT 0,
  package_customs_tax NUMERIC DEFAULT 0,
  target_expected_sales NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'ORDERED',
  order_date TIMESTAMPTZ DEFAULT NOW(),
  arrival_date TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_batches_business ON public.package_batches(business_id);

-- 3. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'TELEGRAM',
  status TEXT NOT NULL DEFAULT 'PENDING',
  payment_status TEXT NOT NULL DEFAULT 'UNPAID',
  payment_method TEXT NOT NULL DEFAULT 'CASH_ON_DELIVERY',
  customer_name TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  customer_email TEXT DEFAULT '',
  customer_telegram TEXT DEFAULT '',
  delivery_address TEXT DEFAULT '',
  delivery_option TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  package_batch_id TEXT REFERENCES public.package_batches(id) ON DELETE SET NULL,
  attachment_url TEXT DEFAULT '',
  items JSONB DEFAULT '[]'::JSONB,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  shipping_cost NUMERIC DEFAULT 0,
  tax_rate NUMERIC DEFAULT 0,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  advance_paid NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  registered_by TEXT DEFAULT '',
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_business ON public.orders(business_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);

-- 4. ROW LEVEL SECURITY
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public access products" ON public.products;
CREATE POLICY "Allow public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access package_batches" ON public.package_batches;
CREATE POLICY "Allow public access package_batches" ON public.package_batches FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access orders" ON public.orders;
CREATE POLICY "Allow public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

-- 5. ENABLE REALTIME
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products, public.package_batches, public.orders;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL;
  END;
END $$;
