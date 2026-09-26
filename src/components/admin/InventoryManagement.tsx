import React, { useState, useMemo, useRef } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product } from '../../types';
import { ProductEditorModal } from './ProductEditorModal';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import {
  DateRangeFilter,
  DateFilterState,
  isDateInFilter,
  formatDisplayDate,
} from '../common/DateRangeFilter';
import {
  Plus,
  Search,
  Edit3,
  Trash2,
  Check,
  X,
  AlertTriangle,
  Store,
  CheckCircle2,
  Calendar,
  ArrowUpDown,
  Upload,
  Download,
  Package,
  TrendingUp,
  PackageX,
  RefreshCw,
  ArrowRight,
  ShoppingCart,
  Boxes,
} from 'lucide-react';

export const InventoryManagement: React.FC = () => {
  const {
    products,
    categories,
    currentBusiness,
    toggleProductVisibility,
    deleteProduct,
    updateVariantStock,
    orders,
    registerManualOrder,
    deleteOrderItem,
    addProduct,
    setAdminTab,
  } = useRetail();

  // Primary Tab: "In Stock" vs "Sold Items"
  const [inventorySubTab, setInventorySubTab] = useState<'inStock' | 'soldItems'>('inStock');

  // Sold Items view mode: Sold Out Products (0 on hand) vs In-Store Walk-in Sales (direct shelf sales)
  const [soldViewMode, setSoldViewMode] = useState<'depletedStock' | 'inStoreSales'>('depletedStock');

  // Common Filters
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out' | 'in'>('in');
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'ALL',
    startDate: '',
    endDate: '',
  });
  const [dateTargetField, setDateTargetField] = useState<'createdAt' | 'updatedAt'>('createdAt');
  const [sortField, setSortField] = useState<'date' | 'name' | 'stock'>('date');
  const [sortDirection, setSortDirection] = useState<'desc' | 'asc'>('desc');

  // Modals state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);

  // Mark Sold (In-Store Boutique Walk-in) Modal State
  const [markSoldProduct, setMarkSoldProduct] = useState<Product | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [soldQuantity, setSoldQuantity] = useState(1);
  const [walkInCustomerName, setWalkInCustomerName] = useState('Walk-in Boutique Client');
  const [walkInPhone, setWalkInPhone] = useState('+251 90 000 0000');
  const [soldNote, setSoldNote] = useState('In-store walk-in counter purchase');

  // Quick Restock Modal State
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockVariantId, setRestockVariantId] = useState('');
  const [restockUnitsToAdd, setRestockUnitsToAdd] = useState(5);

  // Import / Export Modals
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importJsonText, setImportJsonText] = useState('');

  // Sold Item Deletion Confirmation State
  const [deleteSoldItemTarget, setDeleteSoldItemTarget] = useState<{
    id: string;
    orderId: string;
    itemIndex: number;
    orderNumber: string;
    date: string;
    customerName: string;
    productName: string;
    productId: string;
    variantId?: string;
    variantSummary: string;
    sku: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    imageUrl: string;
  } | null>(null);
  const [restoreStockOnDelete, setRestoreStockOnDelete] = useState(true);

  // Product Deletion Confirmation State
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // -------------------------------------------------------------------------
  // PHYSICAL INVENTORY ONLY (strictly excludes customer ordered items)
  // -------------------------------------------------------------------------
  const inventoryProducts = useMemo(() => {
    return products.filter(
      (p) => !p.isOrderedItem && !p.description?.includes('Customer selected Shein item')
    );
  }, [products]);

  // -------------------------------------------------------------------------
  // KPI CALCULATIONS (matching 5 metrics cards)
  // -------------------------------------------------------------------------
  const totalItems = inventoryProducts.length;

  const totalStock = useMemo(() => {
    return inventoryProducts.reduce(
      (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0),
      0
    );
  }, [inventoryProducts]);

  const lowStockCount = useMemo(() => {
    return inventoryProducts.filter((p) => {
      const stock = p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0);
      return stock > 0 && stock <= 3;
    }).length;
  }, [inventoryProducts]);

  const soldOutCount = useMemo(() => {
    return inventoryProducts.filter((p) => {
      const stock = p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0);
      return stock === 0;
    }).length;
  }, [inventoryProducts]);

  const inStockCount = useMemo(() => {
    return inventoryProducts.filter((p) => {
      const stock = p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0);
      return stock > 0;
    }).length;
  }, [inventoryProducts]);

  const stockValueRetail = useMemo(() => {
    return inventoryProducts.reduce((sum, p) => {
      const stock = p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0);
      return sum + p.sellingPrice * stock;
    }, 0);
  }, [inventoryProducts]);

  // -------------------------------------------------------------------------
  // IN-STORE ONLY SALES (Walk-in counter sales from physical stock)
  // Ordered items (Telegram, Online, Shein) are managed separately!
  // -------------------------------------------------------------------------
  const inStoreWalkInSales = useMemo(() => {
    const list: Array<{
      id: string;
      orderId: string;
      itemIndex: number;
      orderNumber: string;
      date: string;
      customerName: string;
      productName: string;
      productId: string;
      variantId?: string;
      variantSummary: string;
      sku: string;
      quantity: number;
      unitPrice: number;
      costPrice: number;
      totalPrice: number;
      profit: number;
      imageUrl: string;
    }> = [];

    orders.forEach((o) => {
      // ONLY walk-in counter purchases that came directly out of boutique stock
      if (o.source !== 'WALK_IN' || o.status === 'CANCELLED') return;
      o.items.forEach((item, idx) => {
        const prod = products.find((p) => p.id === item.productId);
        const effectiveCost = item.costPrice || prod?.costPrice || 0;
        const profit = (item.unitPrice - effectiveCost) * item.quantity;

        list.push({
          id: `${o.id}-${item.productId}-${idx}`,
          orderId: o.id,
          itemIndex: idx,
          orderNumber: o.orderNumber,
          date: o.createdAt,
          customerName: o.customerName,
          productName: item.productName,
          productId: item.productId,
          variantId: item.variantId,
          variantSummary: item.variantSummary,
          sku: item.sku,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          costPrice: effectiveCost,
          totalPrice: item.unitPrice * item.quantity,
          profit,
          imageUrl: item.imageUrl,
        });
      });
    });

    return list;
  }, [orders, products]);

  // -------------------------------------------------------------------------
  // FILTERED LISTS
  // -------------------------------------------------------------------------

  // 1. IN STOCK PRODUCTS
  const filteredInStockProducts = useMemo(() => {
    return inventoryProducts
      .filter((p) => {
        const totalVariantStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

        if (stockFilter === 'in' && totalVariantStock === 0) return false;
        if (stockFilter === 'low' && (totalVariantStock === 0 || totalVariantStock > 3)) return false;
        if (stockFilter === 'out' && totalVariantStock > 0) return false;

        if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchDesc) return false;
        }

        const targetDate = dateTargetField === 'createdAt' ? p.createdAt : p.updatedAt || p.createdAt;
        if (!isDateInFilter(targetDate, dateFilter)) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'date') {
          const dateA = new Date(
            dateTargetField === 'createdAt' ? a.createdAt : a.updatedAt || a.createdAt
          ).getTime();
          const dateB = new Date(
            dateTargetField === 'createdAt' ? b.createdAt : b.updatedAt || b.createdAt
          ).getTime();
          return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
        }
        if (sortField === 'name') {
          return sortDirection === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name);
        }
        if (sortField === 'stock') {
          const stockA = a.variants.reduce((s, v) => s + v.stockQuantity, 0);
          const stockB = b.variants.reduce((s, v) => s + v.stockQuantity, 0);
          return sortDirection === 'desc' ? stockB - stockA : stockA - stockB;
        }
        return 0;
      });
  }, [
    inventoryProducts,
    stockFilter,
    selectedCat,
    search,
    dateTargetField,
    dateFilter,
    sortField,
    sortDirection,
  ]);

  // 2. SOLD OUT / DEPLETED INVENTORY ITEMS (0 on hand)
  const depletedProducts = useMemo(() => {
    return inventoryProducts
      .filter((p) => {
        const totalVariantStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
        if (totalVariantStock > 0) return false;

        if (selectedCat !== 'all' && p.categoryId !== selectedCat) return false;

        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = p.name.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          if (!matchName && !matchSku) return false;
        }

        const targetDate = dateTargetField === 'createdAt' ? p.createdAt : p.updatedAt || p.createdAt;
        if (!isDateInFilter(targetDate, dateFilter)) return false;

        return true;
      })
      .sort((a, b) => {
        return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime();
      });
  }, [inventoryProducts, selectedCat, search, dateTargetField, dateFilter]);

  // 3. FILTERED IN-STORE WALK-IN SALES
  const filteredInStoreSales = useMemo(() => {
    return inStoreWalkInSales
      .filter((r) => {
        if (!isDateInFilter(r.date, dateFilter)) return false;
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchName = r.productName.toLowerCase().includes(q);
          const matchSku = r.sku.toLowerCase().includes(q);
          const matchOrder = r.orderNumber.toLowerCase().includes(q);
          if (!matchName && !matchSku && !matchOrder) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortDirection === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [inStoreWalkInSales, dateFilter, search, sortDirection]);

  // -------------------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------------------
  const handleEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsEditorOpen(true);
  };

  const handleAddNew = () => {
    setEditingProduct(null);
    setIsEditorOpen(true);
  };

  const handleOpenMarkSold = (prod: Product) => {
    setMarkSoldProduct(prod);
    const availableVariant = prod.variants.find((v) => v.stockQuantity > 0) || prod.variants[0];
    setSelectedVariantId(availableVariant?.id || '');
    setSoldQuantity(1);
    setWalkInCustomerName('Walk-in Boutique Client');
    setWalkInPhone('+251 90 000 0000');
    setSoldNote('In-store walk-in counter purchase');
  };

  const handleConfirmMarkSold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!markSoldProduct) return;

    const variant = markSoldProduct.variants.find((v) => v.id === selectedVariantId);
    if (!variant) return;

    if (variant.stockQuantity < soldQuantity) {
      alert(`Only ${variant.stockQuantity} unit(s) remaining for this variant.`);
      return;
    }

    // Register sale as an in-store counter order
    const res = registerManualOrder({
      source: 'WALK_IN',
      customerName: walkInCustomerName.trim() || 'Walk-in Boutique Client',
      customerPhone: walkInPhone.trim() || '+251 90 000 0000',
      deliveryAddress: 'In-Store Boutique Checkout',
      paymentMethod: 'CASH_ON_DELIVERY',
      items: [{ productId: markSoldProduct.id, variantId: variant.id, quantity: soldQuantity }],
      registeredBy: 'Boutique Staff',
      notes: soldNote || 'In-store walk-in counter purchase',
    });

    if (res.success) {
      showToast(
        `✓ Marked ${soldQuantity} unit(s) of "${markSoldProduct.name} (${variant.size}/${variant.color})" sold in boutique!`
      );
    } else {
      const newStock = Math.max(0, variant.stockQuantity - soldQuantity);
      updateVariantStock(markSoldProduct.id, variant.id, newStock);
      showToast(`✓ Deducted ${soldQuantity} unit(s) from inventory.`);
    }

    setMarkSoldProduct(null);
  };

  const handleOpenRestock = (prod: Product) => {
    setRestockProduct(prod);
    setRestockVariantId(prod.variants[0]?.id || '');
    setRestockUnitsToAdd(5);
  };

  const handleConfirmRestock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockProduct) return;

    const variant = restockProduct.variants.find((v) => v.id === restockVariantId);
    if (!variant) return;

    const newStock = variant.stockQuantity + Number(restockUnitsToAdd);
    updateVariantStock(restockProduct.id, variant.id, newStock);

    showToast(
      `✓ Restocked +${restockUnitsToAdd} units for "${restockProduct.name} (${variant.size}/${variant.color})". Total stock is now ${newStock}.`
    );
    setRestockProduct(null);
  };

  // Confirm delete for sold item transaction
  const handleConfirmDeleteSoldItem = () => {
    if (!deleteSoldItemTarget) return;

    deleteOrderItem(
      deleteSoldItemTarget.orderId,
      deleteSoldItemTarget.itemIndex,
      restoreStockOnDelete
    );

    showToast(
      `✓ Removed sold item record for "${deleteSoldItemTarget.productName}".${
        restoreStockOnDelete
          ? ` Restored ${deleteSoldItemTarget.quantity} unit(s) back to inventory.`
          : ''
      }`
    );

    setDeleteSoldItemTarget(null);
  };

  // Confirm delete for product (Active catalog or Sold-out/Depleted)
  const handleConfirmDeleteProduct = () => {
    if (!deleteProductTarget) return;
    const name = deleteProductTarget.name;
    deleteProduct(deleteProductTarget.id);
    showToast(`✓ Permanently deleted "${name}" from inventory.`);
    setDeleteProductTarget(null);
  };

  // Export inventory to CSV
  const handleExportCSV = () => {
    const headers = ['SKU', 'Name', 'Category', 'Cost Price (ETB)', 'Selling Price (ETB)', 'Total Stock', 'Status'];
    const rows = inventoryProducts.map((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name || 'General';
      const stock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
      return [
        `"${p.sku}"`,
        `"${p.name.replace(/"/g, '""')}"`,
        `"${cat}"`,
        p.costPrice,
        p.sellingPrice,
        stock,
        p.isPublished ? 'Published' : 'Draft',
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventory_${currentBusiness.slug}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast('✓ Inventory CSV exported successfully!');
  };

  // Handle JSON Import
  const handleImportJson = () => {
    try {
      const parsed = JSON.parse(importJsonText);
      if (!Array.isArray(parsed)) {
        alert('Invalid JSON: Must be an array of products.');
        return;
      }

      let count = 0;
      parsed.forEach((item: any) => {
        if (item.name && item.sku) {
          addProduct({
            name: item.name,
            sku: item.sku,
            description: item.description || '',
            categoryId: item.categoryId || categories[0]?.id || 'cat-top',
            costPrice: Number(item.costPrice) || 1000,
            sellingPrice: Number(item.sellingPrice) || 2000,
            isActive: item.isActive !== false,
            isPublished: item.isPublished !== false,
            isOnline: item.isOnline !== false,
            images: item.images || [
              {
                id: `img-${Date.now()}-${count}`,
                productId: '',
                imageUrl:
                  item.imageUrl ||
                  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
                altText: item.name,
                isPrimary: true,
                sortOrder: 1,
              },
            ],
            variants: item.variants || [
              {
                id: `var-${Date.now()}-${count}`,
                productId: '',
                sku: `${item.sku}-STD`,
                size: 'Standard',
                color: 'Default',
                stockQuantity: Number(item.stockQuantity) || 5,
              },
            ],
          });
          count++;
        }
      });

      showToast(`✓ Successfully imported ${count} product(s) into inventory!`);
      setIsImportModalOpen(false);
      setImportJsonText('');
    } catch {
      alert('Failed to parse JSON. Please check formatting.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
    };
    reader.readAsText(file);
  };

  const selectedSoldVariant = markSoldProduct?.variants.find((v) => v.id === selectedVariantId);
  const selectedRestockVariant = restockProduct?.variants.find((v) => v.id === restockVariantId);

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2 shadow-xs text-xs font-semibold animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* HEADER SECTION (matching screenshot title & buttons)                */}
      {/* ------------------------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
            Inventory Management
          </h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Manage your physical product stock and inventory
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5 text-stone-500" />
            <span>Import</span>
          </button>

          {/* Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-lg border border-stone-200 bg-white text-stone-700 text-xs font-medium hover:bg-stone-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5 text-stone-500" />
            <span>Export</span>
          </button>

          {/* + Add Item Button (Burgundy / Maroon button matching screenshot) */}
          <button
            type="button"
            onClick={handleAddNew}
            className="px-4 py-2 rounded-lg bg-[#993333] hover:bg-[#802a2a] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
          
          <button
            type="button"
            onClick={() => setIsCategoryManagerOpen(true)}
            className="px-4 py-2 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-900 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Manage Categories</span>
          </button>
        </div>
      </div>
      
      {isCategoryManagerOpen && (
        <CategoryManagerModal onClose={() => setIsCategoryManagerOpen(false)} />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* 5 KPI METRICS CARDS (matching screenshot layout and icons)           */}
      {/* ------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Items */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">Total Items</div>
            <div className="text-xl font-bold text-stone-900 tracking-tight">{totalItems}</div>
          </div>
        </div>

        {/* Card 2: Total Stock */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">Total Stock</div>
            <div className="text-xl font-bold text-stone-900 tracking-tight">{totalStock}</div>
          </div>
        </div>

        {/* Card 3: Low Stock */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">Low Stock</div>
            <div className="text-xl font-bold text-stone-900 tracking-tight">{lowStockCount}</div>
          </div>
        </div>

        {/* Card 4: Sold Out */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 shrink-0">
            <PackageX className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-medium text-stone-500">Sold Out</div>
            <div className="text-xl font-bold text-stone-900 tracking-tight">{soldOutCount}</div>
          </div>
        </div>

        {/* Card 5: Stock Value (Retail) */}
        <div className="bg-white rounded-xl border border-stone-200 p-4 shadow-2xs flex items-center gap-3.5 col-span-2 sm:col-span-1">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="overflow-hidden">
            <div className="text-[11px] font-medium text-stone-500">Stock Value (Retail)</div>
            <div className="text-sm sm:text-base font-bold text-stone-900 tracking-tight truncate">
              {currentBusiness.currency}{' '}
              {stockValueRetail.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* SEPARATION NOTICE BANNER: Customer Ordered Items Managed Separately */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-900 shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div className="text-stone-700">
            <span className="font-semibold text-stone-900">Separate Management:</span> Customer pre-orders and custom Shein requests are managed separately under the Orders section and not included in this physical inventory.
          </div>
        </div>
        <button
          type="button"
          onClick={() => setAdminTab('orders')}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-stone-300 text-stone-800 hover:bg-stone-100 text-xs font-semibold transition-colors shrink-0 shadow-2xs"
        >
          <span>Go to Ordered Items</span>
          <ArrowRight className="w-3.5 h-3.5 text-stone-500" />
        </button>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* IN STOCK & SOLD ITEMS TABS                                          */}
      {/* ------------------------------------------------------------------- */}
      <div className="border-b border-stone-200">
        <nav className="flex space-x-8" aria-label="Inventory View Sections">
          {/* Tab 1: In Stock */}
          <button
            type="button"
            onClick={() => {
              setInventorySubTab('inStock');
              if (stockFilter === 'out') setStockFilter('in');
            }}
            className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              inventorySubTab === 'inStock'
                ? 'border-[#993333] text-[#993333]'
                : 'border-transparent text-stone-500 hover:text-stone-800 font-medium'
            }`}
          >
            <span>In Stock</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                inventorySubTab === 'inStock'
                  ? 'bg-red-50 text-[#993333] border border-red-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {inStockCount}
            </span>
          </button>

          {/* Tab 2: Sold Items */}
          <button
            type="button"
            onClick={() => setInventorySubTab('soldItems')}
            className={`pb-3 px-1 text-sm font-semibold transition-colors border-b-2 flex items-center gap-2 ${
              inventorySubTab === 'soldItems'
                ? 'border-[#993333] text-[#993333]'
                : 'border-transparent text-stone-500 hover:text-stone-800 font-medium'
            }`}
          >
            <span>Sold Items</span>
            <span
              className={`text-[11px] px-2 py-0.5 rounded-full font-bold transition-colors ${
                inventorySubTab === 'soldItems'
                  ? 'bg-red-50 text-[#993333] border border-red-200'
                  : 'bg-stone-100 text-stone-600'
              }`}
            >
              {soldOutCount}
            </span>
          </button>
        </nav>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* FILTER & SEARCH TOOLBAR                                             */}
      {/* ------------------------------------------------------------------- */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[260px]">
          {/* Search by name or SKU */}
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-stone-300 text-xs bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          {/* Status Dropdown */}
          {inventorySubTab === 'inStock' ? (
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="p-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-700 cursor-pointer font-medium"
            >
              <option value="in">All Status (In Stock)</option>
              <option value="all">All Levels</option>
              <option value="low">Low Stock (≤ 3 units)</option>
              <option value="out">Out of Stock (0 units)</option>
            </select>
          ) : (
            <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
              <button
                type="button"
                onClick={() => setSoldViewMode('depletedStock')}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  soldViewMode === 'depletedStock'
                    ? 'bg-white text-[#993333] shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Depleted Items (0 on hand: {soldOutCount})
              </button>
              <button
                type="button"
                onClick={() => setSoldViewMode('inStoreSales')}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
                  soldViewMode === 'inStoreSales'
                    ? 'bg-white text-stone-900 shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                In-Store Counter Sales ({inStoreWalkInSales.length})
              </button>
            </div>
          )}

          {/* Category Filter */}
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            className="p-2 rounded-lg border border-stone-300 bg-white text-xs text-stone-700 cursor-pointer font-medium"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Date Filter */}
          <div className="flex items-center gap-1.5 border-l border-stone-200 pl-2">
            <span className="text-[11px] text-stone-500 font-medium hidden sm:inline">Date:</span>
            <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
          </div>
        </div>

        {/* Sort & Order */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSortDirection((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
            className="flex items-center gap-1 text-[11px] text-stone-600 hover:text-stone-900 bg-stone-50 hover:bg-stone-100 px-2.5 py-2 rounded-lg border border-stone-200"
            title="Toggle Sort Order"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortDirection === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------- */}
      {/* TAB 1: IN STOCK PRODUCTS VIEW                                       */}
      {/* ------------------------------------------------------------------- */}
      {inventorySubTab === 'inStock' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-semibold">
                  <tr>
                    <th className="p-3.5">Product & SKU</th>
                    <th className="p-3.5">Date Added</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Cost & Selling (Retail)</th>
                    <th className="p-3.5">Total Stock</th>
                    <th className="p-3.5">Profit (Margin)</th>
                    <th className="p-3.5">Variant Sizes/Colors</th>
                    <th className="p-3.5 text-center">Storefront</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {filteredInStockProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-10 text-center text-stone-400">
                        <Package className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                        <div>No in-stock physical products found matching criteria.</div>
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('');
                            setSelectedCat('all');
                            setStockFilter('all');
                            setDateFilter({ preset: 'ALL', startDate: '', endDate: '' });
                          }}
                          className="mt-2 text-xs font-semibold text-[#993333] hover:underline"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredInStockProducts.map((p) => {
                      const totalVariantStock = p.variants.reduce((sum, v) => sum + v.stockQuantity, 0);
                      const categoryName = categories.find((c) => c.id === p.categoryId)?.name || 'General';
                      const grossMargin = p.sellingPrice - p.costPrice;
                      const marginPercent = Math.round((grossMargin / p.sellingPrice) * 100);

                      return (
                        <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                          {/* Product & SKU */}
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-11 h-13 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                                {p.images[0]?.imageUrl ? (
                                  <img
                                    src={p.images[0].imageUrl}
                                    alt={p.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                    No pic
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-stone-900 line-clamp-1">{p.name}</div>
                                <div className="text-[11px] text-stone-500 font-mono mt-0.5">{p.sku}</div>
                              </div>
                            </div>
                          </td>

                          {/* Date Added */}
                          <td className="p-3.5 whitespace-nowrap text-stone-600 font-medium">
                            <div className="flex items-center gap-1.5 text-stone-800">
                              <Calendar className="w-3.5 h-3.5 text-stone-400" />
                              <span>{formatDisplayDate(p.createdAt)}</span>
                            </div>
                            {p.updatedAt && p.updatedAt !== p.createdAt && (
                              <div className="text-[10px] text-stone-400 mt-0.5">
                                Upd: {formatDisplayDate(p.updatedAt)}
                              </div>
                            )}
                          </td>

                          {/* Category */}
                          <td className="p-3.5 text-stone-600 font-medium">
                            <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700">
                              {categoryName}
                            </span>
                          </td>

                          {/* Cost & Selling */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-stone-900">
                              {p.sellingPrice.toLocaleString()} {currentBusiness.currency}
                            </div>
                            <div className="text-[11px] text-stone-500 flex items-center gap-1.5 mt-0.5">
                              <span>Cost: {p.costPrice.toLocaleString()}</span>
                              <span className="text-emerald-700 font-semibold font-mono text-[10px]">
                                (+{marginPercent}%)
                              </span>
                            </div>
                          </td>

                          {/* Total Stock */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-2.5 py-1 rounded-md font-bold font-mono ${
                                  totalVariantStock === 0
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                    : totalVariantStock <= 3
                                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                }`}
                              >
                                {totalVariantStock} on hand
                              </span>
                            </div>
                          </td>

                          {/* Profit (Margin & Stock Potential) */}
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`font-bold font-mono text-xs ${
                                  grossMargin >= 0 ? 'text-emerald-700' : 'text-rose-600'
                                }`}
                              >
                                {grossMargin >= 0 ? '+' : ''}{grossMargin.toLocaleString()} {currentBusiness.currency}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                  marginPercent >= 40
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : marginPercent >= 20
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}
                              >
                                {marginPercent}%
                              </span>
                            </div>
                            <div className="text-[10px] text-stone-500 font-medium mt-0.5">
                              Stock potential: <span className="font-semibold text-stone-700 font-mono">
                                {(grossMargin * totalVariantStock).toLocaleString()} {currentBusiness.currency}
                              </span>
                            </div>
                          </td>

                          {/* Variant Sizes/Colors */}
                          <td className="p-3.5">
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {p.variants.map((v) => (
                                <span
                                  key={v.id}
                                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border ${
                                    v.stockQuantity === 0
                                      ? 'bg-stone-100 text-stone-400 border-stone-200 line-through'
                                      : v.stockQuantity <= 2
                                      ? 'bg-amber-50 text-amber-900 border-amber-200 font-semibold'
                                      : 'bg-white text-stone-800 border-stone-200 font-medium'
                                  }`}
                                  title={`${v.size} / ${v.color} - ${v.stockQuantity} in stock`}
                                >
                                  <span>{v.size}</span>
                                  <span className="text-stone-400">/</span>
                                  <span>{v.color}</span>
                                  <span className="font-mono font-bold text-stone-900">({v.stockQuantity})</span>
                                </span>
                              ))}
                            </div>
                          </td>

                          {/* Storefront Online Visibility Toggle */}
                          <td className="p-3.5 text-center">
                            <button
                              type="button"
                              onClick={() => toggleProductVisibility(p.id, 'is_online')}
                              className={`p-1.5 rounded-lg border transition-all ${
                                p.isOnline && p.isPublished
                                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100'
                                  : 'bg-stone-100 border-stone-200 text-stone-400 hover:bg-stone-200'
                              }`}
                              title={p.isOnline ? 'Online on Storefront' : 'Hidden from Storefront'}
                            >
                              {p.isOnline && p.isPublished ? (
                                <Check className="w-4 h-4" />
                              ) : (
                                <X className="w-4 h-4" />
                              )}
                            </button>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Mark Sold (In-Store Walk-in) */}
                              <button
                                type="button"
                                onClick={() => handleOpenMarkSold(p)}
                                disabled={totalVariantStock === 0}
                                className="px-2.5 py-1 text-[11px] font-semibold bg-stone-900 hover:bg-stone-800 disabled:opacity-40 text-white rounded-md flex items-center gap-1 transition-colors shadow-2xs"
                                title="Mark Sold to In-Store Walk-in Customer"
                              >
                                <Store className="w-3 h-3 text-amber-300" />
                                <span>Mark Sold</span>
                              </button>

                              {/* Restock Button */}
                              <button
                                type="button"
                                onClick={() => handleOpenRestock(p)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
                                title="Add/Restock Units"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </button>

                              {/* Edit Product */}
                              <button
                                type="button"
                                onClick={() => handleEdit(p)}
                                className="p-1.5 text-stone-600 hover:text-stone-900 rounded-md hover:bg-stone-100 transition-colors"
                                title="Edit Product Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Product */}
                              <button
                                type="button"
                                onClick={() => setDeleteProductTarget(p)}
                                className="p-1.5 text-stone-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                                title="Delete Product"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {filteredInStockProducts.length > 0 && (() => {
                  const totalStockUnits = filteredInStockProducts.reduce(
                    (sum, p) => sum + p.variants.reduce((vs, v) => vs + v.stockQuantity, 0),
                    0
                  );
                  const totalCost = filteredInStockProducts.reduce((sum, p) => {
                    const stock = p.variants.reduce((vs, v) => vs + v.stockQuantity, 0);
                    return sum + p.costPrice * stock;
                  }, 0);
                  const totalRetail = filteredInStockProducts.reduce((sum, p) => {
                    const stock = p.variants.reduce((vs, v) => vs + v.stockQuantity, 0);
                    return sum + p.sellingPrice * stock;
                  }, 0);
                  const totalPotentialProfit = totalRetail - totalCost;
                  const overallMarginPercent =
                    totalRetail > 0 ? Math.round((totalPotentialProfit / totalRetail) * 100) : 0;

                  return (
                    <tfoot className="bg-stone-50 border-t-2 border-stone-300 font-medium text-stone-800">
                      <tr>
                        <td colSpan={3} className="p-3.5 font-bold text-stone-900 text-xs uppercase tracking-wide">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span>Gross Inventory Totals ({filteredInStockProducts.length} Products)</span>
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Valuation:</div>
                          <div className="font-bold text-stone-900 text-xs font-mono">
                            {totalRetail.toLocaleString()} {currentBusiness.currency}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                            Cost: {totalCost.toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-[10px] text-stone-500 uppercase font-semibold">Total Stock:</div>
                          <span className="font-bold font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-stone-900 inline-block mt-0.5">
                            {totalStockUnits.toLocaleString()} units
                          </span>
                        </td>
                        <td className="p-3.5 whitespace-nowrap">
                          <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Profit:</div>
                          <div className="font-bold text-emerald-700 text-sm font-mono flex items-center gap-1.5 mt-0.5">
                            <span>+{totalPotentialProfit.toLocaleString()} {currentBusiness.currency}</span>
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                              +{overallMarginPercent}%
                            </span>
                          </div>
                        </td>
                        <td colSpan={3} className="p-3.5 text-right text-stone-400 text-[11px]">
                          Live potential gross profit on on-hand stock
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

      {/* ------------------------------------------------------------------- */}
      {/* TAB 2: SOLD ITEMS VIEW                                              */}
      {/* ------------------------------------------------------------------- */}
      {inventorySubTab === 'soldItems' && (
        <div className="space-y-4">
          {/* Sub-view 1: Depleted Products (Sold Out on hand) */}
          {soldViewMode === 'depletedStock' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-stone-900 flex items-center gap-2">
                    <PackageX className="w-4 h-4 text-[#993333]" />
                    <span>Sold Out Inventory Items (0 Units On Hand)</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Physical boutique items that have sold out and require restocking from tailors or suppliers.
                  </p>
                </div>
                <span className="text-xs font-mono font-bold text-[#993333] bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {depletedProducts.length} Items Sold Out
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="p-3.5">Product & SKU</th>
                      <th className="p-3.5">Category</th>
                      <th className="p-3.5">Retail Price</th>
                      <th className="p-3.5">Current Stock</th>
                      <th className="p-3.5">Variants Depleted</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {depletedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-10 text-center text-stone-400">
                          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                          <div className="font-semibold text-stone-800">No depleted inventory items!</div>
                          <p className="text-xs text-stone-500 mt-1">
                            All your physical boutique products currently have units in stock.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      depletedProducts.map((p) => {
                        const categoryName = categories.find((c) => c.id === p.categoryId)?.name || 'General';

                        return (
                          <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                            <td className="p-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-11 h-13 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                                  {p.images[0]?.imageUrl ? (
                                    <img
                                      src={p.images[0].imageUrl}
                                      alt={p.name}
                                      className="w-full h-full object-cover grayscale opacity-75"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                      No pic
                                    </div>
                                  )}
                                </div>
                                <div>
                                  <div className="font-semibold text-stone-900">{p.name}</div>
                                  <div className="text-[11px] text-stone-500 font-mono mt-0.5">{p.sku}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3.5 text-stone-600 font-medium">
                              <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700">
                                {categoryName}
                              </span>
                            </td>

                            <td className="p-3.5 font-bold text-stone-900">
                              {p.sellingPrice.toLocaleString()} {currentBusiness.currency}
                            </td>

                            <td className="p-3.5">
                              <span className="px-2.5 py-1 rounded bg-red-100 text-red-800 font-mono font-bold text-[11px] border border-red-200">
                                0 on hand
                              </span>
                            </td>

                            <td className="p-3.5">
                              <div className="flex flex-wrap gap-1 max-w-[220px]">
                                {p.variants.map((v) => (
                                  <span
                                    key={v.id}
                                    className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 text-stone-500 border border-stone-200 line-through"
                                  >
                                    {v.size} / {v.color}
                                  </span>
                                ))}
                              </div>
                            </td>

                            <td className="p-3.5 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleOpenRestock(p)}
                                  className="px-3 py-1.5 text-xs font-semibold bg-[#993333] hover:bg-[#802a2a] text-white rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Restock Units</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteProductTarget(p)}
                                  className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 border border-stone-200 rounded-lg transition-colors cursor-pointer"
                                  title="Delete sold out product from catalog"
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
                </table>
              </div>
            </div>
          )}

          {/* Sub-view 2: In-Store Walk-in Counter Sales (Off-the-shelf) */}
          {soldViewMode === 'inStoreSales' && (
            <div className="bg-white rounded-xl border border-stone-200 shadow-2xs overflow-hidden">
              <div className="p-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-xs text-stone-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-amber-600" />
                    <span>In-Store Walk-in Boutique Sales Log</span>
                  </div>
                  <p className="text-[11px] text-stone-500 mt-0.5">
                    Merchandise sold directly off physical shelves at the boutique counter.
                  </p>
                </div>
                <span className="text-[11px] text-stone-500">
                  {filteredInStoreSales.length} transaction(s)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50/70 text-stone-600 border-b border-stone-200 uppercase tracking-wider text-[11px] font-semibold">
                    <tr>
                      <th className="p-3.5">Sold Item & SKU</th>
                      <th className="p-3.5">Date Sold</th>
                      <th className="p-3.5">Variant Sold</th>
                      <th className="p-3.5">Qty</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Profit (Net)</th>
                      <th className="p-3.5">Client / Order Ref</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {filteredInStoreSales.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-10 text-center text-stone-400">
                          <Store className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                          <div>No in-store walk-in sales recorded matching criteria.</div>
                        </td>
                      </tr>
                    ) : (
                      filteredInStoreSales.map((r) => (
                        <tr key={r.id} className="hover:bg-stone-50/70 transition-colors">
                          <td className="p-3.5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-12 rounded overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                                {r.imageUrl ? (
                                  <img
                                    src={r.imageUrl}
                                    alt={r.productName}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                                    No pic
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-stone-900">{r.productName}</div>
                                <div className="text-[11px] text-stone-500 font-mono">{r.sku}</div>
                              </div>
                            </div>
                          </td>

                          <td className="p-3.5 whitespace-nowrap text-stone-600">
                            {formatDisplayDate(r.date)}
                          </td>

                          <td className="p-3.5 text-stone-700">
                            {r.variantSummary}
                          </td>

                          <td className="p-3.5 font-bold font-mono text-stone-900">
                            {r.quantity}
                          </td>

                          <td className="p-3.5 whitespace-nowrap font-bold text-stone-900">
                            {r.totalPrice.toLocaleString()} {currentBusiness.currency}
                          </td>

                          <td className="p-3.5 whitespace-nowrap">
                            <div className="font-bold text-emerald-700 font-mono text-xs">
                              +{r.profit.toLocaleString()} {currentBusiness.currency}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono">
                              Cost: {(r.costPrice * r.quantity).toLocaleString()}
                            </div>
                          </td>

                          <td className="p-3.5 text-stone-600">
                            <div className="font-medium text-stone-900">{r.customerName}</div>
                            <div className="text-[10px] text-stone-400 font-mono">{r.orderNumber}</div>
                          </td>

                          <td className="p-3.5 text-right whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => {
                                setRestoreStockOnDelete(true);
                                setDeleteSoldItemTarget(r);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors shadow-2xs cursor-pointer group"
                              title="Delete sold item record"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700" />
                              <span>Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {filteredInStoreSales.length > 0 && (() => {
                    const totalGrossSales = filteredInStoreSales.reduce((s, r) => s + r.totalPrice, 0);
                    const totalGrossCost = filteredInStoreSales.reduce((s, r) => s + (r.costPrice * r.quantity), 0);
                    const totalGrossProfit = filteredInStoreSales.reduce((s, r) => s + r.profit, 0);
                    const totalUnitsSold = filteredInStoreSales.reduce((s, r) => s + r.quantity, 0);
                    const overallMargin = totalGrossSales > 0 ? Math.round((totalGrossProfit / totalGrossSales) * 100) : 0;

                    return (
                      <tfoot className="bg-stone-50 border-t-2 border-stone-300 font-medium text-stone-800">
                        <tr>
                          <td colSpan={3} className="p-3.5 font-bold text-stone-900 text-xs uppercase tracking-wide">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-emerald-600" />
                              <span>Gross Walk-in Sales Totals ({filteredInStoreSales.length} Transactions)</span>
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-[10px] text-stone-500 uppercase font-semibold">Total Sold:</div>
                            <span className="font-bold font-mono text-xs px-2 py-0.5 rounded bg-stone-200 text-stone-900 inline-block mt-0.5">
                              {totalUnitsSold.toLocaleString()} units
                            </span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Sales:</div>
                            <div className="font-bold text-stone-900 text-xs font-mono">
                              {totalGrossSales.toLocaleString()} {currentBusiness.currency}
                            </div>
                            <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                              Cost: {totalGrossCost.toLocaleString()}
                            </div>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <div className="text-[10px] text-stone-500 uppercase font-semibold">Gross Profit:</div>
                            <div className="font-bold text-emerald-700 text-sm font-mono flex items-center gap-1.5 mt-0.5">
                              <span>+{totalGrossProfit.toLocaleString()} {currentBusiness.currency}</span>
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-900 border border-emerald-300">
                                +{overallMargin}%
                              </span>
                            </div>
                          </td>
                          <td colSpan={2} className="p-3.5 text-right text-stone-400 text-[11px]">
                            Realized profit from in-store shelf sales
                          </td>
                        </tr>
                      </tfoot>
                    );
                  })()}
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* MARK IN-STORE SOLD MODAL                                            */}
      {/* ------------------------------------------------------------------- */}
      {markSoldProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Mark Sold (In-Store Boutique Client)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMarkSoldProduct(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmMarkSold} className="space-y-4 mt-4 text-xs">
              <div className="flex items-center gap-3 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                <div className="w-12 h-14 rounded-lg overflow-hidden border border-stone-200 bg-white shrink-0">
                  <img
                    src={markSoldProduct.images[0]?.imageUrl}
                    alt={markSoldProduct.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <div className="font-bold text-stone-900">{markSoldProduct.name}</div>
                  <div className="text-[11px] text-stone-500 font-mono">{markSoldProduct.sku}</div>
                  <div className="text-[11px] font-semibold text-emerald-800 mt-0.5">
                    {markSoldProduct.sellingPrice.toLocaleString()} {currentBusiness.currency}
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Select Size & Color Variant:
                </label>
                <select
                  value={selectedVariantId}
                  onChange={(e) => setSelectedVariantId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 font-medium"
                >
                  {markSoldProduct.variants.map((v) => (
                    <option key={v.id} value={v.id} disabled={v.stockQuantity === 0}>
                      {v.size} / {v.color} ({v.stockQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Quantity Sold:</label>
                  <input
                    type="number"
                    min={1}
                    max={selectedSoldVariant?.stockQuantity || 1}
                    value={soldQuantity}
                    onChange={(e) => setSoldQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full p-2 rounded-lg border border-stone-300 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Available Stock:</label>
                  <div className="p-2 bg-stone-100 rounded-lg font-mono font-bold text-stone-700">
                    {selectedSoldVariant?.stockQuantity || 0} units
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Walk-in Client Name:</label>
                <input
                  type="text"
                  value={walkInCustomerName}
                  onChange={(e) => setWalkInCustomerName(e.target.value)}
                  className="w-full p-2 rounded-lg border border-stone-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setMarkSoldProduct(null)}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs"
                >
                  Confirm Boutique Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* QUICK RESTOCK MODAL                                                 */}
      {/* ------------------------------------------------------------------- */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Restock Inventory Stock
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmRestock} className="space-y-4 mt-4 text-xs">
              <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                <div className="font-bold text-stone-900">{restockProduct.name}</div>
                <div className="text-[11px] text-stone-500 font-mono">{restockProduct.sku}</div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Select Variant to Restock:
                </label>
                <select
                  value={restockVariantId}
                  onChange={(e) => setRestockVariantId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-stone-900 font-medium"
                >
                  {restockProduct.variants.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.size} / {v.color} (Currently: {v.stockQuantity} in stock)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Units to Add:</label>
                <div className="flex items-center gap-2 mb-2">
                  {[2, 5, 10, 20].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setRestockUnitsToAdd(num)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${
                        restockUnitsToAdd === num
                          ? 'bg-stone-900 text-white border-stone-900'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      +{num}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={restockUnitsToAdd}
                  onChange={(e) => setRestockUnitsToAdd(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full p-2.5 rounded-lg border border-stone-300 font-mono font-bold text-sm"
                />
              </div>

              <div className="bg-blue-50 p-2.5 rounded-lg text-blue-900 text-[11px]">
                New stock total will become{' '}
                <strong>
                  {(selectedRestockVariant?.stockQuantity || 0) + Number(restockUnitsToAdd)}
                </strong>{' '}
                units.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setRestockProduct(null)}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#993333] hover:bg-[#802a2a] text-white font-semibold shadow-xs"
                >
                  Confirm Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* IMPORT PRODUCTS MODAL                                               */}
      {/* ------------------------------------------------------------------- */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-stone-700" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Import Products into Inventory
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-stone-400 hover:text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 mt-4 text-xs">
              <p className="text-stone-600">
                Upload a JSON product array file or paste JSON data below to import inventory items.
              </p>

              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 border-2 border-dashed border-stone-300 rounded-xl text-center hover:bg-stone-50 flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Upload className="w-6 h-6 text-stone-400" />
                  <span className="font-semibold text-stone-700">Choose JSON file</span>
                  <span className="text-[10px] text-stone-400">Click to browse file</span>
                </button>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Or paste JSON array content:
                </label>
                <textarea
                  rows={6}
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  placeholder='[{"name": "Pleated Dress", "sku": "MF-01", "sellingPrice": 3200, "stockQuantity": 5}]'
                  className="w-full p-2.5 rounded-lg border border-stone-300 font-mono text-[11px]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportJson}
                  disabled={!importJsonText.trim()}
                  className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold shadow-xs"
                >
                  Import Products
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* PRODUCT EDITOR MODAL                                                */}
      {/* ------------------------------------------------------------------- */}
      {isEditorOpen && (
        <ProductEditorModal
          product={editingProduct}
          onClose={() => {
            setIsEditorOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* ------------------------------------------------------------------- */}
      {/* CONFIRMATION POPUP: DELETE SOLD ITEM RECORD                         */}
      {/* ------------------------------------------------------------------- */}
      {deleteSoldItemTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Delete Sold Item Record
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    Confirm deletion of this sold merchandise transaction.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteSoldItemTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sold Item Details Preview */}
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3.5">
              <div className="w-14 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                {deleteSoldItemTarget.imageUrl ? (
                  <img
                    src={deleteSoldItemTarget.imageUrl}
                    alt={deleteSoldItemTarget.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                    No pic
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-stone-900 text-xs truncate">
                  {deleteSoldItemTarget.productName}
                </div>
                <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                  SKU: {deleteSoldItemTarget.sku}
                </div>
                <div className="text-[11px] text-stone-700 mt-0.5">
                  Variant: <span className="font-medium">{deleteSoldItemTarget.variantSummary || 'Standard'}</span>
                </div>
                <div className="text-xs font-bold text-stone-900 mt-1 flex items-center justify-between">
                  <span>{deleteSoldItemTarget.quantity} unit(s)</span>
                  <span className="text-[#993333]">
                    {deleteSoldItemTarget.totalPrice.toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Order Reference & Date */}
            <div className="text-xs bg-stone-50/80 p-3 rounded-xl border border-stone-100 space-y-1">
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Client:</span>
                <span className="font-medium text-stone-800">{deleteSoldItemTarget.customerName}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Order Ref:</span>
                <span className="font-mono text-stone-800">{deleteSoldItemTarget.orderNumber}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span className="text-stone-500">Date Sold:</span>
                <span className="text-stone-800">{formatDisplayDate(deleteSoldItemTarget.date)}</span>
              </div>
            </div>

            {/* Stock Restoration Option */}
            <label className="flex items-start gap-3 p-3 rounded-xl border border-amber-200 bg-amber-50/60 cursor-pointer hover:bg-amber-50 transition-colors">
              <input
                type="checkbox"
                checked={restoreStockOnDelete}
                onChange={(e) => setRestoreStockOnDelete(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
              />
              <div className="text-xs">
                <span className="font-semibold text-stone-900 block">
                  Restore {deleteSoldItemTarget.quantity} unit(s) back to inventory
                </span>
                <span className="text-stone-600 text-[11px] leading-relaxed block mt-0.5">
                  Adds the sold units back into on-hand stock for this variant.
                </span>
              </div>
            </label>

            {/* Actions */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteSoldItemTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteSoldItem}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------- */}
      {/* CONFIRMATION POPUP: DELETE PRODUCT FROM CATALOG                     */}
      {/* ------------------------------------------------------------------- */}
      {deleteProductTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-base">
                    Delete Product?
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    This action will permanently remove the item.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3.5">
              <div className="w-14 h-16 rounded-lg overflow-hidden border border-stone-200 bg-stone-100 shrink-0">
                {deleteProductTarget.images[0]?.imageUrl ? (
                  <img
                    src={deleteProductTarget.images[0].imageUrl}
                    alt={deleteProductTarget.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[10px] text-stone-400">
                    No pic
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-stone-900 text-xs truncate">
                  {deleteProductTarget.name}
                </div>
                <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                  SKU: {deleteProductTarget.sku}
                </div>
                <div className="text-xs font-semibold text-stone-800 mt-1">
                  {deleteProductTarget.sellingPrice.toLocaleString()} {currentBusiness.currency}
                </div>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to permanently remove <strong>{deleteProductTarget.name}</strong> from your boutique inventory? All associated variant configurations and stock counts will be erased.
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteProductTarget(null)}
                className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
