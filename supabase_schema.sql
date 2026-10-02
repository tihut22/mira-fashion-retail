-- ========================================================
-- MIRA FASHION RETAIL - SUPABASE DATABASE SCHEMA
-- Execute this SQL script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/siizfdctcqjwjonibets/sql/new
-- ========================================================

-- 1. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT,
  description TEXT,
  logo TEXT,
  phone TEXT,
  telegram_username TEXT,
  telegram_channel TEXT,
  address TEXT,
  city TEXT,
  business_hours TEXT,
  currency TEXT DEFAULT 'ETB',
  delivery_fee NUMERIC DEFAULT 150,
  free_delivery_threshold NUMERIC DEFAULT 3000,
  banner_text TEXT,
  theme_color TEXT DEFAULT '#78350F',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  business_id TEXT REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  category_id TEXT,
  sku TEXT,
  name TEXT NOT NULL,
  description TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  cost_price NUMERIC DEFAULT 0,
  selling_price NUMERIC DEFAULT 0,
  discount_price NUMERIC,
  shipping_price NUMERIC,
  tax_rate NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  is_published BOOLEAN DEFAULT TRUE,
  is_online BOOLEAN DEFAULT TRUE,
  online_stock_quantity INTEGER DEFAULT 10,
  is_ordered_item BOOLEAN DEFAULT FALSE,
  images JSONB DEFAULT '[]'::jsonb,
  variants JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL,
  business_id TEXT,
  source TEXT,
  status TEXT,
  payment_status TEXT,
  payment_method TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_email TEXT,
  customer_telegram TEXT,
  delivery_address TEXT,
  delivery_option TEXT,
  notes TEXT,
  package_batch_id TEXT,
  attachment_url TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC DEFAULT 0,
  delivery_fee NUMERIC DEFAULT 0,
  shipping_cost NUMERIC,
  tax_rate NUMERIC,
  tax_amount NUMERIC,
  total NUMERIC DEFAULT 0,
  advance_paid NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  registered_by TEXT,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PACKAGE BATCHES TABLE
CREATE TABLE IF NOT EXISTS public.package_batches (
  id TEXT PRIMARY KEY,
  business_id TEXT,
  batch_code TEXT NOT NULL,
  batch_name TEXT,
  source_currency TEXT,
  source_amount NUMERIC,
  exchange_rate NUMERIC,
  total_package_cost NUMERIC DEFAULT 0,
  package_shipping_cost NUMERIC,
  package_customs_tax NUMERIC,
  target_expected_sales NUMERIC,
  status TEXT DEFAULT 'ORDERED',
  order_date TIMESTAMPTZ DEFAULT NOW(),
  arrival_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- ENABLE ROW LEVEL SECURITY & PUBLIC PERMISSIONS
-- ========================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_batches ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated public access
DROP POLICY IF EXISTS "Public access businesses" ON public.businesses;
CREATE POLICY "Public access businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access categories" ON public.categories;
CREATE POLICY "Public access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access products" ON public.products;
CREATE POLICY "Public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access orders" ON public.orders;
CREATE POLICY "Public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access package_batches" ON public.package_batches;
CREATE POLICY "Public access package_batches" ON public.package_batches FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime publication for instant multi-device synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses, public.categories, public.products, public.orders, public.package_batches;
