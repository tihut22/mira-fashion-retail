-- ========================================================
-- MIRA FASHION RETAIL & STOREFRONT - SUPABASE SAAS SCHEMA
-- ========================================================
-- Run this complete script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql

-- 1. BUSINESSES TABLE (Multi-tenant SaaS)
CREATE TABLE IF NOT EXISTS public.businesses (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  tagline TEXT DEFAULT '',
  description TEXT DEFAULT '',
  logo TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  telegram_username TEXT DEFAULT '',
  telegram_channel TEXT DEFAULT '',
  address TEXT DEFAULT '',
  city TEXT DEFAULT '',
  business_hours TEXT DEFAULT '',
  currency TEXT DEFAULT 'ETB',
  delivery_fee NUMERIC DEFAULT 0,
  free_delivery_threshold NUMERIC DEFAULT 0,
  banner_text TEXT DEFAULT '',
  theme_color TEXT DEFAULT '#78350F',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  item_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_business ON public.categories(business_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- 3. PRODUCTS TABLE
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

-- 4. PACKAGE BATCHES TABLE (Cargo/Import shipping batches)
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

-- 5. ORDERS TABLE (Storefront, Telegram Mini App, Walk-in, Shein Pre-orders)
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

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================================
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_batches ENABLE ROW LEVEL SECURITY;

-- Allow public read & write access with Anon/Authenticated keys
-- (Can be hardened with user role checks as your SaaS auth evolves)
DROP POLICY IF EXISTS "Allow public access businesses" ON public.businesses;
CREATE POLICY "Allow public access businesses" ON public.businesses FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access categories" ON public.categories;
CREATE POLICY "Allow public access categories" ON public.categories FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access products" ON public.products;
CREATE POLICY "Allow public access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access orders" ON public.orders;
CREATE POLICY "Allow public access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access package_batches" ON public.package_batches;
CREATE POLICY "Allow public access package_batches" ON public.package_batches FOR ALL USING (true) WITH CHECK (true);

-- ========================================================
-- REALTIME SUBSCRIPTIONS
-- ========================================================
-- Enable Supabase Realtime for instant multi-device sync
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.businesses, public.categories, public.products, public.orders, public.package_batches;
  EXCEPTION
    WHEN duplicate_object THEN
      NULL; -- Ignore if already added
  END;
END $$;

-- ========================================================
-- SEED INITIAL DATA (Default business and categories)
-- ========================================================
INSERT INTO public.businesses (
  id, slug, name, tagline, description, logo, phone, telegram_username, telegram_channel, address, city, business_hours, currency, delivery_fee, free_delivery_threshold, banner_text, theme_color
) VALUES (
  'biz-mira',
  'mira-fashion',
  'Mira Fashion',
  'Modern Ethiopian Haute Couture & Ready-to-Wear',
  'Bespoke tailoring, artisanal Habesha Kemis reinterpretations, and contemporary evening collections crafted in Addis Ababa.',
  'MIRA',
  '+251 91 123 4567',
  'mirafashion_orders',
  'https://t.me/mirafashion_orders',
  'Bole Medhanialem, Edna Mall Tower 2nd Floor',
  'Addis Ababa',
  'Mon - Sat: 9:00 AM - 8:00 PM | Sun: 11:00 AM - 5:00 PM',
  'ETB',
  150,
  3000,
  '✨ Welcome to Mira Fashion Storefront!',
  '#78350F'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.categories (id, business_id, name, slug, description, item_count) VALUES
  ('cat-dresses', 'biz-mira', 'Dresses & Gowns', 'dresses', 'Evening gowns, modern dresses, and habesha kemis.', 0),
  ('cat-tops', 'biz-mira', 'Tops & Blouses', 'tops', 'Blouses, crop tops, silk camisoles, and shirts.', 0),
  ('cat-bags', 'biz-mira', 'Bags & Clutches', 'bags', 'Artisanal structured totes, evening clutches, and leather crossbodies.', 0),
  ('cat-shoes', 'biz-mira', 'Footwear & Heels', 'shoes', 'Handcrafted leather block heels, strap mules, and city flats.', 0),
  ('cat-accessories', 'biz-mira', 'Shawls & Accessories', 'accessories', 'Handwoven pure cotton netela, cashmere wraps, and jewelry.', 0)
ON CONFLICT (id) DO NOTHING;
