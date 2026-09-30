import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { PackageBatch, Order, PaymentMethod, Product } from '../../types';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  Calendar,
  CheckCircle,
  CheckCircle2,
  Check,
  Truck,
  Boxes,
  Layers,
  ChevronDown,
  ChevronRight,
  X,
  FileText,
  DollarSign,
  Info,
  ShieldCheck,
  Building2,
  Link2,
  Unlink2,
  Image as ImageIcon,
  Eye,
  Sparkles,
  Phone,
  User,
  ShoppingBag,
  Pencil,
  Trash2,
} from 'lucide-react';
import { formatDisplayDate } from '../common/DateRangeFilter';

const APPAREL_IMAGE_PRESETS = [
  { label: 'Dress', url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&q=80' },
  { label: 'Set / Suit', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&q=80' },
  { label: 'Heels', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&q=80' },
  { label: 'Handbag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80' },
  { label: 'Trench Coat', url: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=400&q=80' },
  { label: 'Silk Top', url: 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&q=80' },
];

interface WholeOrdersTrackerProps {
  onSelectOrder?: (order: Order) => void;
}

export const WholeOrdersTracker: React.FC<WholeOrdersTrackerProps> = ({ onSelectOrder }) => {
  const {
    currentBusiness,
    orders,
    categories,
    products,
    packageBatches,
    addPackageBatch,
    updatePackageBatch,
    deletePackageBatch,
    createSheinOrderWithNewProduct,
    assignOrderToPackageBatch,
    bulkAssignOrdersToPackageBatch,
  } = useRetail();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | PackageBatch['status']>('ALL');
  const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Edit Batch Modal State
  const [editingBatch, setEditingBatch] = useState<PackageBatch | null>(null);
  const [editBatchCode, setEditBatchCode] = useState('');
  const [editBatchName, setEditBatchName] = useState('');
  const [editStatus, setEditStatus] = useState<PackageBatch['status']>('ORDERED');
  const [editOrderDate, setEditOrderDate] = useState('');
  const [editArrivalDate, setEditArrivalDate] = useState('');
  const [editSourceCurrency, setEditSourceCurrency] = useState('AED');
  const [editSourceAmount, setEditSourceAmount] = useState<number>(0);
  const [editExchangeRate, setEditExchangeRate] = useState<number>(1);
  const [editPackageCost, setEditPackageCost] = useState<number>(0);
  const [editPackageShipping, setEditPackageShipping] = useState<number>(0);
  const [editPackageCustomsTax, setEditPackageCustomsTax] = useState<number>(0);
  const [editTargetSales, setEditTargetSales] = useState<number>(0);
  const [editBatchNotes, setEditBatchNotes] = useState('');

  // Delete Batch Confirmation State
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<PackageBatch | null>(null);

  // New Batch Modal
  const [isAddBatchOpen, setIsAddBatchOpen] = useState(false);
  const [newBatchCode, setNewBatchCode] = useState('');
  const [newBatchName, setNewBatchName] = useState('');
  const [newSourceCurrency, setNewSourceCurrency] = useState('AED');
  const [newSourceAmount, setNewSourceAmount] = useState<number>(350);
  const [newExchangeRate, setNewExchangeRate] = useState<number>(61.65);
  const [newPackageCost, setNewPackageCost] = useState<number>(21577.50);
  const [newPackageShipping, setNewPackageShipping] = useState<number>(3500);
  const [newCustomsTax, setNewCustomsTax] = useState<number>(1200);
  const [newTargetSales, setNewTargetSales] = useState<number>(29500);
  const [newBatchNotes, setNewBatchNotes] = useState('');

  // ----------------------------------------------------
  // Add Items to Package Modal State
  // ----------------------------------------------------
  const [targetBatchForAdding, setTargetBatchForAdding] = useState<PackageBatch | null>(null);
  const [addItemsTab, setAddItemsTab] = useState<'new_item' | 'link_orders'>('new_item');

  // New Item: Catalog vs Custom Mode
  const [itemSourceMode, setItemSourceMode] = useState<'catalog' | 'custom'>('catalog');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogCategoryFilter, setCatalogCategoryFilter] = useState('ALL');
  const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<Product | null>(null);

  // New Item Form
  const [newItemCustomerName, setNewItemCustomerName] = useState('');
  const [newItemCustomerPhone, setNewItemCustomerPhone] = useState('+251 9');
  const [newItemCustomerTelegram, setNewItemCustomerTelegram] = useState('');
  const [newItemDeliveryAddress, setNewItemDeliveryAddress] = useState('Addis Ababa');
  const [newItemPaymentMethod, setNewItemPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [newItemName, setNewItemName] = useState('');
  const [newItemSkuOrLink, setNewItemSkuOrLink] = useState('');
  const [newItemCategoryId, setNewItemCategoryId] = useState('');
  const [newItemSize, setNewItemSize] = useState('M');
  const [newItemColor, setNewItemColor] = useState('Black');
  const [newItemQuantity, setNewItemQuantity] = useState(1);
  const [newItemCostPrice, setNewItemCostPrice] = useState(850);
  const [newItemSellingPrice, setNewItemSellingPrice] = useState(1750);
  const [newItemImageUrl, setNewItemImageUrl] = useState('');
  const [quickAddSuccessMsg, setQuickAddSuccessMsg] = useState('');

  // Image Lightbox / Zoom Modal
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string; subtitle?: string } | null>(null);

  // Link Existing Orders Form
  const [linkOrderSearch, setLinkOrderSearch] = useState('');
  const [linkFilterUnassignedOnly, setLinkFilterUnassignedOnly] = useState(true);
  const [selectedOrderIdsToLink, setSelectedOrderIdsToLink] = useState<string[]>([]);

  // Auto-calculate ETB cost when source currency/exchange rate changes
  const handleSourceAmountChange = (val: number) => {
    setNewSourceAmount(val);
    const converted = Math.round(val * newExchangeRate * 100) / 100;
    setNewPackageCost(converted);
  };

  const handleExchangeRateChange = (rate: number) => {
    setNewExchangeRate(rate);
    const converted = Math.round(newSourceAmount * rate * 100) / 100;
    setNewPackageCost(converted);
  };

  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBatchCode.trim()) return;

    addPackageBatch({
      batchCode: newBatchCode.trim().toUpperCase(),
      batchName: newBatchName.trim() || undefined,
      sourceCurrency: newSourceCurrency,
      sourceAmount: newSourceAmount,
      exchangeRate: newExchangeRate,
      totalPackageCost: newPackageCost,
      packageShippingCost: newPackageShipping,
      packageCustomsTax: newCustomsTax,
      targetExpectedSales: newTargetSales,
      status: 'ORDERED',
      orderDate: new Date().toISOString(),
      notes: newBatchNotes.trim() || undefined,
    });

    setIsAddBatchOpen(false);
    setNewBatchCode('');
    setNewBatchName('');
    setNewBatchNotes('');
  };

  // ----------------------------------------------------
  // Edit & Delete Whole Package Actions
  // ----------------------------------------------------
  const handleOpenEditBatch = (batch: PackageBatch) => {
    setEditingBatch(batch);
    setEditBatchCode(batch.batchCode);
    setEditBatchName(batch.batchName || '');
    setEditStatus(batch.status);
    setEditOrderDate(batch.orderDate ? batch.orderDate.split('T')[0] : '');
    setEditArrivalDate(batch.arrivalDate ? batch.arrivalDate.split('T')[0] : '');
    setEditSourceCurrency(batch.sourceCurrency || 'AED');
    setEditSourceAmount(batch.sourceAmount || 0);
    setEditExchangeRate(batch.exchangeRate || 1);
    setEditPackageCost(batch.totalPackageCost);
    setEditPackageShipping(batch.packageShippingCost || 0);
    setEditPackageCustomsTax(batch.packageCustomsTax || 0);
    setEditTargetSales(batch.targetExpectedSales || 0);
    setEditBatchNotes(batch.notes || '');
  };

  const handleEditSourceAmountChange = (amt: number) => {
    setEditSourceAmount(amt);
    if (editExchangeRate && editExchangeRate > 0) {
      const converted = Math.round(amt * editExchangeRate * 100) / 100;
      setEditPackageCost(converted);
    }
  };

  const handleEditExchangeRateChange = (rate: number) => {
    setEditExchangeRate(rate);
    if (editSourceAmount && editSourceAmount > 0) {
      const converted = Math.round(editSourceAmount * rate * 100) / 100;
      setEditPackageCost(converted);
    }
  };

  const handleSaveEditBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBatch || !editBatchCode.trim()) return;

    const updated: PackageBatch = {
      ...editingBatch,
      batchCode: editBatchCode.trim().toUpperCase(),
      batchName: editBatchName.trim() || undefined,
      status: editStatus,
      orderDate: editOrderDate ? new Date(editOrderDate).toISOString() : editingBatch.orderDate,
      arrivalDate: editArrivalDate ? new Date(editArrivalDate).toISOString() : undefined,
      sourceCurrency: editSourceCurrency,
      sourceAmount: editSourceAmount,
      exchangeRate: editExchangeRate,
      totalPackageCost: editPackageCost,
      packageShippingCost: editPackageShipping,
      packageCustomsTax: editPackageCustomsTax,
      targetExpectedSales: editTargetSales,
      notes: editBatchNotes.trim() || undefined,
    };

    updatePackageBatch(updated);
    showToast(`✓ Package "${updated.batchCode}" updated successfully.`);
    setEditingBatch(null);
  };

  const handleConfirmDeleteBatch = () => {
    if (!deleteBatchTarget) return;
    const code = deleteBatchTarget.batchCode;
    deletePackageBatch(deleteBatchTarget.id);
    if (expandedBatchId === deleteBatchTarget.id) {
      setExpandedBatchId(null);
    }
    showToast(`✓ Package "${code}" has been deleted.`);
    setDeleteBatchTarget(null);
  };

  // ----------------------------------------------------
  // Add Items to Package Actions
  // ----------------------------------------------------
  const handleQuickAddItemToBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetBatchForAdding || !newItemName.trim() || !newItemCustomerName.trim() || !newItemCustomerPhone.trim()) {
      return;
    }

    const res = createSheinOrderWithNewProduct({
      customerName: newItemCustomerName.trim(),
      customerPhone: newItemCustomerPhone.trim(),
      customerTelegram: newItemCustomerTelegram.trim() || undefined,
      deliveryAddress: newItemDeliveryAddress.trim() || 'Addis Ababa',
      paymentMethod: newItemPaymentMethod,
      registeredBy: 'Import Cargo Desk',
      productName: newItemName.trim(),
      sheinSkuOrLink: newItemSkuOrLink.trim() || `SH-${Math.floor(100000 + Math.random() * 900000)}`,
      categoryId: newItemCategoryId || categories[0]?.id || 'cat-women',
      size: newItemSize,
      color: newItemColor,
      quantity: Math.max(1, newItemQuantity || 1),
      costPrice: Math.max(0, newItemCostPrice || 0),
      sellingPrice: Math.max(0, newItemSellingPrice || 0),
      imageUrl: newItemImageUrl.trim() || undefined,
      packageBatchId: targetBatchForAdding.id,
    });

    if (res.success) {
      setExpandedBatchId(targetBatchForAdding.id);
      setQuickAddSuccessMsg(`Item "${newItemName.trim()}" added directly to package ${targetBatchForAdding.batchCode}!`);
      setTimeout(() => {
        setQuickAddSuccessMsg('');
        setTargetBatchForAdding(null);
        setNewItemName('');
        setNewItemSkuOrLink('');
        setNewItemCustomerName('');
        setNewItemCustomerPhone('+251 9');
        setNewItemCustomerTelegram('');
        setNewItemImageUrl('');
      }, 1000);
    }
  };

  const handleLinkExistingOrders = () => {
    if (!targetBatchForAdding || selectedOrderIdsToLink.length === 0) return;
    bulkAssignOrdersToPackageBatch(selectedOrderIdsToLink, targetBatchForAdding.id);
    setExpandedBatchId(targetBatchForAdding.id);
    setSelectedOrderIdsToLink([]);
    setTargetBatchForAdding(null);
  };

  const handleUnlinkItemFromBatch = (orderId: string) => {
    assignOrderToPackageBatch(orderId, undefined);
  };

  // Orders eligible to be linked to currently targeted package
  const eligibleOrdersToLink = useMemo(() => {
    if (!targetBatchForAdding) return [];
    return orders.filter((o) => {
      // Don't show orders already in this batch
      if (o.packageBatchId === targetBatchForAdding.id) return false;
      if (linkFilterUnassignedOnly && o.packageBatchId) return false;

      if (linkOrderSearch.trim()) {
        const q = linkOrderSearch.toLowerCase();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchCustomer = o.customerName.toLowerCase().includes(q);
        const matchPhone = o.customerPhone.toLowerCase().includes(q);
        const matchItem = o.items.some(
          (it) => it.productName.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q)
        );
        if (!matchNum && !matchCustomer && !matchPhone && !matchItem) return false;
      }
      return true;
    });
  }, [orders, targetBatchForAdding, linkFilterUnassignedOnly, linkOrderSearch]);

  const unassignedOrdersCount = useMemo(() => {
    return orders.filter((o) => !o.packageBatchId).length;
  }, [orders]);

  // Filter products for catalog picker
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
    setNewItemName(product.name);
    setNewItemSkuOrLink(product.sku);
    setNewItemCategoryId(product.categoryId);
    setNewItemCostPrice(product.costPrice || Math.round(product.sellingPrice * 0.55));
    setNewItemSellingPrice(product.sellingPrice);
    const primaryImg = product.images?.[0]?.imageUrl || '';
    setNewItemImageUrl(primaryImg);
    if (product.variants && product.variants.length > 0) {
      setNewItemSize(product.variants[0].size || 'M');
      setNewItemColor(product.variants[0].color || 'Standard');
    }
  };

  // Compute for each batch:
  // - Linked customer orders
  // - Linked items count & sold items count
  // - Registered items expenditure (sum of costPrice * quantity)
  // - Registered sales revenue (sum of selling price * quantity)
  // - Sold-items profit (sales revenue - items expenditure)
  // - Discrepancy between Package Total Cost vs Registered Items Expenditure
  // - Discrepancy between Package Expected Sales vs Registered Sales Revenue
  const batchesAnalysis = useMemo(() => {
    return packageBatches.map((batch) => {
      // Find orders explicitly linked or matching batch
      const linkedOrders = orders.filter((o) => o.packageBatchId === batch.id);

      // Collect all items in these orders
      const allItems = linkedOrders.flatMap((o) =>
        o.items.map((it) => ({
          ...it,
          orderId: o.id,
          orderNumber: o.orderNumber,
          orderStatus: o.status,
          customerName: o.customerName,
          orderDate: o.createdAt,
          order: o,
        }))
      );

      const linkedUnitsCount = allItems.reduce((acc, it) => acc + it.quantity, 0);

      // Sold items (delivered or in transit to customer)
      const soldItems = allItems.filter(
        (it) => it.orderStatus === 'DELIVERED' || it.orderStatus === 'OUT_FOR_DELIVERY'
      );
      const soldUnitsCount = soldItems.reduce((acc, it) => acc + it.quantity, 0);

      // Sourced expenditure registered on individual items
      const registeredItemsCost = allItems.reduce((acc, it) => {
        const itemCost = typeof it.costPrice === 'number' ? it.costPrice : it.unitPrice * 0.55;
        return acc + itemCost * it.quantity;
      }, 0);

      // Sales revenue registered from customer orders
      const registeredSalesRev = allItems.reduce(
        (acc, it) => acc + it.unitPrice * it.quantity,
        0
      );

      // Sold revenue
      const soldSalesRev = soldItems.reduce(
        (acc, it) => acc + it.unitPrice * it.quantity,
        0
      );

      // Sold cost
      const soldItemsCost = soldItems.reduce((acc, it) => {
        const itemCost = typeof it.costPrice === 'number' ? it.costPrice : it.unitPrice * 0.55;
        return acc + itemCost * it.quantity;
      }, 0);

      // Sold profit
      const soldItemsProfit = soldSalesRev - soldItemsCost;

      // Potential full profit if all registered items are sold
      const potentialItemsProfit = registeredSalesRev - registeredItemsCost;

      // Discrepancy in cost: (registered items cost - total package cost)
      // Negative means registered items don't yet account for the full package investment
      const costDiscrepancy = registeredItemsCost - batch.totalPackageCost;

      // Discrepancy in sales: (registered sales revenue - target expected sales)
      const salesDiscrepancy = registeredSalesRev - (batch.targetExpectedSales || 0);

      // Expected estimated items in package (assume 15 items if not known)
      const totalEstimatedQty = 15;

      return {
        batch,
        linkedOrders,
        allItems,
        linkedUnitsCount,
        soldUnitsCount,
        totalEstimatedQty,
        registeredItemsCost,
        registeredSalesRev,
        soldSalesRev,
        soldItemsProfit,
        potentialItemsProfit,
        costDiscrepancy,
        salesDiscrepancy,
      };
    });
  }, [packageBatches, orders]);

  // Overall KPI statistics matching user screenshot
  const overallKPIs = useMemo(() => {
    const totalBatches = packageBatches.length;
    const totalInvestment = packageBatches.reduce((acc, b) => acc + b.totalPackageCost, 0);
    const totalSoldProfit = batchesAnalysis.reduce((acc, b) => acc + b.soldItemsProfit, 0);
    // Net cashflow: All received sales minus total packages expenditure investment
    const totalReceivedSales = batchesAnalysis.reduce((acc, b) => acc + b.soldSalesRev, 0);
    const netCashflow = totalReceivedSales - totalInvestment;

    return {
      totalBatches,
      totalInvestment,
      totalSoldProfit,
      netCashflow,
    };
  }, [packageBatches, batchesAnalysis]);

  // Filtered list
  const filteredBatches = useMemo(() => {
    return batchesAnalysis.filter(({ batch }) => {
      if (statusFilter !== 'ALL' && batch.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchCode = batch.batchCode.toLowerCase().includes(q);
        const matchName = (batch.batchName || '').toLowerCase().includes(q);
        const matchNotes = (batch.notes || '').toLowerCase().includes(q);
        if (!matchCode && !matchName && !matchNotes) return false;
      }
      return true;
    });
  }, [batchesAnalysis, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* ---------------------------------------------------- */}
      {/* Top 4 KPI Cards (Directly matching user screenshot) */}
      {/* ---------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Batches Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
            <Package className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Total Batches</div>
            <div className="text-2xl font-bold text-stone-900 mt-0.5">{overallKPIs.totalBatches}</div>
          </div>
        </div>

        {/* Total Investment Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Total Investment</div>
            <div className="text-xl font-bold text-stone-900 mt-0.5">
              <span className="text-xs font-semibold text-stone-400 mr-1.5">{currentBusiness.currency}</span>
              {overallKPIs.totalInvestment.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Sold-Items Profit Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Sold-Items Profit</div>
            <div className="text-xl font-bold text-emerald-950 mt-0.5">
              <span className="text-xs font-semibold text-emerald-600/80 mr-1.5">{currentBusiness.currency}</span>
              {overallKPIs.totalSoldProfit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Net Cashflow Card */}
        <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <div className="text-xs text-stone-500 font-medium">Net Cashflow</div>
            <div className={`text-xl font-bold mt-0.5 ${overallKPIs.netCashflow < 0 ? 'text-rose-600' : 'text-emerald-700'}`}>
              <span className="text-xs font-semibold opacity-70 mr-1.5">{currentBusiness.currency}</span>
              {overallKPIs.netCashflow < 0 ? '-' : '+'}
              {Math.abs(overallKPIs.netCashflow).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Discrepancy & Reconciliation Guide Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-200/80 rounded-2xl p-4.5 text-xs text-stone-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-100/80 text-amber-900 shrink-0 mt-0.5">
            <Info className="w-4 h-4 text-amber-800" />
          </div>
          <div className="space-y-0.5">
            <div className="font-bold text-amber-950 text-sm">Package vs Items Expenditure & Profit Reconciliation</div>
            <div className="text-stone-600 leading-relaxed text-[11px]">
              Compares whole-import costs (e.g. Shein cargo invoices in AED/USD converted to ETB + freight + customs) against the sum of individually registered customer orders. Discrepancies (<span className="text-indigo-700 font-semibold font-mono">Linked vs Package</span>) highlight unallocated costs, extra units, or unsold margin cushions.
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsAddBatchOpen(true)}
          className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-3.5 rounded-xl flex items-center gap-1.5 transition-all text-xs shrink-0 cursor-pointer shadow-xs"
        >
          <Plus className="w-4 h-4 text-amber-400" />
          <span>+ New Package Batch</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Search and Status Filter Strip                       */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="relative min-w-[260px] flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or Batch Name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-stone-500 font-semibold uppercase tracking-wider text-[11px]">STATUS:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="py-1.5 px-3 rounded-lg border border-stone-300 bg-white font-medium text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-900"
          >
            <option value="ALL">All Statuses</option>
            <option value="ORDERED">Ordered</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="CUSTOMS_CLEARING">Customs Clearing</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DISTRIBUTED">Distributed</option>
          </select>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* Whole Orders Batches Table (Matching User Screenshot) */}
      {/* ---------------------------------------------------- */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50/80 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="p-4 w-10"></th>
                <th className="p-4">Batch Info</th>
                <th className="p-4">Date</th>
                <th className="p-4">Status</th>
                <th className="p-4">Items Qty</th>
                <th className="p-4">Total Cost</th>
                <th className="p-4">Sales Rev</th>
                <th className="p-4 text-right">Sold-Items Profit</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-stone-400">
                    <Boxes className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <div>No package batches found matching search.</div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map(
                  ({
                    batch,
                    linkedOrders,
                    allItems,
                    linkedUnitsCount,
                    soldUnitsCount,
                    totalEstimatedQty,
                    registeredItemsCost,
                    registeredSalesRev,
                    soldSalesRev,
                    soldItemsProfit,
                    potentialItemsProfit,
                    costDiscrepancy,
                    salesDiscrepancy,
                  }) => {
                    const isExpanded = expandedBatchId === batch.id;
                    const itemsDiff = linkedUnitsCount - totalEstimatedQty;

                    return (
                      <React.Fragment key={batch.id}>
                        <tr
                          onClick={() => setExpandedBatchId(isExpanded ? null : batch.id)}
                          className="hover:bg-stone-50/70 cursor-pointer transition-colors group"
                        >
                          {/* Toggle Expand Icon */}
                          <td className="p-4 text-stone-400">
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-stone-800" />
                            ) : (
                              <ChevronRight className="w-4 h-4 group-hover:text-stone-800" />
                            )}
                          </td>

                          {/* Batch Info */}
                          <td className="p-4">
                            <div className="font-bold text-stone-900 font-mono tracking-tight text-[13px]">
                              {batch.batchCode}
                            </div>
                            <div className="text-[11px] text-stone-500 italic mt-0.5">
                              {batch.sourceCurrency && batch.sourceAmount ? (
                                <span>
                                  {batch.sourceCurrency} {batch.sourceAmount.toLocaleString()}
                                </span>
                              ) : null}
                              {batch.batchName && (
                                <span className="ml-1.5 not-italic text-stone-400 font-sans">
                                  · {batch.batchName}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Date */}
                          <td className="p-4 whitespace-nowrap text-stone-600">
                            {formatDisplayDate(batch.orderDate)}
                          </td>

                          {/* Status */}
                          <td className="p-4 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                                batch.status === 'DISTRIBUTED'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : batch.status === 'ARRIVED'
                                  ? 'bg-sky-50 text-sky-800 border-sky-200'
                                  : batch.status === 'IN_TRANSIT'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                                  : batch.status === 'CUSTOMS_CLEARING'
                                  ? 'bg-purple-50 text-purple-800 border-purple-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {batch.status === 'ORDERED'
                                ? 'Ordered'
                                : batch.status === 'IN_TRANSIT'
                                ? 'In Transit'
                                : batch.status === 'CUSTOMS_CLEARING'
                                ? 'Customs Clearing'
                                : batch.status === 'ARRIVED'
                                ? 'Arrived'
                                : 'Distributed'}
                            </span>
                          </td>

                          {/* Items Qty (with discrepancy) */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-stone-900">
                              {totalEstimatedQty}{' '}
                              <span className="font-normal text-stone-400">({soldUnitsCount} sold)</span>
                            </div>
                            <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                              <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                              <span>
                                Linked: {linkedUnitsCount} ({itemsDiff > 0 ? `+${itemsDiff}` : `${itemsDiff}`})
                              </span>
                            </div>
                          </td>

                          {/* Total Cost (Package vs Linked Items Discrepancy) */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-stone-900">
                              <span className="text-[10px] text-stone-400 font-normal mr-1">
                                {currentBusiness.currency}
                              </span>
                              {batch.totalPackageCost.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                              Linked: {currentBusiness.currency} {registeredItemsCost.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-stone-500 font-mono text-[10px]">
                                ({costDiscrepancy >= 0 ? `+${costDiscrepancy.toLocaleString()}` : `${costDiscrepancy.toLocaleString()}`})
                              </span>
                            </div>
                          </td>

                          {/* Sales Rev (Target vs Linked Items Discrepancy) */}
                          <td className="p-4 whitespace-nowrap">
                            <div className="font-bold text-emerald-800">
                              <span className="text-[10px] text-emerald-600/70 font-normal mr-1">
                                {currentBusiness.currency}
                              </span>
                              {(batch.targetExpectedSales || 0).toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[11px] text-indigo-700 font-medium mt-0.5">
                              Linked: {currentBusiness.currency} {registeredSalesRev.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}{' '}
                              <span className="text-stone-500 font-mono text-[10px]">
                                ({salesDiscrepancy >= 0 ? `+${salesDiscrepancy.toLocaleString()}` : `${salesDiscrepancy.toLocaleString()}`})
                              </span>
                            </div>
                          </td>

                          {/* Sold-Items Profit */}
                          <td className="p-4 whitespace-nowrap text-right">
                            <div className="font-bold text-emerald-700 text-sm">
                              <span className="text-[11px] font-normal text-emerald-600/70 mr-1">
                                {currentBusiness.currency}
                              </span>
                              {soldItemsProfit.toLocaleString('en-US', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })}
                            </div>
                            <div className="text-[10px] text-stone-400 mt-0.5">
                              Potential: {potentialItemsProfit.toLocaleString()} {currentBusiness.currency}
                            </div>
                          </td>

                          {/* Actions: Add Items, Edit & Delete Whole Package */}
                          <td className="p-4 whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetBatchForAdding(batch);
                                  setAddItemsTab('new_item');
                                }}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                                title={`Add items to package ${batch.batchCode}`}
                              >
                                <Plus className="w-3.5 h-3.5 text-amber-700" />
                                <span>Add Items</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditBatch(batch)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-900 border border-stone-200 font-semibold text-xs transition-colors cursor-pointer"
                                title={`Edit whole package ${batch.batchCode}`}
                              >
                                <Pencil className="w-3.5 h-3.5 text-stone-600" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteBatchTarget(batch)}
                                className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 transition-colors cursor-pointer"
                                title={`Delete package ${batch.batchCode}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* ---------------------------------------------------------------- */}
                        {/* EXPANDED ACCORDION: Individual Linked Items & Discrepancies Breakdown */}
                        {/* ---------------------------------------------------------------- */}
                        {isExpanded && (
                          <tr className="bg-stone-50/60 border-b border-stone-200">
                            <td colSpan={9} className="p-4 sm:p-5">
                              <div className="bg-white rounded-xl border border-stone-200 p-4 space-y-4 shadow-2xs">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
                                  <div>
                                    <div className="font-bold text-stone-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                                      <Boxes className="w-4 h-4 text-indigo-600" />
                                      <span>Items Registered In This Import Package ({allItems.length} Line Items · {linkedUnitsCount} Units)</span>
                                    </div>
                                    <div className="text-[11px] text-stone-500 mt-0.5">
                                      Compare individual customer line item costs against whole package invoice and reconcile margins.
                                    </div>
                                  </div>

                                  <div className="flex flex-wrap items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTargetBatchForAdding(batch);
                                        setAddItemsTab('new_item');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5 text-amber-400" />
                                      <span>+ Add Item</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setTargetBatchForAdding(batch);
                                        setAddItemsTab('link_orders');
                                      }}
                                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                                    >
                                      <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                                      <span>Attach Orders ({unassignedOrdersCount})</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenEditBatch(batch)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 border border-stone-300 font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                                      title="Edit package cargo numbers, dates and rates"
                                    >
                                      <Pencil className="w-3.5 h-3.5 text-stone-600" />
                                      <span>Edit Package</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteBatchTarget(batch)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs shadow-2xs cursor-pointer transition-colors"
                                      title="Delete whole package batch"
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                                      <span>Delete Package</span>
                                    </button>
                                    <span className="text-[11px] bg-indigo-50 text-indigo-900 px-2.5 py-1 rounded font-semibold border border-indigo-200">
                                      Cost Diff: {costDiscrepancy.toLocaleString()} {currentBusiness.currency}
                                    </span>
                                    <span className="text-[11px] bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded font-semibold border border-emerald-200">
                                      Sales Diff: {salesDiscrepancy.toLocaleString()} {currentBusiness.currency}
                                    </span>
                                  </div>
                                </div>

                                {allItems.length === 0 ? (
                                  <div className="p-8 text-center bg-stone-50/60 rounded-xl border border-dashed border-stone-300 space-y-3">
                                    <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto">
                                      <Boxes className="w-6 h-6 text-amber-700" />
                                    </div>
                                    <div>
                                      <h5 className="font-bold text-stone-900 text-sm">No items in package {batch.batchCode} yet</h5>
                                      <p className="text-xs text-stone-500 max-w-md mx-auto mt-1">
                                        Add items directly to this package to reconcile shipment expenditures against individual customer items, or attach existing customer pre-orders.
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2.5 pt-1">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTargetBatchForAdding(batch);
                                          setAddItemsTab('new_item');
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg font-semibold text-xs shadow-xs cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5 text-amber-400" />
                                        <span>+ Add Item to this Package</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTargetBatchForAdding(batch);
                                          setAddItemsTab('link_orders');
                                        }}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-300 rounded-lg font-semibold text-xs shadow-2xs cursor-pointer"
                                      >
                                        <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                                        <span>Attach Existing Orders</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="text-[10px] text-stone-500 uppercase tracking-wider bg-stone-50 border-b border-stone-100 font-semibold">
                                        <tr>
                                          <th className="p-2.5">Item & Specs</th>
                                          <th className="p-2.5">Customer</th>
                                          <th className="p-2.5">Qty</th>
                                          <th className="p-2.5">Registered Cost (ETB)</th>
                                          <th className="p-2.5">Selling Price</th>
                                          <th className="p-2.5">Item Profit</th>
                                          <th className="p-2.5">Order Status</th>
                                          <th className="p-2.5 text-right">Actions</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-stone-100">
                                        {allItems.map((item, idx) => {
                                          const itemCost =
                                            typeof item.costPrice === 'number'
                                              ? item.costPrice
                                              : item.unitPrice * 0.55;
                                          const profit = (item.unitPrice - itemCost) * item.quantity;

                                          return (
                                            <tr key={`${item.orderId}-${idx}`} className="hover:bg-stone-50/50">
                                              <td className="p-2.5">
                                                <div className="flex items-center gap-2.5">
                                                  <div
                                                    className="relative group/thumb shrink-0 cursor-pointer"
                                                    onClick={() =>
                                                      setPreviewImage({
                                                        url: item.imageUrl,
                                                        title: item.productName,
                                                        subtitle: `Package ${batch.batchCode} · Order: ${item.orderNumber} · SKU: ${item.sku}`,
                                                      })
                                                    }
                                                    title="Click to view large item image"
                                                  >
                                                    <img
                                                      src={item.imageUrl}
                                                      alt={item.productName}
                                                      className="w-10 h-12 rounded-lg object-cover border border-stone-200 bg-stone-100 shadow-2xs group-hover/thumb:brightness-95 transition-all"
                                                    />
                                                    <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-lg text-white transition-opacity">
                                                      <Eye className="w-3.5 h-3.5" />
                                                    </div>
                                                  </div>
                                                  <div>
                                                    <div className="font-semibold text-stone-900 line-clamp-1">
                                                      {item.productName}
                                                    </div>
                                                    <div className="text-[10px] text-stone-500">
                                                      {item.variantSummary} · SKU: {item.sku}
                                                    </div>
                                                  </div>
                                                </div>
                                              </td>
                                              <td className="p-2.5 whitespace-nowrap">
                                                <div className="font-medium text-stone-900">{item.customerName}</div>
                                                <div className="text-[10px] text-stone-400 font-mono">
                                                  {item.orderNumber}
                                                </div>
                                              </td>
                                              <td className="p-2.5 font-bold text-stone-900">{item.quantity}</td>
                                              <td className="p-2.5 whitespace-nowrap text-stone-700">
                                                {(itemCost * item.quantity).toLocaleString()} {currentBusiness.currency}
                                                <div className="text-[10px] text-stone-400">
                                                  ({itemCost.toLocaleString()}/unit)
                                                </div>
                                              </td>
                                              <td className="p-2.5 whitespace-nowrap text-stone-900 font-semibold">
                                                {(item.unitPrice * item.quantity).toLocaleString()} {currentBusiness.currency}
                                              </td>
                                              <td className="p-2.5 whitespace-nowrap font-bold text-emerald-700">
                                                +{profit.toLocaleString()} {currentBusiness.currency}
                                              </td>
                                              <td className="p-2.5 whitespace-nowrap">
                                                <span
                                                  className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                                    item.orderStatus === 'DELIVERED'
                                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                      : item.orderStatus === 'OUT_FOR_DELIVERY'
                                                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                                                      : 'bg-amber-50 text-amber-700 border border-amber-200'
                                                  }`}
                                                >
                                                  {item.orderStatus}
                                                </span>
                                              </td>
                                              <td className="p-2.5 text-right whitespace-nowrap">
                                                <div className="inline-flex items-center gap-1.5">
                                                  {onSelectOrder && (
                                                    <button
                                                      type="button"
                                                      onClick={() => onSelectOrder(item.order)}
                                                      className="text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-2.5 py-1 rounded text-[11px] font-medium"
                                                    >
                                                      View Order
                                                    </button>
                                                  )}
                                                  <button
                                                    type="button"
                                                    onClick={() => handleUnlinkItemFromBatch(item.orderId)}
                                                    className="text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2 py-1 rounded text-[11px] font-medium border border-rose-200 cursor-pointer"
                                                    title="Detach this order from this package"
                                                  >
                                                    <Unlink2 className="w-3 h-3 inline mr-1" />
                                                    <span>Unlink</span>
                                                  </button>
                                                </div>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                )}

                                {/* Detailed Financial Cost Breakdown & Reconciliation Notes */}
                                <div className="p-3 bg-stone-50 rounded-lg border border-stone-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px]">
                                  <div>
                                    <div className="text-stone-500 font-medium">Whole Package Total Cost</div>
                                    <div className="text-stone-900 font-bold text-xs mt-0.5">
                                      {batch.totalPackageCost.toLocaleString()} {currentBusiness.currency}
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                      Includes {batch.packageShippingCost ? `${batch.packageShippingCost} ETB shipping` : 'cargo'} + {batch.packageCustomsTax ? `${batch.packageCustomsTax} ETB tax` : 'customs'}
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-stone-500 font-medium">Sum of Registered Items Cost</div>
                                    <div className="text-stone-900 font-bold text-xs mt-0.5">
                                      {registeredItemsCost.toLocaleString()} {currentBusiness.currency}
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                      Across {linkedUnitsCount} linked customer units
                                    </div>
                                  </div>

                                  <div>
                                    <div className="text-stone-500 font-medium">Cost Discrepancy (d/c)</div>
                                    <div className={`font-bold text-xs mt-0.5 ${costDiscrepancy < 0 ? 'text-amber-800' : 'text-emerald-700'}`}>
                                      {costDiscrepancy < 0 ? '-' : '+'}
                                      {Math.abs(costDiscrepancy).toLocaleString()} {currentBusiness.currency}
                                    </div>
                                    <div className="text-[10px] text-stone-400 mt-0.5">
                                      {costDiscrepancy < 0 ? 'Unallocated import package expenditure' : 'Fully allocated'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  }
                )
              )}
            </tbody>
            {filteredBatches.length > 0 && (() => {
              const totalBatchesCount = filteredBatches.length;
              const totalLinkedUnits = filteredBatches.reduce((s, b) => s + b.linkedUnitsCount, 0);
              const totalBatchCost = filteredBatches.reduce((s, b) => s + b.batch.totalPackageCost, 0);
              const totalSalesRev = filteredBatches.reduce((s, b) => s + b.registeredSalesRev, 0);
              const totalGrossProfit = filteredBatches.reduce((s, b) => s + b.potentialItemsProfit, 0);
              const grossMargin = totalSalesRev > 0 ? Math.round((totalGrossProfit / totalSalesRev) * 100) : 0;

              return (
                <tfoot className="bg-stone-50 border-t-2 border-stone-300 font-medium text-stone-800">
                  <tr>
                    <td colSpan={4} className="p-4 font-bold text-stone-900 text-xs uppercase tracking-wide">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600" />
                        <span>Gross Package Batches Totals ({totalBatchesCount} Batches)</span>
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Total Units:</div>
                      <span className="font-bold font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-stone-900 inline-block mt-0.5">
                        {totalLinkedUnits.toLocaleString()} units
                      </span>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Cost:</div>
                      <div className="font-bold text-stone-900 text-xs font-mono">
                        {totalBatchCost.toLocaleString()} {currentBusiness.currency}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Sales Rev:</div>
                      <div className="font-bold text-stone-900 text-xs font-mono">
                        {totalSalesRev.toLocaleString()} {currentBusiness.currency}
                      </div>
                    </td>
                    <td className="p-4 whitespace-nowrap text-right">
                      <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Profit:</div>
                      <div className="font-bold text-emerald-700 text-sm font-mono flex items-center justify-end gap-1.5 mt-0.5">
                        <span>+{totalGrossProfit.toLocaleString()} {currentBusiness.currency}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                          +{grossMargin}%
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right text-stone-400 text-[11px]">
                      Gross reconcile
                    </td>
                  </tr>
                </tfoot>
              );
            })()}
          </table>
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* MODAL: Register New Whole Package Batch             */}
      {/* ---------------------------------------------------- */}
      {isAddBatchOpen && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-900">
                  Register Whole Import Package / Batch
                </h3>
                <p className="text-xs text-stone-500 mt-0.5">
                  Track the total import box expenditure, currency conversion and target revenue.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddBatchOpen(false)}
                className="p-1.5 text-stone-400 hover:text-stone-800 rounded-lg hover:bg-stone-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Batch Code / Tracking ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBatchCode}
                    onChange={(e) => setNewBatchCode(e.target.value)}
                    placeholder="e.g. GSH18M45R00M2RV"
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-mono font-bold uppercase focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Batch Description / Nickname
                  </label>
                  <input
                    type="text"
                    value={newBatchName}
                    onChange={(e) => setNewBatchName(e.target.value)}
                    placeholder="e.g. Dubai Shein Carton #5"
                    className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Currency & Exchange Rate */}
              <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] block">
                  Foreign Currency & Exchange Rate
                </span>
                <div className="grid grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-stone-600 mb-1">Currency</label>
                    <select
                      value={newSourceCurrency}
                      onChange={(e) => setNewSourceCurrency(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-semibold"
                    >
                      <option value="AED">AED (Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="EUR">EUR (Euro)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newSourceAmount}
                      onChange={(e) => handleSourceAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1">Rate to ETB</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newExchangeRate}
                      onChange={(e) => handleExchangeRateChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Whole Package ETB Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Whole Package Cost in ETB *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPackageCost}
                    onChange={(e) => setNewPackageCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-medium mb-1">
                    Expected Sales Revenue (ETB)
                  </label>
                  <input
                    type="number"
                    value={newTargetSales}
                    onChange={(e) => setNewTargetSales(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Air Cargo Shipping (ETB)</label>
                  <input
                    type="number"
                    value={newPackageShipping}
                    onChange={(e) => setNewPackageShipping(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Customs Clearance Tax (ETB)</label>
                  <input
                    type="number"
                    value={newCustomsTax}
                    onChange={(e) => setNewCustomsTax(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">Notes / Cargo Details</label>
                <textarea
                  rows={2}
                  value={newBatchNotes}
                  onChange={(e) => setNewBatchNotes(e.target.value)}
                  placeholder="e.g. Sourced via Dubai Shein hub, flight arrived terminal 2..."
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddBatchOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Save Package Batch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* MODAL: Add Items to Package Batch (Quick Add or Attach Existing)  */}
      {/* ---------------------------------------------------------------- */}
      {targetBatchForAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-stone-200 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in">
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base font-serif">Add Items to Package</h3>
                    <span className="font-mono bg-amber-400/20 text-amber-300 text-xs px-2 py-0.5 rounded font-bold">
                      {targetBatchForAdding.batchCode}
                    </span>
                  </div>
                  <p className="text-xs text-stone-300">
                    {targetBatchForAdding.batchName
                      ? targetBatchForAdding.batchName
                      : `Whole Package Invoice: ${targetBatchForAdding.totalPackageCost.toLocaleString()} ${currentBusiness.currency}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTargetBatchForAdding(null)}
                className="text-stone-400 hover:text-white p-1 text-lg rounded-lg hover:bg-stone-800 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex border-b border-stone-200 bg-stone-50 px-4 pt-2 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setAddItemsTab('new_item')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  addItemsTab === 'new_item'
                    ? 'bg-white text-stone-900 border-amber-500 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 border-transparent hover:bg-stone-100'
                }`}
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                <span>Quick Add Ordered Item</span>
              </button>
              <button
                type="button"
                onClick={() => setAddItemsTab('link_orders')}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-xl transition-all border-b-2 cursor-pointer ${
                  addItemsTab === 'link_orders'
                    ? 'bg-white text-stone-900 border-amber-500 shadow-xs'
                    : 'text-stone-500 hover:text-stone-800 border-transparent hover:bg-stone-100'
                }`}
              >
                <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Attach Existing Orders ({orders.filter((o) => o.packageBatchId !== targetBatchForAdding.id).length})
                </span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {quickAddSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{quickAddSuccessMsg}</span>
                </div>
              )}

              {/* Tab 1: Quick Add Ordered Item */}
              {addItemsTab === 'new_item' && (
                <form onSubmit={handleQuickAddItemToBatch} className="space-y-4 text-xs">
                  {/* Item Source Mode Switcher */}
                  <div className="bg-stone-100 p-1 rounded-xl flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setItemSourceMode('catalog')}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        itemSourceMode === 'catalog'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                      <span>Select Existing Catalog Item ({products.length})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setItemSourceMode('custom');
                        setSelectedCatalogProduct(null);
                      }}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        itemSourceMode === 'custom'
                          ? 'bg-white text-stone-900 shadow-xs'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />
                      <span>Custom Shein Item / New Sourcing</span>
                    </button>
                  </div>

                  {/* Mode A: Select Existing Catalog Product */}
                  {itemSourceMode === 'catalog' && (
                    <div className="space-y-3">
                      {selectedCatalogProduct ? (
                        /* Selected Existing Product Preview Card */
                        <div className="bg-gradient-to-r from-amber-50/70 to-stone-50 border border-amber-300/80 rounded-2xl p-3.5 shadow-2xs space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>Selected Existing Item</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => setSelectedCatalogProduct(null)}
                              className="text-[11px] text-stone-600 hover:text-stone-900 underline font-medium cursor-pointer"
                            >
                              Change Product
                            </button>
                          </div>

                          <div className="flex items-start gap-3.5">
                            {/* Product Image with Click-to-Enlarge */}
                            <div
                              className="relative group/selImg shrink-0 cursor-pointer"
                              onClick={() => {
                                const img = selectedCatalogProduct.images?.[0]?.imageUrl || newItemImageUrl;
                                if (img) {
                                  setPreviewImage({
                                    url: img,
                                    title: selectedCatalogProduct.name,
                                    subtitle: `SKU: ${selectedCatalogProduct.sku} · ${selectedCatalogProduct.sellingPrice.toLocaleString()} ${currentBusiness.currency}`,
                                  });
                                }
                              }}
                              title="Click to view large item image"
                            >
                              <img
                                src={selectedCatalogProduct.images?.[0]?.imageUrl || newItemImageUrl}
                                alt={selectedCatalogProduct.name}
                                className="w-20 h-24 rounded-xl object-cover border border-amber-200/80 bg-white shadow-xs group-hover/selImg:scale-[1.02] transition-transform"
                              />
                              <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/selImg:opacity-100 flex items-center justify-center rounded-xl text-white transition-opacity">
                                <Eye className="w-4 h-4" />
                              </div>
                            </div>

                            <div className="min-w-0 flex-1 space-y-1.5">
                              <h4 className="font-bold text-stone-900 text-sm line-clamp-1">
                                {selectedCatalogProduct.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className="font-mono bg-white px-2 py-0.5 rounded border border-stone-200 text-stone-700 font-semibold">
                                  {selectedCatalogProduct.sku}
                                </span>
                                <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-medium">
                                  {categories.find((c) => c.id === selectedCatalogProduct.categoryId)?.name || 'Fashion'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 pt-1 text-xs">
                                <div>
                                  <span className="text-stone-400 block text-[10px]">Quoted Selling</span>
                                  <span className="font-bold text-stone-900">
                                    {selectedCatalogProduct.sellingPrice.toLocaleString()} {currentBusiness.currency}
                                  </span>
                                </div>
                                <div className="border-l border-stone-200 pl-3">
                                  <span className="text-stone-400 block text-[10px]">Est. Sourcing Cost</span>
                                  <span className="font-semibold text-stone-700">
                                    {newItemCostPrice.toLocaleString()} {currentBusiness.currency}
                                  </span>
                                </div>
                                <div className="border-l border-stone-200 pl-3">
                                  <span className="text-stone-400 block text-[10px]">Est. Profit</span>
                                  <span className="font-bold text-emerald-700">
                                    +{(selectedCatalogProduct.sellingPrice - newItemCostPrice).toLocaleString()} {currentBusiness.currency}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Variant Options If Available */}
                          {selectedCatalogProduct.variants && selectedCatalogProduct.variants.length > 0 && (
                            <div className="pt-2 border-t border-amber-200/60">
                              <label className="block text-stone-700 font-medium mb-1 text-[11px]">
                                Select Available Size & Color Variant:
                              </label>
                              <div className="flex flex-wrap gap-1.5">
                                {selectedCatalogProduct.variants.map((v) => {
                                  const isVariantActive = newItemSize === v.size && newItemColor === v.color;
                                  return (
                                    <button
                                      key={v.id}
                                      type="button"
                                      onClick={() => {
                                        setNewItemSize(v.size);
                                        setNewItemColor(v.color);
                                      }}
                                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                                        isVariantActive
                                          ? 'bg-stone-900 text-white border-stone-900 font-semibold shadow-2xs'
                                          : 'bg-white text-stone-700 border-stone-200 hover:border-stone-400'
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
                        /* Catalog Item Search and Visual Grid */
                        <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
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
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border cursor-pointer shrink-0 ${
                                  catalogCategoryFilter === 'ALL'
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'bg-white text-stone-600 border-stone-200'
                                }`}
                              >
                                All Categories
                              </button>
                              {categories.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() => setCatalogCategoryFilter(c.id)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-medium border cursor-pointer shrink-0 ${
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

                          {/* Product Image Cards Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                            {filteredCatalogProducts.length === 0 ? (
                              <div className="col-span-2 p-6 text-center text-stone-400">
                                <Boxes className="w-6 h-6 mx-auto mb-1 text-stone-300" />
                                <div>No catalog products found. Try a different search.</div>
                              </div>
                            ) : (
                              filteredCatalogProducts.map((p) => {
                                const primaryImg = p.images?.[0]?.imageUrl || '';
                                return (
                                  <div
                                    key={p.id}
                                    onClick={() => handleSelectCatalogProduct(p)}
                                    className="p-2.5 rounded-xl border border-stone-200 bg-white hover:border-stone-900 hover:shadow-2xs cursor-pointer transition-all flex items-center gap-2.5 group"
                                  >
                                    <div className="relative shrink-0">
                                      {primaryImg ? (
                                        <img
                                          src={primaryImg}
                                          alt={p.name}
                                          className="w-14 h-16 rounded-lg object-cover border border-stone-200 bg-stone-100 group-hover:scale-105 transition-transform"
                                        />
                                      ) : (
                                        <div className="w-14 h-16 rounded-lg bg-stone-100 flex items-center justify-center text-stone-400">
                                          <ImageIcon className="w-5 h-5" />
                                        </div>
                                      )}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (primaryImg) {
                                            setPreviewImage({
                                              url: primaryImg,
                                              title: p.name,
                                              subtitle: `SKU: ${p.sku} · ${p.sellingPrice.toLocaleString()} ${currentBusiness.currency}`,
                                            });
                                          }
                                        }}
                                        className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg text-white transition-opacity"
                                        title="Click to enlarge image"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
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

                  {/* Mode B: Custom Shein Item (Manual fields) */}
                  {itemSourceMode === 'custom' && (
                    <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                      <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-stone-500" />
                        <span>Shein Item Specifications</span>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-stone-700 font-medium mb-1">Product Title / Description *</label>
                          <input
                            type="text"
                            required
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="e.g. Elegance Pleated Satin Midi Dress"
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-700 font-medium mb-1">Shein SKU / Web Link</label>
                          <input
                            type="text"
                            value={newItemSkuOrLink}
                            onChange={(e) => setNewItemSkuOrLink(e.target.value)}
                            placeholder="e.g. sw2210080234 or https://shein.com/..."
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div>
                          <label className="block text-stone-600 mb-1">Category</label>
                          <select
                            value={newItemCategoryId}
                            onChange={(e) => setNewItemCategoryId(e.target.value)}
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white cursor-pointer"
                          >
                            {categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-stone-600 mb-1">Size</label>
                          <input
                            type="text"
                            value={newItemSize}
                            onChange={(e) => setNewItemSize(e.target.value)}
                            placeholder="M / 38"
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono uppercase"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 mb-1">Color</label>
                          <input
                            type="text"
                            value={newItemColor}
                            onChange={(e) => setNewItemColor(e.target.value)}
                            placeholder="Black / Navy"
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-stone-600 mb-1">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            required
                            value={newItemQuantity}
                            onChange={(e) => setNewItemQuantity(parseInt(e.target.value) || 1)}
                            className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono font-bold"
                          />
                        </div>
                      </div>

                      {/* Photo Presets with Visual Images */}
                      <div className="space-y-1.5 pt-1">
                        <label className="block text-stone-700 font-medium">Item Photo Preview & Presets</label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={newItemImageUrl}
                            onChange={(e) => setNewItemImageUrl(e.target.value)}
                            placeholder="Paste image URL or pick preset below..."
                            className="flex-1 p-2 rounded-lg border border-stone-300 bg-white font-mono text-[11px]"
                          />
                          {newItemImageUrl && (
                            <div
                              className="relative group/prev cursor-pointer shrink-0"
                              onClick={() =>
                                setPreviewImage({
                                  url: newItemImageUrl,
                                  title: newItemName || 'Item Photo Preview',
                                })
                              }
                              title="Click to enlarge"
                            >
                              <img
                                src={newItemImageUrl}
                                alt="Preview"
                                className="w-9 h-9 rounded object-cover border border-stone-300"
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/prev:opacity-100 flex items-center justify-center rounded text-white transition-opacity">
                                <Eye className="w-3 h-3" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                          {APPAREL_IMAGE_PRESETS.map((p) => (
                            <button
                              key={p.label}
                              type="button"
                              onClick={() => setNewItemImageUrl(p.url)}
                              className={`p-1.5 rounded-lg border text-left flex items-center gap-2 transition-all cursor-pointer ${
                                newItemImageUrl === p.url
                                  ? 'border-stone-900 bg-stone-100 ring-1 ring-stone-900'
                                  : 'border-stone-200 bg-white hover:border-stone-300'
                              }`}
                            >
                              <img
                                src={p.url}
                                alt={p.label}
                                className="w-8 h-8 rounded object-cover border border-stone-200 shrink-0"
                              />
                              <span className="text-[11px] font-medium text-stone-800 truncate">
                                {p.label}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Customer Information Section */}
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
                    <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-stone-500" />
                      <span>Customer & Delivery Details</span>
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Customer Full Name *</label>
                        <input
                          type="text"
                          required
                          value={newItemCustomerName}
                          onChange={(e) => setNewItemCustomerName(e.target.value)}
                          placeholder="e.g. Selamawit Tadesse"
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Phone Number *</label>
                        <input
                          type="text"
                          required
                          value={newItemCustomerPhone}
                          onChange={(e) => setNewItemCustomerPhone(e.target.value)}
                          placeholder="+251 9..."
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Telegram Handle</label>
                        <input
                          type="text"
                          value={newItemCustomerTelegram}
                          onChange={(e) => setNewItemCustomerTelegram(e.target.value)}
                          placeholder="@username"
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Delivery City / Area</label>
                        <input
                          type="text"
                          value={newItemDeliveryAddress}
                          onChange={(e) => setNewItemDeliveryAddress(e.target.value)}
                          placeholder="Bole, Addis Ababa"
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                        />
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">Payment Method</label>
                        <select
                          value={newItemPaymentMethod}
                          onChange={(e) => setNewItemPaymentMethod(e.target.value as PaymentMethod)}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-semibold cursor-pointer"
                        >
                          <option value="TELEBIRR">Telebirr</option>
                          <option value="CBE_BIRR">CBE Birr</option>
                          <option value="BANK_TRANSFER">Bank Transfer (BOA/Awash)</option>
                          <option value="CASH_ON_DELIVERY">Cash On Delivery</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Profit Margin */}
                  <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-amber-700" />
                        <span>Pricing & Profit Allocation</span>
                      </span>
                      {newItemCostPrice > 0 && newItemSellingPrice > 0 && (
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                          +{((newItemSellingPrice - newItemCostPrice) * newItemQuantity).toLocaleString()} ETB Profit ({Math.round(((newItemSellingPrice - newItemCostPrice) / newItemCostPrice) * 100)}% Markup)
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">
                          Unit Sourcing Cost (ETB) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={newItemCostPrice}
                          onChange={(e) => setNewItemCostPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono font-semibold"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          Total Cost: {(newItemCostPrice * newItemQuantity).toLocaleString()} ETB (will allocate against {targetBatchForAdding.batchCode})
                        </span>
                      </div>
                      <div>
                        <label className="block text-stone-700 font-medium mb-1">
                          Customer Selling Price (ETB) *
                        </label>
                        <input
                          type="number"
                          required
                          min={0}
                          value={newItemSellingPrice}
                          onChange={(e) => setNewItemSellingPrice(parseFloat(e.target.value) || 0)}
                          className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono font-bold text-stone-900"
                        />
                        <span className="text-[10px] text-stone-500 mt-1 block">
                          Total Revenue: {(newItemSellingPrice * newItemQuantity).toLocaleString()} ETB
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setTargetBatchForAdding(null)}
                      className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      <span>Add Item to Package {targetBatchForAdding.batchCode}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Tab 2: Attach Existing Orders */}
              {addItemsTab === 'link_orders' && (
                <div className="space-y-4 text-xs">
                  {/* Search and Filters for Orders */}
                  <div className="flex flex-col sm:flex-row gap-2.5 justify-between sm:items-center">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={linkOrderSearch}
                        onChange={(e) => setLinkOrderSearch(e.target.value)}
                        placeholder="Search order #, customer, phone, item..."
                        className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-stone-300 text-xs bg-white"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLinkFilterUnassignedOnly(!linkFilterUnassignedOnly)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border cursor-pointer ${
                          linkFilterUnassignedOnly
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        {linkFilterUnassignedOnly
                          ? `Unassigned Only (${unassignedOrdersCount})`
                          : 'Showing All Orders'}
                      </button>

                      {eligibleOrdersToLink.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            if (selectedOrderIdsToLink.length === eligibleOrdersToLink.length) {
                              setSelectedOrderIdsToLink([]);
                            } else {
                              setSelectedOrderIdsToLink(eligibleOrdersToLink.map((o) => o.id));
                            }
                          }}
                          className="px-2.5 py-1 text-xs text-stone-700 hover:bg-stone-100 rounded border border-stone-200 cursor-pointer"
                        >
                          {selectedOrderIdsToLink.length === eligibleOrdersToLink.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Orders Selectable List */}
                  <div className="border border-stone-200 rounded-xl divide-y divide-stone-100 max-h-72 overflow-y-auto bg-stone-50/50">
                    {eligibleOrdersToLink.length === 0 ? (
                      <div className="p-8 text-center text-stone-400">
                        <Boxes className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                        <div>No orders found matching the filter.</div>
                        {linkFilterUnassignedOnly && (
                          <button
                            type="button"
                            onClick={() => setLinkFilterUnassignedOnly(false)}
                            className="text-stone-700 underline font-medium mt-1 inline-block cursor-pointer"
                          >
                            View all store orders instead
                          </button>
                        )}
                      </div>
                    ) : (
                      eligibleOrdersToLink.map((order) => {
                        const isSelected = selectedOrderIdsToLink.includes(order.id);
                        const assignedBatch = packageBatches.find((b) => b.id === order.packageBatchId);

                        return (
                          <div
                            key={order.id}
                            onClick={() => {
                              setSelectedOrderIdsToLink((prev) =>
                                isSelected ? prev.filter((id) => id !== order.id) : [...prev, order.id]
                              );
                            }}
                            className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                              isSelected ? 'bg-amber-50/80' : 'hover:bg-stone-50 bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}} // Handled by parent div
                              className="mt-1 w-4 h-4 rounded text-stone-900 border-stone-300 focus:ring-stone-900"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <div className="font-semibold text-stone-900 font-mono text-xs">
                                  {order.orderNumber}
                                  <span className="font-sans font-normal text-stone-500 ml-2">
                                    · {order.customerName} ({order.customerPhone})
                                  </span>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-stone-900 text-xs">
                                    {order.total.toLocaleString()} {currentBusiness.currency}
                                  </div>
                                  {order.remainingBalance !== undefined && order.remainingBalance > 0 ? (
                                    <div className="text-[10px] text-amber-700 font-semibold">
                                      Due: {order.remainingBalance.toLocaleString()} {currentBusiness.currency}
                                    </div>
                                  ) : order.advancePaid !== undefined && order.advancePaid > 0 ? (
                                    <div className="text-[10px] text-emerald-600 font-medium">
                                      Paid in Full
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[11px] text-stone-500 font-medium">
                                  {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in order
                                </span>
                                {assignedBatch ? (
                                  <span className="bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded text-[10px]">
                                    Currently in: {assignedBatch.batchCode}
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold">
                                    Unassigned
                                  </span>
                                )}
                              </div>

                              {/* Visual Items Strip with Item Images */}
                              <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                {order.items.map((item, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2.5 p-2 rounded-lg bg-stone-50/80 border border-stone-200/80 hover:bg-stone-100/80 transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div
                                      className="relative group/thumb shrink-0 cursor-pointer"
                                      onClick={() =>
                                        setPreviewImage({
                                          url: item.imageUrl,
                                          title: item.productName,
                                          subtitle: `Order ${order.orderNumber} · SKU: ${item.sku} · Qty: ${item.quantity}`,
                                        })
                                      }
                                      title="Click to enlarge item image"
                                    >
                                      <img
                                        src={item.imageUrl}
                                        alt={item.productName}
                                        className="w-12 h-14 rounded-md object-cover border border-stone-200 bg-white shadow-2xs group-hover/thumb:brightness-95 transition-all"
                                      />
                                      <div className="absolute inset-0 bg-stone-950/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center rounded-md text-white transition-opacity">
                                        <Eye className="w-3.5 h-3.5" />
                                      </div>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-semibold text-stone-900 text-xs truncate" title={item.productName}>
                                        {item.productName}
                                      </div>
                                      <div className="text-[10px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                                        <span className="font-mono bg-stone-200/70 px-1 py-0.2 rounded text-stone-700 font-medium">
                                          {item.sku}
                                        </span>
                                        <span>· Qty: <strong className="text-stone-900 font-bold">{item.quantity}</strong></span>
                                      </div>
                                      {item.variantSummary && (
                                        <div className="text-[10px] text-stone-600 truncate mt-0.5">
                                          {item.variantSummary}
                                        </div>
                                      )}
                                      <div className="text-[11px] font-bold text-stone-900 mt-0.5">
                                        {(item.unitPrice * item.quantity).toLocaleString()} {currentBusiness.currency}
                                        {item.quantity > 1 && (
                                          <span className="text-[10px] text-stone-400 font-normal ml-1">
                                            ({item.unitPrice.toLocaleString()}/ea)
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Link Selected Action Bar */}
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-stone-100">
                    <div className="text-stone-500 text-xs">
                      <span className="font-bold text-stone-900">{selectedOrderIdsToLink.length}</span> orders selected to attach
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTargetBatchForAdding(null)}
                        className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={selectedOrderIdsToLink.length === 0}
                        onClick={handleLinkExistingOrders}
                        className={`px-5 py-2.5 rounded-xl font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                          selectedOrderIdsToLink.length > 0
                            ? 'bg-stone-900 hover:bg-stone-800 text-white'
                            : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                        }`}
                      >
                        <Link2 className="w-4 h-4 text-amber-400" />
                        <span>
                          Attach {selectedOrderIdsToLink.length} Orders to {targetBatchForAdding.batchCode}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* IMAGE LIGHTBOX / PREVIEW MODAL                                   */}
      {/* ---------------------------------------------------------------- */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="bg-stone-900 border border-stone-700 rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl relative text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3.5 border-b border-stone-800 flex items-center justify-between">
              <div className="min-w-0 pr-3">
                <h4 className="font-semibold text-sm truncate">{previewImage.title}</h4>
                {previewImage.subtitle && (
                  <p className="text-[11px] text-stone-400 truncate mt-0.5">{previewImage.subtitle}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-stone-950 flex items-center justify-center min-h-[300px] max-h-[70vh]">
              <img
                src={previewImage.url}
                alt={previewImage.title}
                className="max-h-[65vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
              />
            </div>
            <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between text-xs text-stone-400">
              <span className="truncate font-mono text-[10px]">{previewImage.url}</span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="px-3 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold cursor-pointer shrink-0 ml-2"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EDIT PACKAGE MODAL                                               */}
      {/* ---------------------------------------------------------------- */}
      {editingBatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4 text-amber-800" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">Edit Whole Package</h3>
                  <p className="text-xs text-stone-500">
                    Update cargo code, financial costs, tracking status and dates for {editingBatch.batchCode}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingBatch(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditBatch} className="space-y-4 text-xs">
              {/* Batch Code & Nickname */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Package / Cargo Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={editBatchCode}
                    onChange={(e) => setEditBatchCode(e.target.value)}
                    placeholder="e.g. GSH18M45R00M2RV"
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Package Name / Nickname
                  </label>
                  <input
                    type="text"
                    value={editBatchName}
                    onChange={(e) => setEditBatchName(e.target.value)}
                    placeholder="e.g. Shein Dubai Air Cargo #12"
                    className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 bg-white"
                  />
                </div>
              </div>

              {/* Status and Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Cargo Status *
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PackageBatch['status'])}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white font-medium focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    <option value="ORDERED">Ordered from Supplier</option>
                    <option value="IN_TRANSIT">In Transit / Air Freight</option>
                    <option value="CUSTOMS_CLEARING">Customs Clearing</option>
                    <option value="ARRIVED">Arrived in Addis Ababa</option>
                    <option value="DISTRIBUTED">Distributed / Finished</option>
                  </select>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Order / Ship Date
                  </label>
                  <input
                    type="date"
                    value={editOrderDate}
                    onChange={(e) => setEditOrderDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Arrival Date
                  </label>
                  <input
                    type="date"
                    value={editArrivalDate}
                    onChange={(e) => setEditArrivalDate(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              {/* Foreign Currency & Exchange Rate */}
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2.5">
                <div className="font-semibold text-amber-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-amber-700" />
                    Supplier Invoice Currency & Rate
                  </span>
                  <span className="text-[10px] text-amber-700 font-normal">
                    Auto-converts foreign invoice to ETB base
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Invoice Currency</label>
                    <select
                      value={editSourceCurrency}
                      onChange={(e) => setEditSourceCurrency(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono"
                    >
                      <option value="AED">AED (UAE Dirham)</option>
                      <option value="USD">USD (US Dollar)</option>
                      <option value="CNY">CNY (Chinese Yuan)</option>
                      <option value="EUR">EUR (Euro)</option>
                      <option value="ETB">ETB (Ethiopian Birr)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Invoice Amount</label>
                    <input
                      type="number"
                      step="any"
                      value={editSourceAmount}
                      onChange={(e) => handleEditSourceAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-stone-600 mb-1 text-[11px]">Rate to ETB</label>
                    <input
                      type="number"
                      step="any"
                      value={editExchangeRate}
                      onChange={(e) => handleEditExchangeRateChange(parseFloat(e.target.value) || 0)}
                      className="w-full p-2 rounded-lg border border-stone-300 bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Whole Package ETB Costs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Whole Package Cost in ETB *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={editPackageCost}
                    onChange={(e) => setEditPackageCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-bold text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">Total invoice cost converted into Birr</span>
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Expected Sales Revenue (ETB)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editTargetSales}
                    onChange={(e) => setEditTargetSales(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-lg border border-stone-300 font-bold text-emerald-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                  <span className="text-[10px] text-stone-500 mt-0.5 block">Target retail sales total for this box</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-600 mb-1">Air Cargo Shipping (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    value={editPackageShipping}
                    onChange={(e) => setEditPackageShipping(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 mb-1">Customs Clearance Tax (ETB)</label>
                  <input
                    type="number"
                    step="any"
                    value={editPackageCustomsTax}
                    onChange={(e) => setEditPackageCustomsTax(parseFloat(e.target.value) || 0)}
                    className="w-full p-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">Notes / Cargo Details</label>
                <textarea
                  rows={2}
                  value={editBatchNotes}
                  onChange={(e) => setEditBatchNotes(e.target.value)}
                  placeholder="e.g. Sourced via Dubai Shein hub, flight arrived terminal 2..."
                  className="w-full p-2.5 rounded-lg border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingBatch(null)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs cursor-pointer"
                >
                  Save Package Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* DELETE PACKAGE CONFIRMATION MODAL                                */}
      {/* ---------------------------------------------------------------- */}
      {deleteBatchTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Delete Whole Package?
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Batch Code: <span className="font-mono font-bold text-stone-900">{deleteBatchTarget.batchCode}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteBatchTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Package details summary */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-2 text-xs">
              {deleteBatchTarget.batchName && (
                <div className="flex justify-between text-stone-600">
                  <span className="text-stone-500">Name:</span>
                  <span className="font-semibold text-stone-900">{deleteBatchTarget.batchName}</span>
                </div>
              )}
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Status:</span>
                <span className="font-semibold text-stone-800">{deleteBatchTarget.status}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Total Cargo Cost:</span>
                <span className="font-bold text-stone-900 font-mono">
                  {deleteBatchTarget.totalPackageCost.toLocaleString()} {currentBusiness.currency}
                </span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Attached Orders:</span>
                <span className="font-semibold text-indigo-700">
                  {orders.filter((o) => o.packageBatchId === deleteBatchTarget.id).length} order(s)
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently remove <strong>{deleteBatchTarget.batchCode}</strong>?
              Any attached customer orders will automatically become <em>unassigned</em> so you will not lose any customer records.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteBatchTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteBatch}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete Package</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TOAST NOTIFICATION                                               */}
      {/* ---------------------------------------------------------------- */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs animate-in slide-in-from-bottom duration-200 border border-stone-700">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
