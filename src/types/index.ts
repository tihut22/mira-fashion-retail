export type OrderSource = 'TELEGRAM' | 'WALK_IN' | 'PHONE' | 'OTHER';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';

export type PaymentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'PAYMENT_ON_DELIVERY' | 'REFUNDED';

export type PaymentMethod = 'CASH_ON_DELIVERY' | 'TELEBIRR' | 'CBE_BIRR' | 'BANK_TRANSFER' | 'CARD';

export interface ProductImage {
  id: string;
  productId: string;
  imageUrl: string;
  altText: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  price?: number; // optional variant price override
  stockQuantity: number;
}

export interface Product {
  id: string;
  businessId: string;
  categoryId: string;
  sku: string;
  name: string;
  description: string;
  details?: string[];
  costPrice: number;
  sellingPrice: number;
  discountPrice?: number;
  shippingPrice?: number;
  taxRate?: number;
  isActive: boolean;
  isPublished: boolean;
  isOnline: boolean;
  onlineStockQuantity?: number;
  isOrderedItem?: boolean; // Set to true if item is a customer pre-order / on-demand order, managed separately from physical inventory
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  businessId: string;
  name: string;
  slug: string;
  description?: string;
  itemCount?: number;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  logo: string;
  phone: string;
  telegramUsername: string; // e.g. 'mirafashion_orders'
  telegramChannel?: string;
  address: string;
  city: string;
  businessHours: string;
  currency: 'ETB' | 'USD';
  deliveryFee: number;
  freeDeliveryThreshold: number;
  bannerText?: string;
  themeColor: string;
}

export interface CartItem {
  id: string; // unique item cart key (productId + variantId)
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export interface OrderItem {
  productId: string;
  productName: string;
  variantId?: string;
  variantSummary: string; // e.g. "Size: M / Color: Emerald Green"
  sku: string;
  unitPrice: number;
  costPrice?: number; // Per-unit sourcing expenditure
  quantity: number;
  imageUrl: string;
}

export interface PackageBatch {
  id: string;
  businessId: string;
  batchCode: string; // e.g. "GSH18M45R00M2RV"
  batchName?: string; // Optional nickname e.g. "Dubai Shein Express Batch #4"
  sourceCurrency?: string; // e.g. "AED"
  sourceAmount?: number; // e.g. 343.25
  exchangeRate?: number; // AED to ETB rate
  totalPackageCost: number; // Whole package total expenditure in ETB (goods + cargo shipping + customs)
  packageShippingCost?: number; // Cargo / air freight fee for the whole package
  packageCustomsTax?: number; // Customs / clearance fee
  targetExpectedSales?: number; // Expected total sales revenue for this whole box
  status: 'ORDERED' | 'IN_TRANSIT' | 'CUSTOMS_CLEARING' | 'ARRIVED' | 'DISTRIBUTED';
  orderDate: string; // ISO date string
  arrivalDate?: string;
  notes?: string;
  createdAt: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  businessId: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerTelegram?: string;
  deliveryAddress: string;
  deliveryOption: string;
  notes?: string;
  packageBatchId?: string; // Linked package/batch code if sourced as part of an import package
  attachmentUrl?: string; // Optional attached photo, receipt, or payment proof
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number; // courier/local delivery or shipping cost
  shippingCost?: number;
  taxRate?: number; // e.g. 15 for 15% VAT, 0 if exempt
  taxAmount?: number; // calculated tax in ETB
  total: number;
  advancePaid?: number; // Pre-payment / advance deposit amount paid upfront in ETB
  remainingBalance?: number; // Balance remaining to be paid
  createdAt: string;
  confirmedAt?: string;
  registeredBy?: string; // staff member if manual Telegram or Walk-in
}

export interface CustomerProfile {
  name: string;
  phone: string;
  email: string;
  telegram: string;
  address: string;
}

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  photo_url?: string;
}

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram?: string;
  role: 'admin' | 'staff' | 'customer';
  avatarUrl?: string;
}
