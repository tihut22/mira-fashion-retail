import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product, ProductVariant } from '../../types';
import {
  Package,
  Plus,
  Search,
  CheckCircle2,
  Trash2,
  Camera,
  Upload,
  Sparkles,
  AlertTriangle,
  Tag,
  DollarSign,
  Layers,
  ChevronRight,
  Eye,
  EyeOff,
  X,
} from 'lucide-react';
import { triggerTelegramHaptic } from '../../utils/telegramSdk';
import { CategoryManagerModal } from '../common/CategoryManagerModal';
import { compressImage } from '../../utils/imageCompression';

// Preset fashion images for fast mobile inventory creation
const FASHION_PRESETS = [
  {
    name: 'Silk Slip Dress',
    url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Linen Co-ord Set',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Blazer & Trousers',
    url: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Cropped Knit Top',
    url: 'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=80',
  },
  {
    name: 'Leather Handbag',
    url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80',
  },
];

export const TelegramInventory: React.FC = () => {
  const {
    currentBusiness,
    products,
    categories,
    addProduct,
    updateVariantStock,
    deleteProduct,
    addCategory,
  } = useRetail();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Add Product Modal State
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [sku, setSku] = useState('');
  const [buyingCost, setBuyingCost] = useState<number | null>(null);
  const [shippingPrice, setShippingPrice] = useState<number | null>(null);
  const [taxRate, setTaxRate] = useState<number | null>(null);
  const [sellingPrice, setSellingPrice] = useState<number | null>(null);
  const [discountPrice, setDiscountPrice] = useState<number | null>(null);
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Calculated Cost Price
  const costPrice = (buyingCost || 0) + (shippingPrice || 0) + (taxRate || 0);

  // Variant Config
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [initialStockPerVariant, setInitialStockPerVariant] = useState<number | null>(null);

  // Quick category creation inside modal
  const [isNewCategoryOpen, setIsNewCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Success Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Auto-generate SKU
  const handleGenerateSku = () => {
    triggerTelegramHaptic('light');
    const cat = categories.find((c) => c.id === categoryId);
    
    // Default prefix if no category or category name too short
    let prefix = 'MR'; 
    if (cat) {
      // Simple heuristic: Take first 3 letters of category name
      prefix = cat.name.slice(0, 3).toUpperCase();
    }

    // Count existing products in this category to get next sequence number
    const count = products.filter((p) => p.categoryId === categoryId).length;
    const nextNumber = (count + 1).toString().padStart(3, '0');
    
    setSku(`${prefix}-${nextNumber}`);
  };

  // Image Upload handler with compression
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingImage(true);
      try {
        const compressed = await compressImage(file, 1024, 1024, 0.75);
        setImagePreview(compressed);
        setImageUrl(compressed);
        triggerTelegramHaptic('medium');
      } catch (err) {
        console.error('Image compression error:', err);
        showToast('✗ Failed to process image.');
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  // Submit New Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmittingProduct(true);
    triggerTelegramHaptic('success');
    const cleanSku = sku.trim() || `MR-${Math.floor(10000 + Math.random() * 90000)}`;
    const effectiveCategory = categoryId || categories[0]?.id || 'cat-general';

    // Generate variants based on selected sizes
    const variants: ProductVariant[] = selectedSizes.map((size, idx) => ({
      id: `var-${Date.now()}-${idx}`,
      productId: '',
      sku: `${cleanSku}-${size.toUpperCase()}-${selectedColor.slice(0, 3).toUpperCase()}`,
      size,
      color: selectedColor,
      stockQuantity: initialStockPerVariant || 0,
    }));

    try {
    const productPayload: any = {
        name: name.trim(),
        categoryId: effectiveCategory,
        sku: cleanSku,
        costPrice: Number(costPrice || 0),
        sellingPrice: Number(sellingPrice || 0),
        shippingPrice: shippingPrice && shippingPrice > 0 ? shippingPrice : null,
        taxRate: taxRate && taxRate > 0 ? taxRate : null,
        discountPrice: discountPrice && discountPrice > 0 ? discountPrice : null,
        description: description.trim() || `Luxury ${name.trim()} from ${currentBusiness.name}.`,
        isActive: true,
        isPublished: true,
        isOnline: true,
        isOrderedItem: false,
        images: (imagePreview || imageUrl)?.trim()
          ? [
              {
                id: `img-${Date.now()}`,
                productId: '',
                imageUrl: (imagePreview || imageUrl)!.trim(),
                altText: name,
                isPrimary: true,
                sortOrder: 1,
              },
            ]
          : [],
        variants,
      };

      // Remove null/undefined fields
      Object.keys(productPayload).forEach(key => {
        if (productPayload[key] === null || productPayload[key] === undefined) {
          delete productPayload[key];
        }
      });

      await addProduct(productPayload);

      showToast(`✓ "${name}" added to inventory with ${variants.length * (initialStockPerVariant || 0)} items.`);
      setIsAddOpen(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create product:', err);
      showToast('✗ Error adding product. Please verify image size and try again.');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setBuyingCost(null);
    setSellingPrice(null);
    setShippingPrice(null);
    setTaxRate(null);
    setDiscountPrice(null);
    setDescription('');
    setImagePreview(null);
    setImageUrl('');
    setSelectedSizes([]);
    setSelectedColor('');
    setInitialStockPerVariant(null);
  };

  // Handle Quick Category Addition
  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const cat = addCategory(newCatName.trim());
    setCategoryId(cat.id);
    setNewCatName('');
    setIsNewCategoryOpen(false);
    triggerTelegramHaptic('medium');
  };

  // Quick Stock Step (+ / -)
  const handleStockDelta = (product: Product, variant: ProductVariant, delta: number) => {
    triggerTelegramHaptic('light');
    const newStock = Math.max(0, variant.stockQuantity + delta);
    updateVariantStock(product.id, variant.id, newStock);
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    triggerTelegramHaptic('medium');
    try {
      await deleteProduct(deleteTarget.id);
      showToast(`✓ "${deleteTarget.name}" deleted.`);
    } catch (e) {
      showToast(`✗ Failed to delete "${deleteTarget.name}".`);
    }
    setDeleteTarget(null);
  };

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.categoryId === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalStockCount = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0),
    0
  );

  return (
    <div className="space-y-4 pb-20">
      {/* Top Action Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
        <div>
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
            <Package className="w-4 h-4 text-[#24A1DE]" />
            <span>Store Inventory</span>
          </h3>
          <p className="text-[11px] text-stone-500">
            {products.length} products • <span className="font-bold text-stone-800">{totalStockCount} in stock</span>
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            triggerTelegramHaptic('medium');
            handleGenerateSku();
            setIsAddOpen(true);
          }}
          className="px-3.5 py-2 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Product</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsCategoryManagerOpen(true);
          }}
          className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs cursor-pointer transition-transform active:scale-95"
        >
          <span>Categories</span>
        </button>
      </div>
      
      {isCategoryManagerOpen && (
        <CategoryManagerModal onClose={() => setIsCategoryManagerOpen(false)} />
      )}

      {/* Search & Category Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search inventory by title or SKU..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedCategory === 'all'
                ? 'bg-stone-900 text-white'
                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
            }`}
          >
            All Categories ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCategory(c.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === c.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Inventory Cards */}
      <div className="space-y-2.5">
        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-2">
            <Package className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-700 text-xs">No Inventory Items Found</h4>
            <p className="text-[11px] text-stone-400">
              Tap "+ Add Product" above to create an inventory item directly from Telegram.
            </p>
          </div>
        ) : (
          filteredProducts.map((p) => {
            const totalStock = p.variants.reduce((s, v) => s + v.stockQuantity, 0);
            const isLowStock = totalStock > 0 && totalStock <= 3;
            const isOutOfStock = totalStock === 0;
            const unitProfit = p.sellingPrice - p.costPrice;
            const profitMargin = Math.round((unitProfit / p.sellingPrice) * 100);

            return (
              <div
                key={p.id}
                onClick={() => setSelectedProduct(p)}
                className="bg-white rounded-2xl p-3.5 border border-stone-200 shadow-2xs space-y-3 cursor-pointer"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    {p.images[0]?.imageUrl ? (
                      <img
                        src={p.images[0].imageUrl}
                        alt={p.name}
                        className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0 text-stone-400">
                        <Package className="w-5 h-5 text-stone-300" />
                        <span className="text-[9px] text-stone-400 font-medium">No photo</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-stone-900 text-sm truncate">{p.name}</h4>
                        {isOutOfStock && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">
                            Out of Stock
                          </span>
                        )}
                        {isLowStock && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                        SKU: {p.sku}
                      </p>
                      <div className="flex items-center gap-1.5 flex-wrap mt-1">
                        <span className="font-bold text-xs text-stone-900 font-mono">
                          {p.sellingPrice.toLocaleString()} {currentBusiness.currency}
                        </span>
                        {p.costPrice && (
                          <span className="text-[10px] text-stone-400 font-mono">
                            Cost: {p.costPrice.toLocaleString()}
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-mono">
                          Profit: +{unitProfit.toLocaleString()} ({profitMargin}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDeleteTarget(p)}
                    className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete product"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Variants & Quick Adjust Counters */}
                <div className="pt-2 border-t border-stone-100 space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                    Variant Stock Levels (Tap + / - to adjust in real-time)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {p.variants.map((v) => (
                      <div
                        key={v.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-stone-50 border border-stone-200 text-xs"
                      >
                        <div className="font-medium text-stone-700">
                          <span>{v.size}</span>
                          <span className="text-stone-400 mx-1">/</span>
                          <span className="text-stone-500">{v.color}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStockDelta(p, v, -1)}
                            className="w-6 h-6 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer active:scale-95"
                          >
                            -
                          </button>
                          <span
                            className={`w-8 text-center font-mono font-bold text-xs ${
                              v.stockQuantity === 0 ? 'text-rose-600' : 'text-stone-900'
                            }`}
                          >
                            {v.stockQuantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleStockDelta(p, v, 1)}
                            className="w-6 h-6 rounded-lg bg-white border border-stone-300 text-stone-700 font-bold flex items-center justify-center hover:bg-stone-100 cursor-pointer active:scale-95"
                          >
                            +
                          </button>
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

      {/* Gross Inventory Totals Card */}
      {filteredProducts.length > 0 && (() => {
        const grossStockUnits = filteredProducts.reduce(
          (s, p) => s + p.variants.reduce((vs, v) => vs + v.stockQuantity, 0),
          0
        );
        const grossInventoryValuation = filteredProducts.reduce(
          (s, p) => s + p.variants.reduce((vs, v) => vs + (v.stockQuantity * p.sellingPrice), 0),
          0
        );
        const grossCostValuation = filteredProducts.reduce(
          (s, p) => s + p.variants.reduce((vs, v) => vs + (v.stockQuantity * p.costPrice), 0),
          0
        );
        const grossPotentialProfit = grossInventoryValuation - grossCostValuation;
        const grossMargin =
          grossInventoryValuation > 0 ? Math.round((grossPotentialProfit / grossInventoryValuation) * 100) : 0;

        return (
          <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-200">Gross Inventory Performance</span>
              <span className="font-mono text-stone-400">{grossStockUnits.toLocaleString()} units in stock</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Gross Valuation</span>
                <span className="font-bold font-mono text-white text-sm">
                  {grossInventoryValuation.toLocaleString()} {currentBusiness.currency}
                </span>
                <span className="text-[10px] text-stone-400 block font-mono mt-0.5">
                  Cost: {grossCostValuation.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Gross Potential Profit</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  +{grossPotentialProfit.toLocaleString()} {currentBusiness.currency}
                </span>
                <span className="text-[10px] text-emerald-300/80 block font-mono mt-0.5">
                  +{grossMargin}% Potential Margin
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ---------------------------------------------------------------- */}
      {/* ADD PRODUCT MODAL / DRAWER                                       */}
      {/* ---------------------------------------------------------------- */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-stone-200">
            {/* Modal Header */}
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">Add New Product</h3>
                  <p className="text-[11px] text-stone-500">Create item & stock inventory from Telegram</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 text-xs font-bold"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateProduct} className="p-4 overflow-y-auto space-y-3.5 text-xs">
              {/* Product Title */}
              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Italian Silk Halter Jumpsuit"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
                />
              </div>

              {/* Category & SKU */}
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-700 font-semibold">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryOpen(true)}
                      className="text-[10px] text-[#24A1DE] font-bold hover:underline"
                    >
                      + New
                    </button>
                  </div>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-stone-700 font-semibold">SKU *</label>
                    <button
                      type="button"
                      onClick={handleGenerateSku}
                      className="text-[10px] text-amber-600 font-bold hover:underline"
                    >
                      Auto-Gen
                    </button>
                  </div>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    placeholder="e.g. SLK-8821"
                    className="w-full p-2 rounded-xl border border-stone-300 font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Inline Quick Category Modal */}
              {isNewCategoryOpen && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <span className="font-bold text-amber-900 text-xs block">
                    Create New Category
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      placeholder="e.g. Summer Sets, Abayas..."
                      className="flex-1 p-2 rounded-lg border border-amber-300 bg-white text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCategorySubmit}
                      className="px-3 py-1.5 bg-amber-700 text-white rounded-lg font-bold text-xs"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewCategoryOpen(false)}
                      className="px-2 py-1.5 text-stone-500 text-xs"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Prices: Cost & Selling */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Buying Cost (ETB)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={buyingCost || ''}
                    onChange={(e) => setBuyingCost(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Shipping Price
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={shippingPrice || ''}
                    onChange={(e) => setShippingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
              </div>

              {/* Tax & Selling Price */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Tax (Birr)
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    value={taxRate || ''}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-stone-700 font-semibold mb-1">
                    Selling Price (ETB) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={sellingPrice || ''}
                    onChange={(e) => setSellingPrice(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono font-bold text-stone-900"
                  />
                </div>
              </div>

              {/* Margin estimation helper */}
              <div className="p-2 bg-stone-50 rounded-xl text-[11px] flex justify-between text-stone-600 font-medium">
                <span>Estimated Gross Margin:</span>
                <span className="text-emerald-700 font-bold font-mono">
                  {((sellingPrice || 0) - (costPrice || 0)).toLocaleString()} {currentBusiness.currency} (
                  {sellingPrice && sellingPrice > 0 
                    ? Math.round((((sellingPrice || 0) - (costPrice || 0)) / sellingPrice) * 100) 
                    : 0}%)
                </span>
              </div>

              {/* Image Selection / Upload */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-stone-700 font-semibold">
                    Product Photo <span className="text-stone-400 font-normal text-xs">(Optional)</span>
                  </label>
                  {(imagePreview || imageUrl) && (
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null);
                        setImageUrl('');
                        triggerTelegramHaptic('light');
                      }}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Remove Photo</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center">
                    {imagePreview || imageUrl ? (
                      <img
                        src={imagePreview || imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-stone-400 p-1 text-center">
                        <Camera className="w-5 h-5 text-stone-300" />
                        <span className="text-[8px] text-stone-400 mt-0.5">No photo</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-xl cursor-pointer text-xs transition-colors border border-stone-300">
                      <Camera className="w-3.5 h-3.5 text-stone-600" />
                      <span>{isCompressingImage ? 'Optimizing photo...' : 'Take Photo / Upload'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isCompressingImage}
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <input
                      type="text"
                      value={imagePreview ? '' : imageUrl}
                      onChange={(e) => {
                        setImagePreview(null);
                        setImageUrl(e.target.value);
                      }}
                      placeholder={imagePreview ? 'Using uploaded file' : 'Or paste image URL...'}
                      disabled={!!imagePreview}
                      className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-stone-300 bg-stone-50/50 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Presets Gallery */}
                <div>
                  <span className="text-[10px] text-stone-400 block mb-1">
                    Or select an optional fashion preset style:
                  </span>
                  <div className="flex gap-1.5 overflow-x-auto pt-0.5">
                    {FASHION_PRESETS.map((p, idx) => {
                      const isSelected = imageUrl === p.url && !imagePreview;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setImageUrl('');
                            } else {
                              setImagePreview(null);
                              setImageUrl(p.url);
                            }
                            triggerTelegramHaptic('light');
                          }}
                          className={`relative w-11 h-11 rounded-lg overflow-hidden shrink-0 border-2 transition-all cursor-pointer ${
                            isSelected
                              ? 'border-[#24A1DE] scale-105 shadow-xs'
                              : 'border-transparent opacity-60 hover:opacity-100'
                          }`}
                          title={p.name}
                        >
                          <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Sizes & Colors Configuration */}
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200 space-y-2.5">
                <span className="font-bold text-stone-800 text-xs block">
                  Stock Variants Configuration
                </span>

                <div>
                  <label className="block text-[11px] text-stone-500 mb-1">
                    Select Available Sizes:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['XS', 'S', 'M', 'L', 'XL', 'Free Size'].map((sz) => {
                      const isSelected = selectedSizes.includes(sz);
                      return (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => {
                            triggerTelegramHaptic('light');
                            setSelectedSizes((prev) =>
                              isSelected
                                ? prev.filter((s) => s !== sz)
                                : [...prev, sz]
                            );
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-[#24A1DE] text-white shadow-xs'
                              : 'bg-white text-stone-700 border border-stone-300'
                          }`}
                        >
                          {sz}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Primary Color
                    </label>
                    <input
                      type="text"
                      value={selectedColor}
                      onChange={(e) => setSelectedColor(e.target.value)}
                      placeholder="e.g. Emerald, Beige"
                      className="w-full p-2 rounded-xl border border-stone-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-stone-500 mb-1">
                      Initial Stock per Size
                    </label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      value={initialStockPerVariant || ''}
                      onChange={(e) =>
                        setInitialStockPerVariant(Math.max(0, parseInt(e.target.value) || 0))
                      }
                      className="w-full p-2 rounded-xl border border-stone-300 bg-white font-mono"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-stone-500">
                  Total initial stock: <strong>{selectedSizes.length * (initialStockPerVariant || 0)} items</strong>
                </p>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmittingProduct || isCompressingImage}
                  className="w-full py-3 bg-[#24A1DE] hover:bg-[#1f8fc6] disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-md cursor-pointer transition-transform active:scale-98 flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>
                    {isSubmittingProduct
                      ? 'Saving Product...'
                      : isCompressingImage
                      ? 'Optimizing Image...'
                      : 'Create Product & Stock Inventory'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* DELETE PRODUCT CONFIRMATION MODAL                                */}
      {/* ---------------------------------------------------------------- */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-2xl space-y-3 text-xs">
            <div className="flex items-center gap-2.5 text-rose-700">
              <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Delete Product?</h4>
                <p className="text-stone-500 text-[11px]">{deleteTarget.name}</p>
              </div>
            </div>

            <p className="text-stone-600">
              Are you sure you want to remove this item from your boutique inventory?
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* PRODUCT DETAIL MODAL                                             */}
      {/* ---------------------------------------------------------------- */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 border border-stone-200 shadow-2xl space-y-4 text-xs">
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-stone-900 text-sm">Product Details</h3>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {selectedProduct.images[0]?.imageUrl && (
              <img
                src={selectedProduct.images[0].imageUrl}
                alt={selectedProduct.name}
                className="w-full h-40 rounded-xl object-cover bg-stone-100"
              />
            )}
            <h4 className="font-bold text-lg text-stone-900">{selectedProduct.name}</h4>
            <p className="text-stone-600">{selectedProduct.description}</p>
            <div className="grid grid-cols-2 gap-2 text-stone-700">
              <p>
                SKU: <span className="font-mono font-semibold">{selectedProduct.sku}</span>
              </p>
              <p>
                Price:{" "}
                <span className="font-bold">
                  {selectedProduct.sellingPrice} {currentBusiness.currency}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedProduct(null)}
              className="w-full py-2.5 bg-stone-900 text-white rounded-xl font-bold cursor-pointer transition-transform active:scale-98"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* TOAST FEEDBACK                                                   */}
      {/* ---------------------------------------------------------------- */}
      {toastMsg && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
};
