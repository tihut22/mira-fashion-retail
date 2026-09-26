import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { supabase } from '../utils/supabase';
import { compressImage } from '../utils/imageCompression';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';
import { sanitizeForFirestore } from '../utils/firestoreSanitizer';
import {
  Business,
  CartItem,
  Category,
  CustomerProfile,
  Order,
  OrderItem,
  OrderStatus,
  OrderSource,
  PaymentMethod,
  PaymentStatus,
  Product,
  ProductVariant,
  ProductImage,
  PackageBatch,
} from '../types';
import {
  INITIAL_BUSINESSES,
  INITIAL_CATEGORIES,
  INITIAL_ORDERS,
  INITIAL_PRODUCTS,
  INITIAL_PACKAGE_BATCHES,
} from '../data/initialData';

interface RetailContextType {
  // Multitenancy & Navigation
  currentBusiness: Business;
  businesses: Business[];
  switchBusiness: (slug: string) => void;
  activeView: 'storefront' | 'admin' | 'telegram';
  setActiveView: (view: 'storefront' | 'admin' | 'telegram') => void;
  storefrontTab: 'catalog' | 'story' | 'contact';
  setStorefrontTab: (tab: 'catalog' | 'story' | 'contact') => void;
  adminTab: 'overview' | 'inventory' | 'orders' | 'settings';
  setAdminTab: (tab: 'overview' | 'inventory' | 'orders' | 'settings') => void;

  // Catalog & Products
  products: Product[];
  publishedProducts: Product[];
  categories: Category[];
  addCategory: (name: string, description?: string) => Category;
  selectedCategory: string;
  setSelectedCategory: (categorySlug: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedProduct: Product | null;
  setSelectedProduct: (product: Product | null) => void;

  // Product CRUD & Stock Management
  addProduct: (product: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  toggleProductVisibility: (productId: string, field: 'is_active' | 'is_published' | 'is_online') => void;
  updateVariantStock: (productId: string, variantId: string, newStock: number) => void;

  // Cart & Shopping
  cart: CartItem[];
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => boolean;
  removeFromCart: (cartItemId: string) => void;
  updateCartQuantity: (cartItemId: string, newQuantity: number) => void;
  clearCart: () => void;
  cartCount: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Checkout & Ordering
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutOnline: (details: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerTelegram?: string;
    deliveryAddress: string;
    deliveryOption: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => { success: boolean; order?: Order; error?: string };

  // Telegram Direct Ordering
  telegramModalData: {
    product: Product;
    variant: ProductVariant;
    quantity: number;
  } | null;
  openTelegramOrderModal: (product: Product, variant: ProductVariant, quantity?: number) => void;
  closeTelegramOrderModal: () => void;
  buildTelegramDeepLink: (product: Product, variant: ProductVariant, quantity: number, customerNotes?: string) => string;

  // Orders & Admin Management
  orders: Order[];
  packageBatches: PackageBatch[];
  addPackageBatch: (batch: Omit<PackageBatch, 'id' | 'businessId' | 'createdAt'>) => PackageBatch;
  updatePackageBatch: (batch: PackageBatch) => void;
  deletePackageBatch: (batchId: string) => void;
  createBulkSheinOrder: (orderInput: {
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    advancePaid?: number;
    registeredBy?: string;
    notes?: string;
    packageBatchId?: string;
    attachmentUrl?: string;
    shippingCost?: number;
    taxRate?: number;
    taxAmount?: number;
    items: {
      productName: string;
      sheinSkuOrLink: string;
      categoryId: string;
      size: string;
      color: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      imageUrl?: string;
    }[];
  }) => { success: boolean; order?: Order; products?: Product[]; error?: string };
  createSheinOrderWithNewProduct: (orderInput: {
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    registeredBy: string;
    notes?: string;
    productName: string;
    sheinSkuOrLink: string;
    categoryId: string;
    size: string;
    color: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    shippingCost?: number;
    taxRate?: number;
    taxAmount?: number;
    imageUrl?: string;
    packageBatchId?: string;
    advancePaid?: number;
  }) => { success: boolean; order?: Order; product?: Product; error?: string };
  updateOrderPayment: (orderId: string, advancePaid: number) => void;
  registerManualOrder: (orderInput: {
    source: OrderSource;
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    items: { productId: string; variantId: string; quantity: number }[];
    registeredBy: string;
    notes?: string;
    attachmentUrl?: string;
  }) => { success: boolean; order?: Order; error?: string };
  updateOrderStatus: (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => void;
  deleteOrder: (orderId: string) => void;
  deleteOrderItem: (orderId: string, itemIndex: number, restoreStock?: boolean) => void;
  assignOrderToPackageBatch: (orderId: string, packageBatchId: string | undefined) => void;
  bulkAssignOrdersToPackageBatch: (orderIds: string[], packageBatchId: string | undefined) => void;

  // Customer Account & Profile
  customerProfile: CustomerProfile;
  setCustomerProfile: React.Dispatch<React.SetStateAction<CustomerProfile>>;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  lastPlacedOrder: Order | null;
  setLastPlacedOrder: (order: Order | null) => void;

  // Settings & System Reset
  updateBusinessSettings: (updatedSettings: Partial<Business>) => void;
  clearAllData: () => void;
}

const RetailContext = createContext<RetailContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUSINESSES: 'retail_businesses_v1',
  CURRENT_SLUG: 'retail_current_slug_v1',
  PRODUCTS: 'retail_products_v1',
  CATEGORIES: 'retail_categories_v1',
  ORDERS: 'retail_orders_v1',
  PACKAGE_BATCHES: 'retail_package_batches_v1',
  PROFILE: 'retail_customer_profile_v1',
};

export const RetailProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Businesses state
  const [businesses, setBusinesses] = useState<Business[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BUSINESSES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_BUSINESSES;
  });

  const [currentSlug, setCurrentSlug] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_SLUG);
      if (saved && typeof saved === 'string') return saved;
    } catch {}
    return 'mira-fashion';
  });

  const currentBusiness = useMemo(() => {
    const found = businesses.find((b) => b?.slug === currentSlug);
    return found || businesses[0] || INITIAL_BUSINESSES[0];
  }, [businesses, currentSlug]);

  // Views & Tabs - Default directly to Telegram Mini App
  const [activeView, setActiveViewState] = useState<'storefront' | 'admin' | 'telegram'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const search = window.location.search;
        if (search.includes('view=storefront')) return 'storefront';
        if (search.includes('view=admin')) return 'admin';
        if (
          search.includes('view=telegram') ||
          search.includes('tgWebApp=true') ||
          window.location.hash.includes('tgWebAppData') ||
          (window as any).Telegram?.WebApp?.initData
        ) {
          return 'telegram';
        }
        const saved = localStorage.getItem('mira_active_view');
        if (saved === 'storefront' || saved === 'admin' || saved === 'telegram') {
          return saved;
        }
      } catch {}
      return 'telegram';
    }
    return 'telegram';
  });

  const setActiveView = (view: 'storefront' | 'admin' | 'telegram') => {
    setActiveViewState(view);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('mira_active_view', view);
      } catch {}
    }
  };
  const [storefrontTab, setStorefrontTab] = useState<'catalog' | 'story' | 'contact'>('catalog');
  const [adminTab, setAdminTab] = useState<'overview' | 'inventory' | 'orders' | 'settings'>('overview');

  const mapProductFromDb = (p: any): Product => ({
    id: p.id,
    businessId: p.business_id,
    categoryId: p.category_id,
    sku: p.sku,
    name: p.name,
    description: p.description,
    details: p.details,
    costPrice: p.cost_price,
    sellingPrice: p.selling_price,
    discountPrice: p.discount_price,
    taxRate: p.tax_rate,
    isActive: p.is_active,
    isPublished: p.is_published,
    isOnline: p.is_online,
    images: typeof p.images === 'string' ? JSON.parse(p.images) : p.images,
    variants: typeof p.variants === 'string' ? JSON.parse(p.variants) : p.variants,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  });

  // Products & Categories
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    async function fetchProducts() {
      try {
        const { data, error } = await supabase.from('products').select('*');
        if (error) throw error;
        if (data && data.length > 0) {
          setProducts(data.map(mapProductFromDb));
        }
      } catch (error) {
        console.warn('Using local inventory fallback (Supabase query info):', error);
      }
    }
    fetchProducts();
  }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_CATEGORIES;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((o) => ({
            ...o,
            source: ((o.source as any) === 'ONLINE' ? 'TELEGRAM' : o.source) as OrderSource,
          }));
        }
      }
    } catch {}
    return INITIAL_ORDERS;
  });

  const [packageBatches, setPackageBatches] = useState<PackageBatch[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PACKAGE_BATCHES);
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_PACKAGE_BATCHES;
  });

  // UI state
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Telegram order modal state
  const [telegramModalData, setTelegramModalData] = useState<{
    product: Product;
    variant: ProductVariant;
    quantity: number;
  } | null>(null);

  // Customer Profile
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROFILE);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') return parsed;
      }
    } catch {}
    return {
      name: 'Selamawit Haile',
      phone: '+251 91 199 8877',
      email: 'selamawit@example.com',
      telegram: '@selamawit_h',
      address: 'Bole Atlas, Gabon Street, Building 12',
    };
  });

  // Persistence effects
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.BUSINESSES, JSON.stringify(businesses)); } catch {}
  }, [businesses]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CURRENT_SLUG, currentSlug); } catch {}
  }, [currentSlug]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products)); } catch {}
  }, [products]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories)); } catch {}
  }, [categories]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders)); } catch {}
  }, [orders]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PACKAGE_BATCHES, JSON.stringify(packageBatches)); } catch {}
  }, [packageBatches]);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(customerProfile)); } catch {}
  }, [customerProfile]);

  const switchBusiness = (slug: string) => {
    setCurrentSlug(slug);
    setSelectedCategory('all');
    setSearchQuery('');
    setSelectedProduct(null);
    setCart([]);
  };

  // Products belonging to the current business (strictly physical boutique stock, excluding customer ordered items)
  const businessProducts = useMemo(() => {
    return products.filter(
      (p) =>
        p.businessId === currentBusiness.id &&
        !p.isOrderedItem &&
        !p.description?.includes('Customer selected Shein item')
    );
  }, [products, currentBusiness.id]);

  // Published & online products for storefront customers
  // "The customer portal should show only products that the shop chooses to publish"
  // "Only products that are active, published and available for online display should appear in the storefront."
  const publishedProducts = useMemo(() => {
    return businessProducts.filter((p) => p.isActive && p.isPublished && p.isOnline);
  }, [businessProducts]);

  // Category CRUD
  const addCategory = (name: string, description: string = ''): Category => {
    const trimmed = name.trim();
    const slug = trimmed.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const existing = categories.find(
      (c) => c.slug === slug || c.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (existing) return existing;

    const newCategory: Category = {
      id: `cat-${Date.now()}`,
      businessId: currentBusiness.id,
      name: trimmed,
      slug,
      description: description || `${trimmed} collection`,
      itemCount: 0,
    };
    setCategories((prev) => [...prev, newCategory]);
    return newCategory;
  };

  // Product CRUD
  const addProduct = async (productInput: Omit<Product, 'id' | 'businessId' | 'createdAt' | 'updatedAt'>) => {
    let sanitizedImages: ProductImage[] = [];
    try {
      sanitizedImages = await Promise.all(
        (productInput.images || []).map(async (img) => {
          if (img.imageUrl && img.imageUrl.startsWith('data:')) {
            try {
              const compressed = await compressImage(img.imageUrl, 1024, 1024, 0.75);
              return { ...img, imageUrl: compressed };
            } catch {
              return img;
            }
          }
          return img;
        })
      );
    } catch {
      sanitizedImages = productInput.images || [];
    }

    const now = new Date().toISOString();
    const newProductId = `prod-${Date.now()}`;
    const targetCategoryId =
      productInput.categoryId && productInput.categoryId !== 'all'
        ? productInput.categoryId
        : categories[0]?.id || 'cat-general';

    const localProduct: Product = {
      id: newProductId,
      businessId: currentBusiness.id,
      categoryId: targetCategoryId,
      sku: productInput.sku || `MF-${Math.floor(100 + Math.random() * 900)}`,
      name: productInput.name,
      description: productInput.description || '',
      details: productInput.details || [],
      costPrice: Number(productInput.costPrice || 0),
      sellingPrice: Number(productInput.sellingPrice || 0),
      discountPrice: productInput.discountPrice ? Number(productInput.discountPrice) : undefined,
      shippingPrice: productInput.shippingPrice ? Number(productInput.shippingPrice) : undefined,
      taxRate: productInput.taxRate ? Number(productInput.taxRate) : undefined,
      isActive: productInput.isActive ?? true,
      isPublished: productInput.isPublished ?? true,
      isOnline: productInput.isOnline ?? true,
      onlineStockQuantity: productInput.onlineStockQuantity ? Number(productInput.onlineStockQuantity) : 10,
      images: sanitizedImages,
      variants: productInput.variants || [],
      createdAt: now,
      updatedAt: now,
    };

    // ALWAYS update local state immediately so new stock/product is immediately visible
    setProducts((prev) => [localProduct, ...prev]);

    try {
      const dbPayload = {
        id: localProduct.id,
        business_id: localProduct.businessId,
        category_id: localProduct.categoryId,
        sku: localProduct.sku,
        name: localProduct.name,
        description: localProduct.description,
        details: localProduct.details,
        cost_price: localProduct.costPrice,
        selling_price: localProduct.sellingPrice,
        discount_price: localProduct.discountPrice,
        tax_rate: localProduct.taxRate,
        is_active: localProduct.isActive,
        is_published: localProduct.isPublished,
        is_online: localProduct.isOnline,
        images: sanitizedImages,
        variants: localProduct.variants,
        created_at: now,
        updated_at: now,
      };

      const { error } = await supabase.from('products').insert([dbPayload]);
      if (error) {
        console.warn('Supabase insert warning (saved locally):', error.message);
      }
    } catch (error) {
      console.warn('Supabase insert exception (saved locally):', error);
    }
  };

  const updateProduct = async (updated: Product) => {
    const now = new Date().toISOString();
    const updatedProduct = { ...updated, updatedAt: now };

    setProducts((prev) =>
      prev.map((p) => (p.id === updated.id ? updatedProduct : p))
    );
    if (selectedProduct && selectedProduct.id === updated.id) {
      setSelectedProduct(updatedProduct);
    }

    try {
      const sanitizedImages = await Promise.all(
        (updated.images || []).map(async (img) => {
          if (img.imageUrl && img.imageUrl.startsWith('data:')) {
            try {
              const compressed = await compressImage(img.imageUrl, 1024, 1024, 0.75);
              return { ...img, imageUrl: compressed };
            } catch {
              return img;
            }
          }
          return img;
        })
      );

      const cleanData = {
        business_id: updated.businessId,
        category_id: updated.categoryId,
        sku: updated.sku,
        name: updated.name,
        description: updated.description,
        details: updated.details,
        cost_price: updated.costPrice,
        selling_price: updated.sellingPrice,
        discount_price: updated.discountPrice,
        tax_rate: updated.taxRate,
        is_active: updated.isActive,
        is_published: updated.isPublished,
        is_online: updated.isOnline,
        images: sanitizedImages,
        variants: updated.variants,
        updated_at: now,
      };

      const { error } = await supabase.from('products').update(cleanData).eq('id', updated.id);
      if (error) {
        console.warn('Supabase update warning (saved locally):', error.message);
      }
    } catch (error) {
      console.warn('Supabase update exception (saved locally):', error);
    }
  };

  const deleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    if (selectedProduct?.id === productId) {
      setSelectedProduct(null);
    }

    try {
      const { error } = await supabase.from('products').delete().eq('id', productId);
      if (error) {
        console.warn('Supabase delete warning (deleted locally):', error.message);
      }
    } catch (error) {
      console.warn('Supabase delete exception (deleted locally):', error);
    }
  };

  const toggleProductVisibility = (
    productId: string,
    field: 'is_active' | 'is_published' | 'is_online'
  ) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        if (field === 'is_active') return { ...p, isActive: !p.isActive, updatedAt: new Date().toISOString() };
        if (field === 'is_published') return { ...p, isPublished: !p.isPublished, updatedAt: new Date().toISOString() };
        if (field === 'is_online') return { ...p, isOnline: !p.isOnline, updatedAt: new Date().toISOString() };
        return p;
      })
    );
  };

  const updateVariantStock = (productId: string, variantId: string, newStock: number) => {
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id !== productId) return p;
        const updatedVariants = p.variants.map((v) =>
          v.id === variantId ? { ...v, stockQuantity: Math.max(0, newStock) } : v
        );
        return {
          ...p,
          variants: updatedVariants,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  };

  // Cart operations
  const addToCart = (product: Product, variant: ProductVariant, quantity: number = 1): boolean => {
    if (variant.stockQuantity <= 0) return false;

    const cartKey = `${product.id}_${variant.id}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.id === cartKey);
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, variant.stockQuantity);
        return prev.map((item) => (item.id === cartKey ? { ...item, quantity: nextQty } : item));
      } else {
        return [...prev, { id: cartKey, product, variant, quantity: Math.min(quantity, variant.stockQuantity) }];
      }
    });
    setIsCartOpen(true);
    return true;
  };

  const removeFromCart = (cartItemId: string) => {
    setCart((prev) => prev.filter((item) => item.id !== cartItemId));
  };

  const updateCartQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCart((prev) =>
      prev.map((item) => {
        if (item.id !== cartItemId) return item;
        const clampedQty = Math.min(newQuantity, item.variant.stockQuantity);
        return { ...item, quantity: clampedQty };
      })
    );
  };

  const clearCart = () => setCart([]);

  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((acc, item) => {
      const price = item.product.discountPrice || item.product.sellingPrice;
      return acc + price * item.quantity;
    }, 0);
  }, [cart]);

  // Online checkout with server-style inventory validation
  const checkoutOnline = (details: {
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerTelegram?: string;
    deliveryAddress: string;
    deliveryOption: string;
    paymentMethod: PaymentMethod;
    notes?: string;
  }) => {
    if (cart.length === 0) {
      return { success: false, error: 'Your cart is empty.' };
    }

    // Server-side inventory validation to prevent race conditions
    for (const item of cart) {
      const liveProduct = products.find((p) => p.id === item.product.id);
      if (!liveProduct) {
        return { success: false, error: `Product ${item.product.name} is no longer available.` };
      }
      const liveVariant = liveProduct.variants.find((v) => v.id === item.variant.id);
      if (!liveVariant || liveVariant.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${item.product.name} (${item.variant.size} / ${item.variant.color}). Available: ${liveVariant?.stockQuantity || 0}`,
        };
      }
    }

    // Deduct stock in real time
    setProducts((prev) =>
      prev.map((p) => {
        const cartItemsForProduct = cart.filter((c) => c.product.id === p.id);
        if (cartItemsForProduct.length === 0) return p;

        const updatedVariants = p.variants.map((v) => {
          const match = cartItemsForProduct.find((c) => c.variant.id === v.id);
          if (!match) return v;
          return {
            ...v,
            stockQuantity: Math.max(0, v.stockQuantity - match.quantity),
          };
        });

        return {
          ...p,
          variants: updatedVariants,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    const subtotal = cartSubtotal;
    const deliveryFee = subtotal >= currentBusiness.freeDeliveryThreshold ? 0 : currentBusiness.deliveryFee;
    const total = subtotal + deliveryFee;

    const orderNumber = `${currentBusiness.name.slice(0, 2).toUpperCase()}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      businessId: currentBusiness.id,
      source: 'TELEGRAM',
      status: 'CONFIRMED',
      paymentStatus: details.paymentMethod === 'CASH_ON_DELIVERY' ? 'PAYMENT_ON_DELIVERY' : 'PAID',
      paymentMethod: details.paymentMethod,
      customerName: details.customerName,
      customerPhone: details.customerPhone,
      customerEmail: details.customerEmail,
      customerTelegram: details.customerTelegram,
      deliveryAddress: details.deliveryAddress,
      deliveryOption: details.deliveryOption,
      notes: details.notes,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        variantId: item.variant.id,
        variantSummary: `${item.variant.size} / ${item.variant.color}`,
        sku: item.variant.sku,
        unitPrice: item.product.discountPrice || item.product.sellingPrice,
        quantity: item.quantity,
        imageUrl: item.product.images[0]?.imageUrl || '',
      })),
      subtotal,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
    };

    setOrders((prev) => [newOrder, ...prev]);
    setLastPlacedOrder(newOrder);
    clearCart();
    setIsCheckoutOpen(false);
    return { success: true, order: newOrder };
  };

  // Telegram order generation & modal
  const openTelegramOrderModal = (product: Product, variant: ProductVariant, quantity: number = 1) => {
    setTelegramModalData({ product, variant, quantity });
  };

  const closeTelegramOrderModal = () => {
    setTelegramModalData(null);
  };

  const buildTelegramDeepLink = (
    product: Product,
    variant: ProductVariant,
    quantity: number,
    customerNotes: string = ''
  ) => {
    const price = (product.discountPrice || product.sellingPrice) * quantity;
    const lines = [
      `Hello ${currentBusiness.name}! I would like to place an order:`,
      `• Product: ${product.name}`,
      `• SKU: ${variant.sku}`,
      `• Variant: Size ${variant.size} / Color ${variant.color}`,
      `• Quantity: ${quantity}`,
      `• Total: ${price.toLocaleString()} ${currentBusiness.currency}`,
    ];
    if (customerNotes) {
      lines.push(`• Notes: ${customerNotes}`);
    }
    lines.push(`Please confirm availability and payment/delivery instructions.`);

    const text = encodeURIComponent(lines.join('\n'));
    return `https://t.me/${currentBusiness.telegramUsername}?text=${text}`;
  };

  // Create Bulk Pre-Order with multiple items at once & Pre-Payment / Deposit tracking
  const createBulkSheinOrder = (orderInput: {
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    advancePaid?: number;
    registeredBy?: string;
    notes?: string;
    packageBatchId?: string;
    attachmentUrl?: string;
    shippingCost?: number;
    taxRate?: number;
    taxAmount?: number;
    items: {
      productName: string;
      sheinSkuOrLink: string;
      categoryId: string;
      size: string;
      color: string;
      quantity: number;
      costPrice: number;
      sellingPrice: number;
      imageUrl?: string;
    }[];
  }) => {
    if (!orderInput.customerName.trim() || !orderInput.customerPhone.trim()) {
      return { success: false, error: 'Customer name and phone number are required.' };
    }
    if (!orderInput.items || orderInput.items.length === 0) {
      return { success: false, error: 'Please add at least one item to the order.' };
    }

    const createdProducts: Product[] = [];
    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    orderInput.items.forEach((item, index) => {
      const prodName = item.productName.trim() || `Pre-Order Item #${index + 1}`;
      const unitPrice = Math.max(0, item.sellingPrice || 0);
      const unitCost = Math.max(0, item.costPrice || 0);
      const qty = Math.max(1, item.quantity || 1);
      const itemSubtotal = unitPrice * qty;
      subtotal += itemSubtotal;

      const productId = `prod-${Date.now()}-${index}`;
      const variantId = `var-${Date.now()}-${index}`;
      const cleanSku =
        item.sheinSkuOrLink?.trim().slice(0, 24) || `SH-${Math.floor(100000 + Math.random() * 900000)}`;
      const variantSku = `${cleanSku}-${(item.size || 'OS').toUpperCase().trim()}-${(item.color || 'STD').toUpperCase().trim().slice(0, 3)}`;

      const userImg = item.imageUrl?.trim() || '';
      const images: ProductImage[] = userImg
        ? [
            {
              id: `img-${Date.now()}-${index}`,
              productId,
              imageUrl: userImg,
              altText: prodName,
              isPrimary: true,
              sortOrder: 1,
            },
          ]
        : [];

      const newProduct: Product = {
        id: productId,
        businessId: currentBusiness.id,
        categoryId: item.categoryId || categories[0]?.id || 'cat-top',
        sku: cleanSku,
        name: prodName,
        description: `Customer pre-order item (${item.sheinSkuOrLink || cleanSku}).`,
        details: [
          `Sourced via Shein Ref: ${item.sheinSkuOrLink || cleanSku}`,
          `Size: ${item.size || 'Standard'}`,
          `Color: ${item.color || 'Standard'}`,
          `Procured specifically per customer request`,
        ],
        costPrice: unitCost,
        sellingPrice: unitPrice,
        isActive: true,
        isPublished: true,
        isOnline: true,
        images,
        variants: [
          {
            id: variantId,
            productId,
            sku: variantSku,
            size: item.size || 'One Size',
            color: item.color || 'As Shown',
            stockQuantity: 0,
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      createdProducts.push(newProduct);

      orderItems.push({
        productId,
        productName: prodName,
        variantId,
        variantSummary: `${item.size || 'OS'} / ${item.color || 'Standard'}`,
        sku: variantSku,
        unitPrice,
        costPrice: unitCost,
        quantity: qty,
        imageUrl: userImg,
      });
    });

    const shippingCost =
      typeof orderInput.shippingCost === 'number'
        ? Math.max(0, orderInput.shippingCost)
        : subtotal >= currentBusiness.freeDeliveryThreshold
        ? 0
        : currentBusiness.deliveryFee;
    const taxRate = typeof orderInput.taxRate === 'number' ? Math.max(0, orderInput.taxRate) : 0;
    const taxAmount =
      typeof orderInput.taxAmount === 'number'
        ? Math.max(0, orderInput.taxAmount)
        : taxRate > 0
        ? Math.round((subtotal * taxRate) / 100)
        : 0;
    const total = subtotal + shippingCost + taxAmount;

    // Prepayment & Remaining balance calculation
    const rawAdvance = typeof orderInput.advancePaid === 'number' ? orderInput.advancePaid : undefined;
    let advancePaid = 0;
    let paymentStatus: PaymentStatus = 'UNPAID';

    if (rawAdvance !== undefined) {
      advancePaid = Math.max(0, Math.min(total, rawAdvance));
      if (advancePaid >= total) {
        paymentStatus = 'PAID';
      } else if (advancePaid > 0) {
        paymentStatus = 'PARTIALLY_PAID';
      } else if (orderInput.paymentMethod === 'CASH_ON_DELIVERY') {
        paymentStatus = 'PAYMENT_ON_DELIVERY';
      } else {
        paymentStatus = 'UNPAID';
      }
    } else {
      if (orderInput.paymentMethod === 'CASH_ON_DELIVERY') {
        paymentStatus = 'PAYMENT_ON_DELIVERY';
        advancePaid = 0;
      } else {
        paymentStatus = 'PAID';
        advancePaid = total;
      }
    }

    const remainingBalance = Math.max(0, total - advancePaid);
    const orderNumber = `SH-TG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const firstImage = orderItems.find((i) => i.imageUrl)?.imageUrl || orderInput.attachmentUrl;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      businessId: currentBusiness.id,
      source: 'TELEGRAM',
      status: 'CONFIRMED',
      paymentStatus,
      paymentMethod: orderInput.paymentMethod,
      customerName: orderInput.customerName.trim(),
      customerPhone: orderInput.customerPhone.trim(),
      customerTelegram: orderInput.customerTelegram?.trim() || undefined,
      deliveryAddress: orderInput.deliveryAddress.trim() || 'Addis Ababa (To be confirmed in chat)',
      deliveryOption: shippingCost > 0 ? 'Express / Courier Shipping' : 'Free Delivery / In-Store Pickup',
      notes: orderInput.notes?.trim() || undefined,
      items: orderItems,
      packageBatchId: orderInput.packageBatchId,
      attachmentUrl: firstImage || undefined,
      subtotal,
      deliveryFee: shippingCost,
      shippingCost,
      taxRate,
      taxAmount,
      total,
      advancePaid,
      remainingBalance,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      registeredBy: orderInput.registeredBy || 'Concierge Team',
    };

    setOrders((prev) => [newOrder, ...prev]);

    return { success: true, order: newOrder, products: createdProducts };
  };

  // Create single Shein order (delegates to createBulkSheinOrder for consistency)
  const createSheinOrderWithNewProduct = (orderInput: {
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    registeredBy: string;
    notes?: string;
    productName: string;
    sheinSkuOrLink: string;
    categoryId: string;
    size: string;
    color: string;
    quantity: number;
    costPrice: number;
    sellingPrice: number;
    shippingCost?: number;
    taxRate?: number;
    taxAmount?: number;
    imageUrl?: string;
    packageBatchId?: string;
    advancePaid?: number;
  }) => {
    const res = createBulkSheinOrder({
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      customerTelegram: orderInput.customerTelegram,
      deliveryAddress: orderInput.deliveryAddress,
      paymentMethod: orderInput.paymentMethod,
      advancePaid: orderInput.advancePaid,
      registeredBy: orderInput.registeredBy,
      notes: orderInput.notes,
      packageBatchId: orderInput.packageBatchId,
      attachmentUrl: orderInput.imageUrl,
      shippingCost: orderInput.shippingCost,
      taxRate: orderInput.taxRate,
      taxAmount: orderInput.taxAmount,
      items: [
        {
          productName: orderInput.productName,
          sheinSkuOrLink: orderInput.sheinSkuOrLink,
          categoryId: orderInput.categoryId,
          size: orderInput.size,
          color: orderInput.color,
          quantity: orderInput.quantity,
          costPrice: orderInput.costPrice,
          sellingPrice: orderInput.sellingPrice,
          imageUrl: orderInput.imageUrl,
        },
      ],
    });
    return {
      success: res.success,
      order: res.order,
      product: res.products?.[0],
      error: res.error,
    };
  };

  // Update order prepayment or settle remaining balance
  const updateOrderPayment = (orderId: string, advancePaid: number) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        const clampedPaid = Math.max(0, Math.min(o.total, advancePaid));
        const remaining = Math.max(0, o.total - clampedPaid);
        let paymentStatus: PaymentStatus = 'UNPAID';
        if (remaining === 0) {
          paymentStatus = 'PAID';
        } else if (clampedPaid > 0) {
          paymentStatus = 'PARTIALLY_PAID';
        } else if (o.paymentMethod === 'CASH_ON_DELIVERY') {
          paymentStatus = 'PAYMENT_ON_DELIVERY';
        }

        return {
          ...o,
          advancePaid: clampedPaid,
          remainingBalance: remaining,
          paymentStatus,
        };
      })
    );
  };

  // Register order manually (e.g. employee registering a Telegram order or in-store order)
  const registerManualOrder = (orderInput: {
    source: OrderSource;
    customerName: string;
    customerPhone: string;
    customerTelegram?: string;
    deliveryAddress: string;
    paymentMethod: PaymentMethod;
    items: { productId: string; variantId: string; quantity: number }[];
    registeredBy: string;
    notes?: string;
    attachmentUrl?: string;
  }) => {
    if (orderInput.items.length === 0) {
      return { success: false, error: 'No items selected.' };
    }

    // Check stock for all items
    for (const item of orderInput.items) {
      const prod = products.find((p) => p.id === item.productId);
      if (!prod) return { success: false, error: 'Product not found.' };
      const variant = prod.variants.find((v) => v.id === item.variantId);
      if (!variant || variant.stockQuantity < item.quantity) {
        return {
          success: false,
          error: `Insufficient stock for ${prod.name} (${variant?.size} / ${variant?.color}). Available: ${variant?.stockQuantity || 0}`,
        };
      }
    }

    // Deduct stock
    setProducts((prev) =>
      prev.map((p) => {
        const orderItemsForProduct = orderInput.items.filter((i) => i.productId === p.id);
        if (orderItemsForProduct.length === 0) return p;

        const updatedVariants = p.variants.map((v) => {
          const matched = orderItemsForProduct.find((i) => i.variantId === v.id);
          if (!matched) return v;
          return {
            ...v,
            stockQuantity: Math.max(0, v.stockQuantity - matched.quantity),
          };
        });

        return {
          ...p,
          variants: updatedVariants,
          updatedAt: new Date().toISOString(),
        };
      })
    );

    // Compute order items
    let subtotal = 0;
    const formattedItems = orderInput.items.map((item) => {
      const prod = products.find((p) => p.id === item.productId)!;
      const variant = prod.variants.find((v) => v.id === item.variantId)!;
      const unitPrice = prod.discountPrice || prod.sellingPrice;
      subtotal += unitPrice * item.quantity;
      return {
        productId: prod.id,
        productName: prod.name,
        variantId: variant.id,
        variantSummary: `${variant.size} / ${variant.color}`,
        sku: variant.sku,
        unitPrice,
        quantity: item.quantity,
        imageUrl: prod.images[0]?.imageUrl || '',
      };
    });

    const deliveryFee = subtotal >= currentBusiness.freeDeliveryThreshold ? 0 : currentBusiness.deliveryFee;
    const total = subtotal + deliveryFee;

    const prefix = orderInput.source === 'TELEGRAM' ? 'TG' : orderInput.source === 'WALK_IN' ? 'POS' : 'ORD';
    const orderNumber = `${prefix}-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      businessId: currentBusiness.id,
      source: orderInput.source,
      status: 'CONFIRMED',
      paymentStatus:
        orderInput.paymentMethod === 'CASH_ON_DELIVERY' ? 'PAYMENT_ON_DELIVERY' : 'PAID',
      paymentMethod: orderInput.paymentMethod,
      customerName: orderInput.customerName,
      customerPhone: orderInput.customerPhone,
      customerTelegram: orderInput.customerTelegram,
      deliveryAddress: orderInput.deliveryAddress,
      deliveryOption: 'Standard Courier',
      notes: orderInput.notes,
      attachmentUrl: orderInput.attachmentUrl?.trim() || undefined,
      items: formattedItems,
      subtotal,
      deliveryFee,
      total,
      createdAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      registeredBy: orderInput.registeredBy,
    };

    setOrders((prev) => [newOrder, ...prev]);
    return { success: true, order: newOrder };
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          status,
          ...(paymentStatus ? { paymentStatus } : {}),
        };
      })
    );
  };

  const deleteOrder = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    if (lastPlacedOrder?.id === orderId) {
      setLastPlacedOrder(null);
    }
  };

  const deleteOrderItem = (orderId: string, itemIndex: number, restoreStock: boolean = false) => {
    setOrders((prev) => {
      const order = prev.find((o) => o.id === orderId);
      if (!order) return prev;
      const itemToDelete = order.items[itemIndex];

      if (restoreStock && itemToDelete && itemToDelete.productId && itemToDelete.variantId) {
        setProducts((prodPrev) =>
          prodPrev.map((p) => {
            if (p.id !== itemToDelete.productId) return p;
            return {
              ...p,
              variants: p.variants.map((v) =>
                v.id === itemToDelete.variantId
                  ? { ...v, stockQuantity: v.stockQuantity + itemToDelete.quantity }
                  : v
              ),
              updatedAt: new Date().toISOString(),
            };
          })
        );
      }

      const updatedItems = order.items.filter((_, idx) => idx !== itemIndex);
      if (updatedItems.length === 0) {
        return prev.filter((o) => o.id !== orderId);
      }

      const newSubtotal = updatedItems.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
      return prev.map((o) =>
        o.id === orderId
          ? {
              ...o,
              items: updatedItems,
              subtotal: newSubtotal,
              total: newSubtotal + (o.deliveryFee || 0) + (o.taxAmount || 0),
            }
          : o
      );
    });
  };

  const assignOrderToPackageBatch = (orderId: string, packageBatchId: string | undefined) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, packageBatchId } : o))
    );
  };

  const bulkAssignOrdersToPackageBatch = (orderIds: string[], packageBatchId: string | undefined) => {
    const idSet = new Set(orderIds);
    setOrders((prev) =>
      prev.map((o) => (idSet.has(o.id) ? { ...o, packageBatchId } : o))
    );
  };

  // Package Batches (Whole Orders Tracker) CRUD
  const addPackageBatch = (batchInput: Omit<PackageBatch, 'id' | 'businessId' | 'createdAt'>): PackageBatch => {
    const newBatch: PackageBatch = {
      ...batchInput,
      id: `batch-${Date.now()}`,
      businessId: currentBusiness.id,
      createdAt: new Date().toISOString(),
    };
    setPackageBatches((prev) => [newBatch, ...prev]);
    return newBatch;
  };

  const updatePackageBatch = (updatedBatch: PackageBatch) => {
    setPackageBatches((prev) =>
      prev.map((b) => (b.id === updatedBatch.id ? updatedBatch : b))
    );
  };

  const deletePackageBatch = (batchId: string) => {
    setPackageBatches((prev) => prev.filter((b) => b.id !== batchId));
    setOrders((prev) =>
      prev.map((o) => (o.packageBatchId === batchId ? { ...o, packageBatchId: undefined } : o))
    );
  };

  const updateBusinessSettings = (updated: Partial<Business>) => {
    setBusinesses((prev) =>
      prev.map((b) => (b.id === currentBusiness.id ? { ...b, ...updated } : b))
    );
  };

  const businessOrders = useMemo(() => {
    return orders.filter((o) => o.businessId === currentBusiness.id);
  }, [orders, currentBusiness.id]);

  const businessPackageBatches = useMemo(() => {
    return packageBatches.filter(
      (b) => b.businessId === currentBusiness.id || b.businessId === 'biz-mira'
    );
  }, [packageBatches, currentBusiness.id]);

  return (
    <RetailContext.Provider
      value={{
        currentBusiness,
        businesses,
        switchBusiness,
        activeView,
        setActiveView,
        storefrontTab,
        setStorefrontTab,
        adminTab,
        setAdminTab,

        products: businessProducts,
        publishedProducts,
        categories: categories.filter((c) => c.businessId === currentBusiness.id || c.businessId === 'biz-mira'),
        addCategory,
        selectedCategory,
        setSelectedCategory,
        searchQuery,
        setSearchQuery,
        selectedProduct,
        setSelectedProduct,

        addProduct,
        updateProduct,
        deleteProduct,
        toggleProductVisibility,
        updateVariantStock,

        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartCount,
        cartSubtotal,
        isCartOpen,
        setIsCartOpen,

        isCheckoutOpen,
        setIsCheckoutOpen,
        checkoutOnline,

        telegramModalData,
        openTelegramOrderModal,
        closeTelegramOrderModal,
        buildTelegramDeepLink,

        orders: businessOrders,
        packageBatches: businessPackageBatches,
        addPackageBatch,
        updatePackageBatch,
        deletePackageBatch,
        createBulkSheinOrder,
        createSheinOrderWithNewProduct,
        updateOrderPayment,
        registerManualOrder,
        updateOrderStatus,
        deleteOrder,
        deleteOrderItem,
        assignOrderToPackageBatch,
        bulkAssignOrdersToPackageBatch,

        customerProfile,
        setCustomerProfile,
        isAccountOpen,
        setIsAccountOpen,
        lastPlacedOrder,
        setLastPlacedOrder,

        updateBusinessSettings,
        clearAllData: () => {
          setProducts([]);
          setOrders([]);
          setPackageBatches([]);
          setCategories(INITIAL_CATEGORIES);
          try {
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.PACKAGE_BATCHES, JSON.stringify([]));
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
          } catch {}
        },
      }}
    >
      {children}
    </RetailContext.Provider>
  );
};

export const useRetail = () => {
  const context = useContext(RetailContext);
  if (!context) {
    throw new Error('useRetail must be used within a RetailProvider');
  }
  return context;
};
