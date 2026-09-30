import React, { useState, useRef, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Order, OrderStatus, PaymentMethod, Product } from '../../types';
import { WholeOrdersTracker } from './WholeOrdersTracker';
import { compressImage } from '../../utils/imageCompression';
import {
  DateRangeFilter,
  DateFilterState,
  isDateInFilter,
  formatDisplayDate,
} from '../common/DateRangeFilter';
import {
  Check,
  Search,
  AlertCircle,
  Sparkles,
  PackagePlus,
  Phone,
  MessageSquare,
  Truck,
  Receipt,
  Upload,
  Image as ImageIcon,
  Link2,
  X,
  Eye,
  FileText,
  DollarSign,
  Percent,
  CheckCircle2,
  ShoppingBag,
  Calendar,
  ArrowUpDown,
  Boxes,
  Layers,
  Tag,
  Trash2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';

const FASHION_PRESETS = [
  {
    name: 'Satin Slip Top',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Lace Bralette',
    url: 'https://images.unsplash.com/photo-1574015974293-817f0ebebb74?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Casual Ribbed Knit',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cocktail Midi Dress',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Tailored Blazer',
    url: 'https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800&auto=format&fit=crop&q=80',
  },
];

export const OrdersManagement: React.FC = () => {
  const {
    orders,
    packageBatches,
    currentBusiness,
    categories,
    products,
    createSheinOrderWithNewProduct,
    updateOrderStatus,
    deleteOrder,
    addPackageBatch,
    assignOrderToPackageBatch,
  } = useRetail();

  const [deleteOrderTarget, setDeleteOrderTarget] = useState<Order | null>(null);

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [ordersTab, setOrdersTab] = useState<'packages' | 'orders'>('packages');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'ALL',
    startDate: '',
    endDate: '',
  });
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  // ----------------------------------------------------
  // Create Order Modal State
  // ----------------------------------------------------
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState<string>('batch-001');
  const [isCreatingNewBatchInModal, setIsCreatingNewBatchInModal] = useState(false);
  const [newBatchLabelInModal, setNewBatchLabelInModal] = useState('');
  const [newBatchNameInModal, setNewBatchNameInModal] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('+251 9');
  const [customerTelegram, setCustomerTelegram] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('Addis Ababa');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [registeredBy, setRegisteredBy] = useState('Orders Desk');
  const [notes, setNotes] = useState('Customer selected piece from Shein app');

  // Product details to create or link
  const [orderItemSourceMode, setOrderItemSourceMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('ALL');
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<Product | null>(null);

  // Lightbox / Image Zoom Modal
  const [previewImageModal, setPreviewImageModal] = useState<{
    url: string;
    title: string;
    subtitle?: string;
  } | null>(null);

  const [productName, setProductName] = useState('');
  const [sheinSkuOrLink, setSheinSkuOrLink] = useState('');
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.slug === 'top')?.id || categories[0]?.id || ''
  );
  const [size, setSize] = useState('M');
  const [color, setColor] = useState('Black');
  const [quantity, setQuantity] = useState(1);
  const [costPrice, setCostPrice] = useState(850);
  const [sellingPrice, setSellingPrice] = useState(1750);

  // Image states
  const [imageUrl, setImageUrl] = useState('');
  const [imageTab, setImageTab] = useState<'upload' | 'url' | 'presets'>('upload');
  const [isImageLoading, setIsImageLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Shipping & Tax states
  const [shippingCost, setShippingCost] = useState<number>(200); // Default to standard local shipping
  const [taxMode, setTaxMode] = useState<'NONE' | 'VAT_15' | 'CUSTOM'>('NONE');
  const [customTaxRate, setCustomTaxRate] = useState<number>(15);
  const [errorMessage, setErrorMessage] = useState('');

  // Selected Order for Receipt / Details Modal
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);

  // Filtered Catalog Products for selection
  const filteredCatalogProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !catalogSearchQuery.trim() ||
        p.name.toLowerCase().includes(catalogSearchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(catalogSearchQuery.toLowerCase());
      const matchesCat = catalogCategoryFilter === 'ALL' || p.categoryId === catalogCategoryFilter;
      return matchesSearch && matchesCat;
    });
  }, [products, catalogSearchQuery, catalogCategoryFilter]);

  const handleSelectCatalogProduct = (product: Product) => {
    setSelectedCatalogProduct(product);
    setProductName(product.name);
    setSheinSkuOrLink(product.sku);
    setCategoryId(product.categoryId);
    setCostPrice(product.costPrice || Math.round(product.sellingPrice * 0.55));
    setSellingPrice(product.sellingPrice);
    const primaryImg = product.images?.[0]?.imageUrl || '';
    if (primaryImg) {
      setImageUrl(primaryImg);
    }
    if (product.variants && product.variants.length > 0) {
      setSize(product.variants[0].size || 'M');
      setColor(product.variants[0].color || 'Standard');
    }
  };

  // Calculations for Order Modal
  const itemsSubtotal = Math.max(0, sellingPrice * quantity);
  const taxRatePercent = taxMode === 'NONE' ? 0 : taxMode === 'VAT_15' ? 15 : Math.max(0, customTaxRate);
  const calculatedTax = taxRatePercent > 0 ? Math.round((itemsSubtotal * taxRatePercent) / 100) : 0;
  const calculatedTotal = itemsSubtotal + Math.max(0, shippingCost) + calculatedTax;

  // Handlers for Order Modal
  const handleOpenOrderModal = () => {
    setErrorMessage('');
    setShippingCost(currentBusiness.deliveryFee || 200);
    setTaxMode('NONE');
    setImageUrl('');
    setSelectedCatalogProduct(null);
    setOrderItemSourceMode('catalog');
    setIsOrderModalOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 20MB. Please choose a smaller photo.');
      return;
    }

    setIsImageLoading(true);
    setErrorMessage('');
    try {
      const compressed = await compressImage(file, 1024, 1024, 0.75);
      setImageUrl(compressed);
    } catch (err) {
      setErrorMessage('Could not load image file. Please try pasting a direct image link.');
    } finally {
      setIsImageLoading(false);
    }
  };

  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!customerName.trim() || !customerPhone.trim()) {
      setErrorMessage('Please enter the customer name and phone number.');
      return;
    }
    if (!productName.trim()) {
      setErrorMessage('Please enter the product name or title.');
      return;
    }
    if (!sellingPrice || sellingPrice <= 0) {
      setErrorMessage('Please enter a valid quoted selling price in ETB.');
      return;
    }

    let batchIdToUse = selectedBatchId || undefined;

    if (isCreatingNewBatchInModal && newBatchLabelInModal.trim()) {
      const createdBatch = addPackageBatch({
        batchCode: newBatchLabelInModal.trim().toUpperCase(),
        batchName: newBatchNameInModal.trim() || undefined,
        sourceCurrency: 'AED',
        sourceAmount: Math.round(((costPrice * quantity) / 61.65) * 100) / 100 || 200,
        exchangeRate: 61.65,
        totalPackageCost: costPrice * quantity + 1500,
        packageShippingCost: 1500,
        packageCustomsTax: 500,
        targetExpectedSales: sellingPrice * quantity * 1.25,
        status: 'ORDERED',
        orderDate: new Date().toISOString(),
      });
      batchIdToUse = createdBatch.id;
    }

    const res = createSheinOrderWithNewProduct({
      customerName,
      customerPhone,
      customerTelegram: customerTelegram.trim() || undefined,
      deliveryAddress,
      paymentMethod,
      registeredBy,
      notes,
      productName,
      sheinSkuOrLink: sheinSkuOrLink || `SH-${Math.floor(100000 + Math.random() * 900000)}`,
      categoryId,
      size,
      color,
      quantity,
      costPrice,
      sellingPrice,
      shippingCost: Math.max(0, shippingCost),
      taxRate: taxRatePercent,
      taxAmount: calculatedTax,
      imageUrl: imageUrl.trim() || undefined,
      packageBatchId: batchIdToUse,
    });

    if (res.success) {
      setIsOrderModalOpen(false);
      setIsCreatingNewBatchInModal(false);
      setNewBatchLabelInModal('');
      setNewBatchNameInModal('');
      setCustomerName('');
      setCustomerPhone('+251 9');
      setCustomerTelegram('');
      setProductName('');
      setSheinSkuOrLink('');
      setImageUrl('');
      setShippingCost(200);
      setTaxMode('NONE');
    } else {
      setErrorMessage(res.error || 'Failed to create order.');
    }
  };

  // Filtered orders with status, date, search and sorting
  // Note: Strictly focused on Pre-Orders / Shein / Import orders (In-stock sales belong to Inventory tab)
  const customerPreOrders = useMemo(() => {
    return orders.filter((o) => o.source !== 'WALK_IN');
  }, [orders]);

  const filteredOrders = customerPreOrders
    .filter((o) => {
      if (statusFilter !== 'ALL' && o.status !== statusFilter) return false;
      if (!isDateInFilter(o.createdAt, dateFilter)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchName = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.toLowerCase().includes(q);
        const matchItem = o.items.some((item) => item.productName.toLowerCase().includes(q));
        if (!matchNum && !matchName && !matchPhone && !matchItem) return false;
      }
      return true;
    })
    .sort((a, b) => {
      const timeA = new Date(a.createdAt).getTime();
      const timeB = new Date(b.createdAt).getTime();
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 font-semibold text-[11px] border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Customer Pre-Orders</span>
          </div>
          <h2 className="text-xl font-serif font-bold text-stone-900">
            Customer Orders
          </h2>
          <p className="text-xs text-stone-600 leading-relaxed max-w-2xl">
            Register orders for customer-selected items from the Shein app. Add custom images, item specifications, local shipping costs, and tax breakdown.
          </p>
        </div>

        {/* Action Button */}
        <button
          onClick={handleOpenOrderModal}
          className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all shadow-xs text-xs shrink-0 self-start sm:self-auto cursor-pointer"
        >
          <PackagePlus className="w-4 h-4 text-amber-400" />
          <span>+ Create Order</span>
        </button>
      </div>

      {/* Sub-Tabs: Whole Orders / Packages vs Customer Orders */}
      <div className="flex border-b border-stone-200">
        <button
          type="button"
          onClick={() => setOrdersTab('packages')}
          className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            ordersTab === 'packages'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Boxes className="w-4 h-4 text-amber-600" />
          <span>Whole Orders / Packages</span>
          <span className="bg-amber-100 text-amber-900 text-[11px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
            {packageBatches.length} batches
          </span>
        </button>

        <button
          type="button"
          onClick={() => setOrdersTab('orders')}
          className={`pb-3 px-1 ml-8 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
            ordersTab === 'orders'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800 font-medium'
          }`}
        >
          <Receipt className="w-4 h-4 text-stone-500" />
          <span>All Customer Orders</span>
          <span className="bg-stone-100 text-stone-700 text-[11px] font-bold px-2 py-0.5 rounded-full border border-stone-200">
            {customerPreOrders.length}
          </span>
        </button>
      </div>

      {/* VIEW 1: WHOLE ORDERS / PACKAGES TRACKER */}
      {ordersTab === 'packages' ? (
        <WholeOrdersTracker onSelectOrder={(order) => setViewingOrder(order)} />
      ) : (
        /* VIEW 2: ALL CUSTOMER ORDERS (Grouped by Order #) */
        <div className="space-y-4">
          {/* Filter and Search Bar for Orders */}
          <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by order #, customer, phone, item..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-md border border-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">Date:</span>
                <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center bg-stone-100 p-0.5 rounded-md border border-stone-200">
                {(['ALL', 'CONFIRMED', 'PROCESSING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                        statusFilter === st
                          ? 'bg-white text-stone-900 shadow-xs font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      {st === 'ALL'
                        ? 'All'
                        : st === 'OUT_FOR_DELIVERY'
                        ? 'In Transit'
                        : st.charAt(0) + st.slice(1).toLowerCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Active Date Filter Chip */}
              {dateFilter.preset !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-amber-100 text-amber-900 border border-amber-300 font-medium">
                  <Calendar className="w-3 h-3 text-amber-700" />
                  <span>Date active</span>
                </span>
              )}

              {/* Sort Order Toggle */}
              <button
                type="button"
                onClick={() => setSortOrder((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2 py-1 rounded border border-stone-200"
                title="Toggle Date Order"
              >
                <ArrowUpDown className="w-3 h-3" />
                <span>{sortOrder === 'desc' ? 'Newest first' : 'Oldest first'}</span>
              </button>

              <div className="text-stone-500 font-medium text-xs">
                Showing <strong>{filteredOrders.length}</strong> of {customerPreOrders.length} pre-orders
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-3.5">
                  <div className="flex items-center gap-1">
                    <span>Order Ref & Date</span>
                  </div>
                </th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Item & Photo</th>
                <th className="p-3.5">Total & Financials</th>
                <th className="p-3.5">Profit (Margin)</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    <Calendar className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <div>No orders found matching the filter criteria or date range.</div>
                    {dateFilter.preset !== 'ALL' && (
                      <button
                        type="button"
                        onClick={() => setDateFilter({ preset: 'ALL', startDate: '', endDate: '' })}
                        className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
                      >
                        Reset Date Filter to All Time
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const effectiveShipping = o.shippingCost ?? o.deliveryFee ?? 0;
                  const effectiveTax = o.taxAmount ?? 0;
                  const orderCost = o.items.reduce((s, it) => s + ((it.costPrice || 0) * it.quantity), 0);
                  const orderRevenue = o.subtotal || o.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
                  const orderProfit = orderRevenue - orderCost;
                  const orderMarginPercent = orderRevenue > 0 ? Math.round((orderProfit / orderRevenue) * 100) : 0;

                  return (
                    <tr key={o.id} className="hover:bg-stone-50/60 transition-colors">
                      {/* Order Ref & Date */}
                      <td className="p-3.5 font-mono font-medium text-stone-900">
                        <div className="font-semibold text-stone-900 flex items-center gap-1.5">
                          <span>{o.orderNumber}</span>
                          {o.packageBatchId && (
                            <span className="font-sans text-[10px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium border border-amber-300">
                              {packageBatches.find((b) => b.id === o.packageBatchId)?.batchCode || 'Batch'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-600 font-sans font-medium mt-0.5 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          <span>{formatDisplayDate(o.createdAt)}</span>
                        </div>
                        <div className="text-[10px] text-stone-400 font-sans mt-0.5">
                          {new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        {o.registeredBy && (
                          <div className="text-[10px] text-stone-500 font-sans mt-0.5 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-300"></span>
                            <span>{o.registeredBy}</span>
                          </div>
                        )}
                      </td>

                      {/* Customer Info */}
                      <td className="p-3.5">
                        <div className="font-semibold text-stone-900">{o.customerName}</div>
                        <div className="text-[11px] text-stone-600 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-stone-400" />
                          <span>{o.customerPhone}</span>
                        </div>
                        {o.customerTelegram && (
                          <div className="text-[10px] text-sky-700 font-mono mt-0.5">
                            {o.customerTelegram}
                          </div>
                        )}
                        {o.deliveryAddress && (
                          <div className="text-[10px] text-stone-400 truncate max-w-[180px] mt-0.5">
                            {o.deliveryAddress}
                          </div>
                        )}
                      </td>

                      {/* Item & Photo */}
                      <td className="p-3.5 max-w-[280px]">
                        <div className="space-y-1.5">
                          {o.items.map((i, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              {i.imageUrl ? (
                                <img
                                  src={i.imageUrl}
                                  alt={i.productName}
                                  className="w-10 h-11 rounded-md object-cover border border-stone-200 shrink-0 bg-stone-100 shadow-2xs"
                                />
                              ) : (
                                <div className="w-10 h-11 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-[10px] text-stone-400">
                                  <ImageIcon className="w-4 h-4 text-stone-300" />
                                </div>
                              )}
                              <div className="truncate">
                                <span className="font-semibold text-stone-900 block truncate">
                                  {i.productName}
                                </span>
                                <span className="text-[11px] text-stone-500 font-medium">
                                  {i.variantSummary} · Qty: {i.quantity}
                                </span>
                                {i.sku && (
                                  <span className="text-[10px] text-stone-400 font-mono block truncate">
                                    SKU: {i.sku}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Total & Financial Breakdown */}
                      <td className="p-3.5">
                        <div className="font-bold text-stone-900 text-sm tabular-nums">
                          {o.total.toLocaleString()} {currentBusiness.currency}
                        </div>

                        {/* Breakdown Pills: Subtotal, Shipping, Tax */}
                        <div className="flex flex-wrap items-center gap-1 mt-1">
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-medium">
                            Sub: {o.subtotal.toLocaleString()}
                          </span>

                          {effectiveShipping > 0 ? (
                            <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-medium flex items-center gap-0.5">
                              <Truck className="w-2.5 h-2.5" />
                              <span>+{effectiveShipping.toLocaleString()}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded font-medium">
                              Free Ship
                            </span>
                          )}

                          {effectiveTax > 0 && (
                            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                              +{effectiveTax.toLocaleString()} Tax ({o.taxRate || 15}%)
                            </span>
                          )}
                        </div>

                        {/* Payment Method & Pre-Payment / Balance */}
                        <div className="text-[10px] text-stone-500 flex items-center gap-1 mt-1">
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              o.paymentStatus === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                          />
                          <span>{o.paymentMethod.replace(/_/g, ' ')}</span>
                        </div>

                        {o.remainingBalance !== undefined && o.remainingBalance > 0 && (
                          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold mt-1 inline-block">
                            Deposit: {(o.advancePaid || 0).toLocaleString()} · Due: {o.remainingBalance.toLocaleString()} {currentBusiness.currency}
                          </div>
                        )}
                      </td>

                      {/* Profit (Margin) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono text-xs tabular-nums ${
                              orderProfit >= 0 ? 'text-emerald-700' : 'text-rose-600'
                            }`}
                          >
                            {orderProfit >= 0 ? '+' : ''}{orderProfit.toLocaleString()} {currentBusiness.currency}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                              orderMarginPercent >= 40
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : orderMarginPercent >= 20
                                ? 'bg-sky-50 text-sky-800 border-sky-200'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            +{orderMarginPercent}%
                          </span>
                        </div>
                        <div className="text-[10px] text-stone-500 font-medium mt-1 flex items-center gap-1.5 font-mono">
                          <span>Cost: {orderCost.toLocaleString()}</span>
                          <span className="text-stone-300">•</span>
                          <span>Rev: {orderRevenue.toLocaleString()}</span>
                        </div>
                      </td>

                      {/* Status Select */}
                      <td className="p-3.5">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as OrderStatus)}
                          className={`text-[11px] font-semibold px-2 py-1 rounded border capitalize cursor-pointer focus:outline-none ${
                            o.status === 'DELIVERED'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : o.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : o.status === 'PROCESSING'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : o.status === 'CONFIRMED'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right">
                        <div className="inline-flex items-center gap-2 justify-end">
                          {/* View Receipt / Details Button */}
                          <button
                            onClick={() => setViewingOrder(o)}
                            className="p-1.5 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-md transition-colors"
                            title="View Order Receipt & Breakdown"
                          >
                            <Receipt className="w-4 h-4 text-stone-600" />
                          </button>

                          {o.customerTelegram ? (
                            <a
                              href={`https://t.me/${o.customerTelegram.replace('@', '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[#0284c7] hover:underline font-semibold bg-sky-50 px-2 py-1 rounded border border-sky-200"
                            >
                              <MessageSquare className="w-3 h-3" />
                              <span>Chat</span>
                            </a>
                          ) : (
                            <a
                              href={`tel:${o.customerPhone}`}
                              className="inline-flex items-center gap-1 text-[11px] text-stone-700 hover:text-stone-900 font-semibold bg-stone-100 px-2 py-1 rounded border border-stone-200"
                            >
                              <Phone className="w-3 h-3" />
                              <span>Call</span>
                            </a>
                          )}

                          {/* Delete Order Button */}
                          <button
                            type="button"
                            onClick={() => setDeleteOrderTarget(o)}
                            className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete Order"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filteredOrders.length > 0 && (() => {
              const totalOrdersCount = filteredOrders.length;
              const totalGrossRevenue = filteredOrders.reduce((sum, o) => sum + o.total, 0);
              const totalGrossSubtotal = filteredOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
              const totalGrossCost = filteredOrders.reduce(
                (sum, o) => sum + o.items.reduce((s, it) => s + ((it.costPrice || 0) * it.quantity), 0),
                0
              );
              const totalGrossProfit = totalGrossSubtotal - totalGrossCost;
              const overallGrossMargin =
                totalGrossSubtotal > 0 ? Math.round((totalGrossProfit / totalGrossSubtotal) * 100) : 0;
              const totalGrossShipping = filteredOrders.reduce(
                (sum, o) => sum + (o.shippingCost ?? o.deliveryFee ?? 0),
                0
              );
              const totalGrossTax = filteredOrders.reduce((sum, o) => sum + (o.taxAmount ?? 0), 0);
              const totalUnits = filteredOrders.reduce(
                (sum, o) => sum + o.items.reduce((s, it) => s + it.quantity, 0),
                0
              );

              return (
                <tfoot className="bg-stone-50 border-t-2 border-stone-300 font-medium text-stone-800">
                  <tr>
                    <td colSpan={3} className="p-3.5 font-bold text-stone-900 text-xs uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Gross Orders Totals ({totalOrdersCount} Orders · {totalUnits} Units)</span>
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Revenue / Sales:</div>
                      <div className="font-bold text-stone-900 text-xs font-mono">
                        {totalGrossRevenue.toLocaleString()} {currentBusiness.currency}
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        Sub: {totalGrossSubtotal.toLocaleString()}
                        {totalGrossShipping > 0 ? ` · Ship: +${totalGrossShipping.toLocaleString()}` : ''}
                        {totalGrossTax > 0 ? ` · Tax: +${totalGrossTax.toLocaleString()}` : ''}
                      </div>
                    </td>
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Profit:</div>
                      <div className="font-bold text-emerald-700 text-sm font-mono flex items-center gap-1.5 mt-0.5">
                        <span>+{totalGrossProfit.toLocaleString()} {currentBusiness.currency}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          +{overallGrossMargin}%
                        </span>
                      </div>
                      <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                        Total Cost: {totalGrossCost.toLocaleString()} {currentBusiness.currency}
                      </div>
                    </td>
                    <td colSpan={2} className="p-3.5 text-right text-stone-400 text-[11px]">
                      Cumulative gross performance for filtered orders
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>
    </div>
    )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: Create Customer Order (With Image, Shipping Cost & Tax)    */}
      {/* ---------------------------------------------------------------- */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden my-6">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base font-serif">Create Customer Order</h3>
                  <p className="text-xs text-stone-300">
                    Add Shein item image, size/color variant, quoted price, shipping & tax
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOrderModalOpen(false)}
                className="text-stone-400 hover:text-white text-lg p-1.5 rounded-lg hover:bg-stone-800 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleOrderSubmit} className="p-6 space-y-5 text-xs max-h-[82vh] overflow-y-auto">
              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Package Batch Assignment */}
              <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-amber-700" />
                    <span>Package / Shipment Batch Tag</span>
                  </span>
                  <div className="flex items-center gap-1 bg-amber-100/80 p-0.5 rounded-lg border border-amber-300">
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewBatchInModal(false)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                        !isCreatingNewBatchInModal
                          ? 'bg-amber-900 text-white shadow-2xs'
                          : 'text-amber-900 hover:bg-amber-200/60'
                      }`}
                    >
                      Choose Existing
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreatingNewBatchInModal(true)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded transition-colors ${
                        isCreatingNewBatchInModal
                          ? 'bg-amber-900 text-white shadow-2xs'
                          : 'text-amber-900 hover:bg-amber-200/60'
                      }`}
                    >
                      + Label New Package
                    </button>
                  </div>
                </div>

                {!isCreatingNewBatchInModal ? (
                  <div>
                    <select
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-amber-300 bg-white font-medium text-stone-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="">-- No Package Assigned (Unbatched) --</option>
                      {packageBatches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.batchCode} {b.batchName ? `· ${b.batchName}` : ''} ({b.status.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-stone-600 mt-1">
                      Attaches this ordered item to the selected import package, automatically factoring into that package's expenditure and sales profit reconciliation.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 bg-white p-3 rounded-lg border border-amber-300">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          New Package Label / Tracking Code *
                        </label>
                        <input
                          type="text"
                          required={isCreatingNewBatchInModal}
                          value={newBatchLabelInModal}
                          onChange={(e) => setNewBatchLabelInModal(e.target.value)}
                          placeholder="e.g. BATCH-004 or SH-PKG-JUN-01"
                          className="w-full p-2 rounded-md border border-stone-300 font-mono uppercase font-semibold text-xs focus:ring-1 focus:ring-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                          Package Description / Flight Note
                        </label>
                        <input
                          type="text"
                          value={newBatchNameInModal}
                          onChange={(e) => setNewBatchNameInModal(e.target.value)}
                          placeholder="e.g. Dubai Air Freight - Week 2"
                          className="w-full p-2 rounded-md border border-stone-300 text-xs"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-amber-900 font-medium">
                      ✓ A new shipment package will be registered and this order will be labeled under it immediately.
                    </p>
                  </div>
                )}
              </div>

              {/* SECTION 1: Customer Information */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider block">
                  1. Customer Details
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Bethlehem Tilahun"
                      className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="+251 91 ..."
                      className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Telegram / Username (Optional)</label>
                    <input
                      type="text"
                      value={customerTelegram}
                      onChange={(e) => setCustomerTelegram(e.target.value)}
                      placeholder="@username"
                      className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">Delivery Destination / Address</label>
                    <input
                      type="text"
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Bole, Addis Ababa"
                      className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: Item Details */}
              <div className="bg-amber-50/40 p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-amber-950 text-xs uppercase tracking-wider block">
                    2. Shein Item Information
                  </span>
                  <div className="flex items-center gap-1 bg-white/80 p-0.5 rounded-lg border border-amber-200 text-xs">
                    <button
                      type="button"
                      onClick={() => setOrderItemSourceMode('catalog')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        orderItemSourceMode === 'catalog'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Pick Catalog Item ({products.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setOrderItemSourceMode('custom');
                        setSelectedCatalogProduct(null);
                      }}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                        orderItemSourceMode === 'custom'
                          ? 'bg-stone-900 text-white shadow-2xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      + Custom Shein Sourcing
                    </button>
                  </div>
                </div>

                {/* Sub-mode A: Catalog Item Selector */}
                {orderItemSourceMode === 'catalog' && (
                  <div className="space-y-3">
                    {selectedCatalogProduct ? (
                      /* Selected Product Visual Card */
                      <div className="bg-white p-3 rounded-xl border border-amber-300 shadow-2xs space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Attached Catalog Item</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedCatalogProduct(null)}
                            className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                          >
                            Change Item
                          </button>
                        </div>

                        <div className="flex items-start gap-3">
                          <div
                            className="relative group/selImg shrink-0 cursor-pointer"
                            onClick={() => {
                              const img = selectedCatalogProduct.images?.[0]?.imageUrl || imageUrl;
                              if (img) {
                                setPreviewImageModal({
                                  url: img,
                                  title: selectedCatalogProduct.name,
                                  subtitle: `SKU: ${selectedCatalogProduct.sku} · ${selectedCatalogProduct.sellingPrice.toLocaleString()} ${currentBusiness.currency}`,
                                });
                              }
                            }}
                            title="Click to zoom image"
                          >
                            <img
                              src={selectedCatalogProduct.images?.[0]?.imageUrl || imageUrl}
                              alt={selectedCatalogProduct.name}
                              className="w-16 h-20 rounded-lg object-cover border border-amber-200 bg-stone-50 group-hover/selImg:brightness-95 transition-all shadow-2xs"
                            />
                            <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/selImg:opacity-100 flex items-center justify-center rounded-lg text-white transition-opacity">
                              <Eye className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1 space-y-1">
                            <h4 className="font-bold text-stone-900 text-xs truncate">
                              {selectedCatalogProduct.name}
                            </h4>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                              <span className="font-mono bg-stone-100 px-1.5 py-0.5 rounded font-medium text-stone-700">
                                {selectedCatalogProduct.sku}
                              </span>
                              <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-medium">
                                {categories.find((c) => c.id === selectedCatalogProduct.categoryId)?.name || 'Fashion'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 pt-1 text-xs">
                              <div>
                                <span className="text-[10px] text-stone-400 block">Unit Price</span>
                                <span className="font-bold text-stone-900">
                                  {selectedCatalogProduct.sellingPrice.toLocaleString()} {currentBusiness.currency}
                                </span>
                              </div>
                              <div className="border-l border-stone-200 pl-3">
                                <span className="text-[10px] text-stone-400 block">Cost Price</span>
                                <span className="font-semibold text-stone-700">
                                  {costPrice.toLocaleString()} {currentBusiness.currency}
                                </span>
                              </div>
                              <div className="border-l border-stone-200 pl-3">
                                <span className="text-[10px] text-stone-400 block">Quantity</span>
                                <input
                                  type="number"
                                  min={1}
                                  value={quantity}
                                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                                  className="w-16 p-1 rounded border border-stone-300 bg-white font-bold text-stone-900 text-xs"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Variants Picker If Available */}
                        {selectedCatalogProduct.variants && selectedCatalogProduct.variants.length > 0 && (
                          <div className="pt-2 border-t border-amber-100">
                            <label className="block text-stone-700 font-medium mb-1 text-[10px]">
                              Select Variant:
                            </label>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedCatalogProduct.variants.map((v) => {
                                const isActive = size === v.size && color === v.color;
                                return (
                                  <button
                                    key={v.id}
                                    type="button"
                                    onClick={() => {
                                      setSize(v.size);
                                      setColor(v.color);
                                    }}
                                    className={`px-2 py-0.5 rounded text-[10px] font-medium border cursor-pointer transition-all ${
                                      isActive
                                        ? 'bg-stone-900 text-white border-stone-900 shadow-2xs font-semibold'
                                        : 'bg-stone-50 text-stone-700 border-stone-200 hover:border-stone-400'
                                    }`}
                                  >
                                    {v.size} · {v.color}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Catalog Search & Visual Cards Grid */
                      <div className="space-y-2.5">
                        <div className="flex flex-col sm:flex-row gap-2 justify-between">
                          <div className="relative flex-1">
                            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                            <input
                              type="text"
                              value={catalogSearchQuery}
                              onChange={(e) => setCatalogSearchQuery(e.target.value)}
                              placeholder="Search catalog by title, SKU, keywords..."
                              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                            />
                          </div>
                          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                            <button
                              type="button"
                              onClick={() => setCatalogCategoryFilter('ALL')}
                              className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer shrink-0 ${
                                catalogCategoryFilter === 'ALL'
                                  ? 'bg-stone-900 text-white border-stone-900'
                                  : 'bg-white text-stone-600 border-stone-200'
                              }`}
                            >
                              All
                            </button>
                            {categories.map((c) => (
                              <button
                                key={c.id}
                                type="button"
                                onClick={() => setCatalogCategoryFilter(c.id)}
                                className={`px-2 py-1 rounded text-[10px] font-medium border cursor-pointer shrink-0 ${
                                  catalogCategoryFilter === c.id
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'bg-white text-stone-600 border-stone-200'
                                }`}
                              >
                                {c.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Product Cards with Images */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                          {filteredCatalogProducts.length === 0 ? (
                            <div className="col-span-2 p-5 text-center text-stone-400 bg-white/60 rounded-xl">
                              <Boxes className="w-5 h-5 mx-auto mb-1 text-stone-300" />
                              <div className="text-xs">No matching products found in catalog.</div>
                            </div>
                          ) : (
                            filteredCatalogProducts.map((p) => {
                              const pImg = p.images?.[0]?.imageUrl || '';
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleSelectCatalogProduct(p)}
                                  className="p-2 rounded-xl border border-stone-200 bg-white hover:border-stone-900 hover:shadow-2xs cursor-pointer transition-all flex items-center gap-2 group"
                                >
                                  <div className="relative shrink-0">
                                    {pImg ? (
                                      <img
                                        src={pImg}
                                        alt={p.name}
                                        className="w-12 h-14 rounded-lg object-cover border border-stone-200 bg-stone-100 group-hover:scale-105 transition-transform"
                                      />
                                    ) : (
                                      <div className="w-12 h-14 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                                        <ImageIcon className="w-4 h-4" />
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (pImg) {
                                          setPreviewImageModal({
                                            url: pImg,
                                            title: p.name,
                                            subtitle: `SKU: ${p.sku} · ${p.sellingPrice.toLocaleString()} ${currentBusiness.currency}`,
                                          });
                                        }
                                      }}
                                      className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg text-white transition-opacity"
                                      title="Enlarge item image"
                                    >
                                      <Eye className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="font-semibold text-stone-900 text-xs truncate" title={p.name}>
                                      {p.name}
                                    </div>
                                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                                      {p.sku}
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                      <div className="font-bold text-stone-900 text-xs">
                                        {p.sellingPrice.toLocaleString()} {currentBusiness.currency}
                                      </div>
                                      <span className="text-[10px] bg-stone-100 text-stone-700 px-1.5 py-0.5 rounded font-medium group-hover:bg-stone-900 group-hover:text-white transition-colors">
                                        Select
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Sub-mode B: Custom Shein Item Form */}
                {orderItemSourceMode === 'custom' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Product Title / Name *</label>
                        <input
                          type="text"
                          required
                          value={productName}
                          onChange={(e) => setProductName(e.target.value)}
                          placeholder="e.g. Shein Floral Ruched Halter Top"
                          className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Shein SKU / Code / Link</label>
                        <input
                          type="text"
                          value={sheinSkuOrLink}
                          onChange={(e) => setSheinSkuOrLink(e.target.value)}
                          placeholder="e.g. sw2107297839 or https://shein.top/..."
                          className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                        />
                      </div>
                    </div>

                    {/* Category Quick Select */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-stone-700 font-medium">Category *</label>
                        <div className="flex flex-wrap gap-1">
                          {categories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => setCategoryId(c.id)}
                              className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                categoryId === c.id
                                  ? 'bg-stone-900 text-white font-semibold'
                                  : 'bg-white text-stone-600 border border-stone-200'
                              }`}
                            >
                              {c.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Variants: Size, Color, Quantity */}
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Size</label>
                        <input
                          type="text"
                          value={size}
                          onChange={(e) => setSize(e.target.value)}
                          placeholder="e.g. S, M, L, 34B"
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Color / Tone</label>
                        <input
                          type="text"
                          value={color}
                          onChange={(e) => setColor(e.target.value)}
                          placeholder="e.g. Black, Champagne"
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Quantity</label>
                        <input
                          type="number"
                          min="1"
                          value={quantity}
                          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-bold text-stone-900"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3: Product Image (Upload, Link or Presets) */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-stone-600" />
                    <span>3. Item Image</span>
                  </span>
                  {imageUrl ? (
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Photo Attached</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-500">Optional · Default photo used if empty</span>
                  )}
                </div>

                {/* Image Selection Tabs */}
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <button
                    type="button"
                    onClick={() => setImageTab('upload')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                      imageTab === 'upload'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <Upload className="w-3 h-3" />
                    <span>Upload Screenshot / File</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('url')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                      imageTab === 'url'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <Link2 className="w-3 h-3" />
                    <span>Image URL Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageTab('presets')}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-colors flex items-center gap-1.5 ${
                      imageTab === 'presets'
                        ? 'bg-stone-900 text-white'
                        : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Sample Presets</span>
                  </button>
                </div>

                {/* Tab 1: Upload File */}
                {imageTab === 'upload' && (
                  <div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-stone-300 hover:border-stone-900 rounded-xl p-4 text-center cursor-pointer transition-colors bg-white group"
                    >
                      <Upload className="w-6 h-6 text-stone-400 group-hover:text-stone-700 mx-auto mb-1.5 transition-colors" />
                      <p className="text-xs font-semibold text-stone-800">
                        {isImageLoading ? 'Uploading image...' : 'Click to select photo or Shein screenshot'}
                      </p>
                      <p className="text-[10px] text-stone-400 mt-0.5">
                        Supports JPG, PNG, WEBP from your phone or PC (Max 5MB)
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 2: Direct URL */}
                {imageTab === 'url' && (
                  <div>
                    <input
                      type="url"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="Paste Shein image URL (e.g. https://img.shein.com/...)"
                      className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                    />
                  </div>
                )}

                {/* Tab 3: Presets */}
                {imageTab === 'presets' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {FASHION_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setImageUrl(preset.url)}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                          imageUrl === preset.url
                            ? 'border-stone-900 bg-stone-100 ring-1 ring-stone-900'
                            : 'border-stone-200 bg-white hover:border-stone-300'
                        }`}
                      >
                        <img
                          src={preset.url}
                          alt={preset.name}
                          className="w-8 h-8 rounded object-cover border border-stone-200 shrink-0"
                        />
                        <span className="text-[11px] font-medium text-stone-800 truncate">
                          {preset.name}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Image Live Preview */}
                {imageUrl && (
                  <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-stone-200">
                    <div
                      className="relative group/liveImg cursor-pointer shrink-0"
                      onClick={() =>
                        setPreviewImageModal({
                          url: imageUrl,
                          title: productName || 'Item Photo',
                          subtitle: sheinSkuOrLink ? `SKU: ${sheinSkuOrLink}` : undefined,
                        })
                      }
                      title="Click to view large preview"
                    >
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-14 h-16 rounded-md object-cover border border-stone-200 bg-stone-100 group-hover/liveImg:brightness-95 transition-all shadow-2xs"
                        onError={() => setErrorMessage('The image URL could not be loaded. Please check the link.')}
                      />
                      <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/liveImg:opacity-100 flex items-center justify-center rounded-md text-white transition-opacity">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-900 truncate">Image Preview Ready</div>
                      <div className="text-[10px] text-stone-400 truncate font-mono">{imageUrl}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="p-1.5 text-stone-400 hover:text-rose-600 rounded hover:bg-stone-50 transition-colors cursor-pointer"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* SECTION 4: Pricing, Shipping Cost & Tax */}
              <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
                <span className="font-semibold text-stone-900 text-xs uppercase tracking-wider block">
                  4. Pricing, Shipping & Tax (ETB)
                </span>

                {/* Sourcing Cost & Quoted Selling Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Shein Cost (ETB) <span className="text-stone-400 font-normal">(Internal sourcing cost)</span>
                    </label>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-700 font-medium mb-1">
                      Quoted Selling Price (ETB) * <span className="text-stone-400 font-normal">(Per unit)</span>
                    </label>
                    <input
                      type="number"
                      required
                      value={sellingPrice}
                      onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                      className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-bold text-stone-900 text-sm"
                    />
                  </div>
                </div>

                {/* Shipping Cost */}
                <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-stone-800 font-semibold flex items-center gap-1.5">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Shipping / Delivery Cost (ETB)</span>
                    </label>
                    <span className="font-mono font-semibold text-stone-900">
                      {shippingCost > 0 ? `${shippingCost.toLocaleString()} ETB` : 'Free / In-Store'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShippingCost(0)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        shippingCost === 0
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Free (0 ETB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingCost(200)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        shippingCost === 200
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Standard (200 ETB)
                    </button>
                    <button
                      type="button"
                      onClick={() => setShippingCost(350)}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        shippingCost === 350
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Express Courier (350 ETB)
                    </button>
                  </div>

                  <div className="pt-1">
                    <input
                      type="number"
                      min="0"
                      value={shippingCost}
                      onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                      placeholder="Enter custom shipping fee..."
                      className="w-full p-2 rounded-md border border-stone-300 text-xs bg-stone-50/50"
                    />
                  </div>
                </div>

                {/* Tax (VAT / Sales Tax) */}
                <div className="p-3 bg-white rounded-lg border border-stone-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-stone-800 font-semibold flex items-center gap-1.5">
                      <Percent className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tax / VAT (If Any)</span>
                    </label>
                    <span className="font-mono font-semibold text-stone-900">
                      {calculatedTax > 0 ? `+${calculatedTax.toLocaleString()} ETB (${taxRatePercent}%)` : 'No Tax (0%)'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTaxMode('NONE')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        taxMode === 'NONE'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      No Tax / Exempt (0%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('VAT_15')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        taxMode === 'VAT_15'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      15% VAT (Standard)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTaxMode('CUSTOM')}
                      className={`px-2.5 py-1 rounded text-[11px] font-medium border transition-colors ${
                        taxMode === 'CUSTOM'
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      Custom %
                    </button>
                  </div>

                  {taxMode === 'CUSTOM' && (
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={customTaxRate}
                        onChange={(e) => setCustomTaxRate(parseFloat(e.target.value) || 0)}
                        className="w-24 p-2 rounded-md border border-stone-300 text-xs bg-stone-50/50"
                        placeholder="Tax %"
                      />
                      <span className="text-xs text-stone-500">% tax rate on item subtotal</span>
                    </div>
                  )}
                </div>

                {/* Live Financial Breakdown Summary */}
                <div className="bg-stone-900 text-white p-4 rounded-xl space-y-2">
                  <div className="text-[11px] text-stone-300 uppercase tracking-wider font-semibold">
                    Order Price Summary
                  </div>
                  <div className="space-y-1.5 text-xs text-stone-200 border-b border-stone-700 pb-2">
                    <div className="flex justify-between">
                      <span>Items Subtotal ({quantity} × {sellingPrice.toLocaleString()} ETB):</span>
                      <span className="font-mono font-medium">{itemsSubtotal.toLocaleString()} ETB</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping / Delivery:</span>
                      <span className="font-mono font-medium">
                        {shippingCost > 0 ? `+${shippingCost.toLocaleString()} ETB` : 'FREE'}
                      </span>
                    </div>
                    {calculatedTax > 0 && (
                      <div className="flex justify-between text-amber-300">
                        <span>Tax ({taxRatePercent}%):</span>
                        <span className="font-mono font-medium">+{calculatedTax.toLocaleString()} ETB</span>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="font-semibold text-sm">Total to Collect:</span>
                    <span className="text-lg font-bold font-mono text-amber-400">
                      {calculatedTotal.toLocaleString()} {currentBusiness.currency}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Payment & Staff */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="TELEBIRR">Telebirr (Mobile Transfer)</option>
                    <option value="CBE_BIRR">Commercial Bank of Ethiopia (CBE)</option>
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">Registered Staff</label>
                  <input
                    type="text"
                    value={registeredBy}
                    onChange={(e) => setRegisteredBy(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                  />
                </div>
              </div>

              {/* SECTION 6: Notes */}
              <div>
                <label className="block text-stone-700 font-medium mb-1">Customer / Order Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Requested urgent weekend delivery, prefer gold accents..."
                  className="w-full p-2.5 rounded-lg border border-stone-300 bg-white"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setIsOrderModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-lg hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white rounded-xl font-semibold flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>Create Product & Order</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: View Order Receipt & Breakdown                            */}
      {/* ---------------------------------------------------------------- */}
      {viewingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl overflow-hidden animate-in fade-in">
            {/* Receipt Header */}
            <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-semibold text-base font-serif">Order Receipt & Breakdown</h3>
                  <p className="text-xs text-stone-300 font-mono">{viewingOrder.orderNumber}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingOrder(null)}
                className="text-stone-400 hover:text-white p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              {/* Customer Information */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-stone-900 text-sm">{viewingOrder.customerName}</span>
                  <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-mono font-semibold">
                    {viewingOrder.status}
                  </span>
                </div>
                <div className="text-stone-600 flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{viewingOrder.customerPhone}</span>
                  {viewingOrder.customerTelegram && (
                    <span className="text-sky-700 font-mono">({viewingOrder.customerTelegram})</span>
                  )}
                </div>
                <div className="text-stone-500">
                  <strong>Delivery:</strong> {viewingOrder.deliveryAddress}
                </div>
              </div>

              {/* Package Batch Assignment / Switcher */}
              <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <span className="text-[10px] text-amber-800 font-semibold uppercase tracking-wider block">
                      Assigned Package Batch
                    </span>
                    <span className="font-bold text-stone-900 text-xs">
                      {packageBatches.find((b) => b.id === viewingOrder.packageBatchId)?.batchCode
                        ? `${packageBatches.find((b) => b.id === viewingOrder.packageBatchId)?.batchCode} ${
                            packageBatches.find((b) => b.id === viewingOrder.packageBatchId)?.batchName
                              ? `· ${packageBatches.find((b) => b.id === viewingOrder.packageBatchId)?.batchName}`
                              : ''
                          }`
                        : 'Unassigned (No Package)'}
                    </span>
                  </div>
                </div>
                <select
                  value={viewingOrder.packageBatchId || ''}
                  onChange={(e) => {
                    const newBatchId = e.target.value || undefined;
                    assignOrderToPackageBatch(viewingOrder.id, newBatchId);
                    setViewingOrder((prev) => (prev ? { ...prev, packageBatchId: newBatchId } : null));
                  }}
                  className="text-xs bg-white border border-amber-300 rounded-lg px-2.5 py-1.5 font-medium text-stone-800 cursor-pointer shadow-2xs"
                >
                  <option value="">-- No Package --</option>
                  {packageBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} {b.batchName ? `· ${b.batchName}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Items List with Photos */}
              <div className="space-y-2">
                <div className="font-semibold text-stone-900 text-xs uppercase tracking-wider">
                  Order Items
                </div>
                {viewingOrder.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-2.5 rounded-lg border border-stone-200 bg-white"
                  >
                    {item.imageUrl ? (
                      <div
                        className="relative group/thumb shrink-0 cursor-pointer"
                        onClick={() =>
                          setPreviewImageModal({
                            url: item.imageUrl,
                            title: item.productName,
                            subtitle: `Order ${viewingOrder.orderNumber} · SKU: ${item.sku} · Qty: ${item.quantity}`,
                          })
                        }
                        title="Click to enlarge photo"
                      >
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="w-12 h-14 object-cover rounded-md border border-stone-200 shrink-0 bg-stone-50 group-hover/thumb:brightness-95 transition-all shadow-2xs"
                        />
                        <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-md text-white transition-opacity">
                          <Eye className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-12 h-14 rounded-md bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0">
                        <ImageIcon className="w-5 h-5 text-stone-300" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-stone-900 truncate">{item.productName}</div>
                      <div className="text-[11px] text-stone-500">
                        {item.variantSummary} · Qty: {item.quantity}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono">SKU: {item.sku}</div>
                    </div>
                    <div className="text-right font-mono font-bold text-stone-900">
                      {(item.unitPrice * item.quantity).toLocaleString()} {currentBusiness.currency}
                    </div>
                  </div>
                ))}
              </div>

              {/* Financial Calculation Statement */}
              <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 space-y-2">
                <div className="flex justify-between text-stone-600">
                  <span>Items Subtotal:</span>
                  <span className="font-mono font-medium">
                    {viewingOrder.subtotal.toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-sky-600" />
                    <span>Shipping / Delivery:</span>
                  </span>
                  <span className="font-mono font-medium">
                    {(viewingOrder.shippingCost ?? viewingOrder.deliveryFee ?? 0) > 0
                      ? `+${(viewingOrder.shippingCost ?? viewingOrder.deliveryFee ?? 0).toLocaleString()} ${currentBusiness.currency}`
                      : 'FREE'}
                  </span>
                </div>
                {(viewingOrder.taxAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-amber-800">
                    <span className="flex items-center gap-1">
                      <Percent className="w-3.5 h-3.5 text-amber-600" />
                      <span>Tax / VAT ({viewingOrder.taxRate || 15}%):</span>
                    </span>
                    <span className="font-mono font-medium">
                      +{(viewingOrder.taxAmount ?? 0).toLocaleString()} {currentBusiness.currency}
                    </span>
                  </div>
                )}
                <div className="border-t border-stone-300 pt-2 flex justify-between items-center text-stone-900">
                  <span className="font-bold text-sm">Grand Total:</span>
                  <span className="font-bold text-base font-mono text-stone-950">
                    {viewingOrder.total.toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
                <div className="text-[11px] text-stone-500 flex justify-between pt-1">
                  <span>Payment: {viewingOrder.paymentMethod.replace(/_/g, ' ')}</span>
                  <span className="font-semibold text-emerald-700">{viewingOrder.paymentStatus}</span>
                </div>
              </div>

              {viewingOrder.notes && (
                <div className="p-2.5 rounded-lg bg-amber-50/60 border border-amber-200 text-stone-700 text-[11px]">
                  <strong>Notes:</strong> {viewingOrder.notes}
                </div>
              )}

              {/* Close Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setViewingOrder(null)}
                  className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold cursor-pointer"
                >
                  Close Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* CONFIRMATION POPUP: DELETE ORDER                                 */}
      {/* ---------------------------------------------------------------- */}
      {deleteOrderTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Delete Order?
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Order Ref: <span className="font-mono font-semibold text-stone-800">{deleteOrderTarget.orderNumber}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteOrderTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Customer:</span>
                <span className="font-semibold text-stone-900">{deleteOrderTarget.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Items:</span>
                <span className="font-medium text-stone-800">{deleteOrderTarget.items.length} item(s)</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Order Total:</span>
                <span className="font-bold text-stone-900 text-sm text-[#993333]">
                  {deleteOrderTarget.total.toLocaleString()} {currentBusiness.currency}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Status:</span>
                <span className="font-semibold text-stone-700">{deleteOrderTarget.status}</span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently delete this order? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteOrderTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(deleteOrderTarget.id);
                  if (viewingOrder?.id === deleteOrderTarget.id) {
                    setViewingOrder(null);
                  }
                  setDeleteOrderTarget(null);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* IMAGE LIGHTBOX / PREVIEW MODAL                                   */}
      {/* ---------------------------------------------------------------- */}
      {previewImageModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImageModal(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-stone-800 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <h4 className="font-semibold text-sm truncate">{previewImageModal.title}</h4>
                {previewImageModal.subtitle && (
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">{previewImageModal.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-stone-950 flex items-center justify-center min-h-[300px] max-h-[70vh]">
              <img
                src={previewImageModal.url}
                alt={previewImageModal.title}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
            <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span className="truncate font-mono text-[10px]">{previewImageModal.url}</span>
              <button
                type="button"
                onClick={() => setPreviewImageModal(null)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0 ml-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
