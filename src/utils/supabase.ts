import { createClient } from '@supabase/supabase-js';
import { Business, Category, Order, Product, PackageBatch } from '../types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  rawUrl &&
  typeof rawUrl === 'string' &&
  rawUrl.startsWith('http') &&
  rawUrl !== 'YOUR_SUPABASE_URL' &&
  rawKey &&
  rawKey !== 'YOUR_SUPABASE_ANON_KEY'
);

const supabaseUrl = isSupabaseConfigured ? rawUrl : 'https://placeholder-project.supabase.co';
const supabaseAnonKey = isSupabaseConfigured
  ? rawKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MjAwMDAwMDAwMH0.placeholder';

if (!isSupabaseConfigured) {
  console.warn(
    'Supabase URL or Anon Key is missing or unconfigured. Operating in local mode with memory/localStorage fallback.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// ==========================================
// TYPE CONVERTERS (DB snake_case <-> App camelCase)
// ==========================================

export const mapBusinessFromDb = (b: any): Business => ({
  id: b.id,
  slug: b.slug,
  name: b.name,
  tagline: b.tagline || '',
  description: b.description || '',
  logo: b.logo || '',
  phone: b.phone || '',
  telegramUsername: b.telegram_username || '',
  telegramChannel: b.telegram_channel || undefined,
  address: b.address || '',
  city: b.city || '',
  businessHours: b.business_hours || '',
  currency: (b.currency as 'ETB' | 'USD') || 'ETB',
  deliveryFee: Number(b.delivery_fee || 0),
  freeDeliveryThreshold: Number(b.free_delivery_threshold || 0),
  bannerText: b.banner_text || undefined,
  themeColor: b.theme_color || '#78350F',
});

export const mapBusinessToDb = (b: Business): any => ({
  id: b.id,
  slug: b.slug,
  name: b.name,
  tagline: b.tagline,
  description: b.description,
  logo: b.logo,
  phone: b.phone,
  telegram_username: b.telegramUsername,
  telegram_channel: b.telegramChannel || null,
  address: b.address,
  city: b.city,
  business_hours: b.businessHours,
  currency: b.currency,
  delivery_fee: b.deliveryFee,
  free_delivery_threshold: b.freeDeliveryThreshold,
  banner_text: b.bannerText || null,
  theme_color: b.themeColor,
  updated_at: new Date().toISOString(),
});

export const mapCategoryFromDb = (c: any): Category => ({
  id: c.id,
  businessId: c.business_id,
  name: c.name,
  slug: c.slug,
  description: c.description || undefined,
  itemCount: Number(c.item_count || 0),
});

export const mapCategoryToDb = (c: Category): any => ({
  id: c.id,
  business_id: c.businessId,
  name: c.name,
  slug: c.slug,
  description: c.description || null,
  item_count: c.itemCount || 0,
  updated_at: new Date().toISOString(),
});

export const mapProductFromDb = (p: any): Product => ({
  id: p.id,
  businessId: p.business_id,
  categoryId: p.category_id,
  sku: p.sku,
  name: p.name,
  description: p.description || '',
  details: typeof p.details === 'string' ? JSON.parse(p.details) : p.details || [],
  costPrice: Number(p.cost_price || 0),
  sellingPrice: Number(p.selling_price || 0),
  discountPrice: p.discount_price ? Number(p.discount_price) : undefined,
  shippingPrice: p.shipping_price ? Number(p.shipping_price) : undefined,
  taxRate: p.tax_rate ? Number(p.tax_rate) : undefined,
  isActive: p.is_active ?? true,
  isPublished: p.is_published ?? true,
  isOnline: p.is_online ?? true,
  onlineStockQuantity: p.online_stock_quantity ? Number(p.online_stock_quantity) : undefined,
  isOrderedItem: p.is_ordered_item ?? false,
  images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images || [],
  variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants || [],
  createdAt: p.created_at || new Date().toISOString(),
  updatedAt: p.updated_at || new Date().toISOString(),
});

export const mapProductToDb = (p: Product): any => ({
  id: p.id,
  business_id: p.businessId,
  category_id: p.categoryId,
  sku: p.sku,
  name: p.name,
  description: p.description,
  details: p.details || [],
  cost_price: p.costPrice,
  selling_price: p.sellingPrice,
  discount_price: p.discountPrice || null,
  shipping_price: p.shippingPrice || null,
  tax_rate: p.taxRate || null,
  is_active: p.isActive,
  is_published: p.isPublished,
  is_online: p.isOnline,
  online_stock_quantity: p.onlineStockQuantity || 10,
  is_ordered_item: p.isOrderedItem || false,
  images: p.images || [],
  variants: p.variants || [],
  updated_at: new Date().toISOString(),
});

export const mapOrderFromDb = (o: any): Order => ({
  id: o.id,
  orderNumber: o.order_number,
  businessId: o.business_id,
  source: o.source,
  status: o.status,
  paymentStatus: o.payment_status,
  paymentMethod: o.payment_method,
  customerName: o.customer_name,
  customerPhone: o.customer_phone,
  customerEmail: o.customer_email || undefined,
  customerTelegram: o.customer_telegram || undefined,
  deliveryAddress: o.delivery_address || '',
  deliveryOption: o.delivery_option || '',
  notes: o.notes || undefined,
  packageBatchId: o.package_batch_id || undefined,
  attachmentUrl: o.attachment_url || undefined,
  items: typeof o.items === 'string' ? JSON.parse(o.items) : o.items || [],
  subtotal: Number(o.subtotal || 0),
  deliveryFee: Number(o.delivery_fee || 0),
  shippingCost: o.shipping_cost ? Number(o.shipping_cost) : undefined,
  taxRate: o.tax_rate ? Number(o.tax_rate) : undefined,
  taxAmount: o.tax_amount ? Number(o.tax_amount) : undefined,
  total: Number(o.total || 0),
  advancePaid: o.advance_paid ? Number(o.advance_paid) : undefined,
  remainingBalance: o.remaining_balance ? Number(o.remaining_balance) : undefined,
  createdAt: o.created_at || new Date().toISOString(),
  confirmedAt: o.confirmed_at || undefined,
  registeredBy: o.registered_by || undefined,
});

export const mapOrderToDb = (o: Order): any => ({
  id: o.id,
  order_number: o.orderNumber,
  business_id: o.businessId,
  source: o.source,
  status: o.status,
  payment_status: o.paymentStatus,
  payment_method: o.paymentMethod,
  customer_name: o.customerName,
  customer_phone: o.customerPhone,
  customer_email: o.customerEmail || null,
  customer_telegram: o.customerTelegram || null,
  delivery_address: o.deliveryAddress,
  delivery_option: o.deliveryOption,
  notes: o.notes || null,
  package_batch_id: o.packageBatchId || null,
  attachment_url: o.attachmentUrl || null,
  items: o.items || [],
  subtotal: o.subtotal,
  delivery_fee: o.deliveryFee,
  shipping_cost: o.shippingCost || null,
  tax_rate: o.taxRate || null,
  tax_amount: o.taxAmount || null,
  total: o.total,
  advance_paid: o.advancePaid || 0,
  remaining_balance: o.remainingBalance || 0,
  registered_by: o.registeredBy || null,
  confirmed_at: o.confirmedAt || null,
  created_at: o.createdAt || new Date().toISOString(),
  updated_at: new Date().toISOString(),
});

export const mapBatchFromDb = (b: any): PackageBatch => ({
  id: b.id,
  businessId: b.business_id,
  batchCode: b.batch_code,
  batchName: b.batch_name || undefined,
  sourceCurrency: b.source_currency || undefined,
  sourceAmount: b.source_amount ? Number(b.source_amount) : undefined,
  exchangeRate: b.exchange_rate ? Number(b.exchange_rate) : undefined,
  totalPackageCost: Number(b.total_package_cost || 0),
  packageShippingCost: b.package_shipping_cost ? Number(b.package_shipping_cost) : undefined,
  packageCustomsTax: b.package_customs_tax ? Number(b.package_customs_tax) : undefined,
  targetExpectedSales: b.target_expected_sales ? Number(b.target_expected_sales) : undefined,
  status: b.status || 'ORDERED',
  orderDate: b.order_date || new Date().toISOString(),
  arrivalDate: b.arrival_date || undefined,
  notes: b.notes || undefined,
  createdAt: b.created_at || new Date().toISOString(),
});

export const mapBatchToDb = (b: PackageBatch): any => ({
  id: b.id,
  business_id: b.businessId,
  batch_code: b.batchCode,
  batch_name: b.batchName || null,
  source_currency: b.sourceCurrency || null,
  source_amount: b.sourceAmount || null,
  exchange_rate: b.exchangeRate || null,
  total_package_cost: b.totalPackageCost || 0,
  package_shipping_cost: b.packageShippingCost || null,
  package_customs_tax: b.packageCustomsTax || null,
  target_expected_sales: b.targetExpectedSales || null,
  status: b.status,
  order_date: b.orderDate,
  arrival_date: b.arrivalDate || null,
  notes: b.notes || null,
  created_at: b.createdAt || new Date().toISOString(),
});
