import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product, ProductImage, ProductVariant } from '../../types';
import { X, Plus, Trash2, Check, Star, Image as ImageIcon } from 'lucide-react';
import { compressImage } from '../../utils/imageCompression';

interface ProductEditorModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductEditorModal: React.FC<ProductEditorModalProps> = ({ product, onClose }) => {
  const { currentBusiness, products, categories, addCategory, addProduct, updateProduct } = useRetail();

  const isEditing = !!product;

  // Auto-generate SKU
  const handleGenerateSku = () => {
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

  // Form states
  const [name, setName] = useState(product?.name || '');
  const [sku, setSku] = useState(product?.sku || `MF-${Math.floor(100 + Math.random() * 900)}`);
  const [categoryId, setCategoryId] = useState(product?.categoryId || categories[0]?.id || '');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [description, setDescription] = useState(product?.description || '');
  const [buyingCost, setBuyingCost] = useState<number | null>(product?.costPrice || null);
  const [sellingPrice, setSellingPrice] = useState<number | null>(product?.sellingPrice || null);
  const [discountPrice, setDiscountPrice] = useState<number | null>(product?.discountPrice || null);
  const [shippingPrice, setShippingPrice] = useState<number | null>(product?.shippingPrice || null);
  const [taxRate, setTaxRate] = useState<number | null>(product?.taxRate || null);

  // Derived Cost Price
  const costPrice = (buyingCost || 0) + (shippingPrice || 0) + (taxRate || 0);

  // Visibility Flags
  const [isActive, setIsActive] = useState(product ? product.isActive : true);
  const [isPublished, setIsPublished] = useState(product ? product.isPublished : true);
  const [isOnline, setIsOnline] = useState(product ? product.isOnline : true);
  const [onlineStockQuantity, setOnlineStockQuantity] = useState(product?.onlineStockQuantity || 10);

  // Images
  const [images, setImages] = useState<ProductImage[]>(product?.images || []);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isCompressingImage, setIsCompressingImage] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressingImage(true);
      try {
        const compressed = await compressImage(file, 1024, 1024, 0.75);
        setNewImageUrl(compressed);
      } catch (err) {
        console.error('Failed to compress image:', err);
      } finally {
        setIsCompressingImage(false);
      }
    }
  };

  // Variants (Size + Color matrix with stock quantity)
  const [variants, setVariants] = useState<ProductVariant[]>(product?.variants || []);

  // New variant inputs
  const [newVarSize, setNewVarSize] = useState('M');
  const [newVarColor, setNewVarColor] = useState('Red');
  const [newVarStock, setNewVarStock] = useState(5);

  const handleAddImage = () => {
    if (!newImageUrl.trim()) return;
    const newImg: ProductImage = {
      id: `img-${Date.now()}`,
      productId: product?.id || '',
      imageUrl: newImageUrl.trim(),
      altText: `${name} view`,
      isPrimary: images.length === 0,
      sortOrder: images.length + 1,
    };
    setImages([...images, newImg]);
    setNewImageUrl('');
  };

  const handleSetPrimaryImage = (imgId: string) => {
    setImages(
      images.map((img) => ({
        ...img,
        isPrimary: img.id === imgId,
      }))
    );
  };

  const handleDeleteImage = (imgId: string) => {
    setImages(images.filter((img) => img.id !== imgId));
  };

  const handleAddVariant = () => {
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      productId: product?.id || '',
      sku: `${sku}-${newVarSize}-${newVarColor.slice(0, 2).toUpperCase()}`,
      size: newVarSize,
      color: newVarColor,
      stockQuantity: Number(newVarStock),
    };
    setVariants([...variants, newVariant]);
  };

  const handleUpdateVariantStock = (varId: string, qty: number) => {
    setVariants(
      variants.map((v) => (v.id === varId ? { ...v, stockQuantity: Math.max(0, qty) } : v))
    );
  };

  const handleDeleteVariant = (varId: string) => {
    setVariants(variants.filter((v) => v.id !== varId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // If no variants added explicitly, auto-create a default variant with form's variant input values
    let finalVariants = [...variants];
    if (finalVariants.length === 0) {
      finalVariants = [
        {
          id: `var-${Date.now()}`,
          productId: product?.id || '',
          sku: `${sku}-${(newVarSize || 'M').toUpperCase()}-${(newVarColor || 'RED').slice(0, 2).toUpperCase()}`,
          size: newVarSize || 'Standard',
          color: newVarColor || 'Default',
          stockQuantity: Number(newVarStock) >= 0 ? Number(newVarStock) : 5,
        },
      ];
    }

    const effectiveCategoryId = categoryId || categories[0]?.id || 'cat-general';

    const productPayload: any = {
      categoryId: effectiveCategoryId,
      sku,
      name,
      description,
      costPrice: Number(costPrice || 0),
      sellingPrice: Number(sellingPrice || 0),
      discountPrice: discountPrice && discountPrice > 0 ? Number(discountPrice) : null,
      shippingPrice: shippingPrice && shippingPrice > 0 ? Number(shippingPrice) : null,
      taxRate: taxRate && taxRate > 0 ? Number(taxRate) : null,
      isActive,
      isPublished,
      isOnline,
      onlineStockQuantity: Number(onlineStockQuantity || 10),
      images,
      variants: finalVariants,
    };
    
    // Remove null/undefined fields
    Object.keys(productPayload).forEach(key => {
      if (productPayload[key] === null || productPayload[key] === undefined) {
        delete productPayload[key];
      }
    });

    try {
      if (isEditing && product) {
        await updateProduct({
          ...product,
          ...productPayload,
        });
      } else {
        await addProduct(productPayload);
      }
      onClose();
    } catch (err) {
      console.error('Error saving product:', err);
      setSubmitError('Failed to save product. Please check form inputs and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border border-stone-200 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-900 text-white">
          <div>
            <h3 className="font-serif font-bold text-lg">
              {isEditing ? `Edit Product: ${product.name}` : 'Add New Inventory Product'}
            </h3>
            <p className="text-xs text-stone-400">
              Configure inventory SKU, pricing, visibility, and variant matrix
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6 text-xs">
          {/* General Information */}
          <div className="space-y-3">
            <h4 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
              1. General Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-stone-700 font-medium mb-1">Product Title *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Modern Silk Habesha Kemis"
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
              </div>

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-stone-700 font-medium">Category *</label>
                  <button
                    type="button"
                    onClick={() => setShowNewCategoryInput(!showNewCategoryInput)}
                    className="text-[11px] text-amber-700 hover:text-amber-900 font-medium underline"
                  >
                    {showNewCategoryInput ? 'Choose existing' : '+ Add new'}
                  </button>
                </div>

                {showNewCategoryInput ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="e.g. Bra, Top, Kimono..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      className="flex-1 p-2 rounded-md border border-stone-300 text-xs focus:outline-none focus:ring-1 focus:ring-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newCategoryName.trim()) return;
                        const created = addCategory(newCategoryName.trim());
                        setCategoryId(created.id);
                        setNewCategoryName('');
                        setShowNewCategoryInput(false);
                      }}
                      className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-md text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full p-2.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}

                {/* Quick Chips for Categories including Bra and Top */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  <span className="text-[10px] text-stone-400 font-medium">Quick select:</span>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setCategoryId(c.id)}
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-all ${
                        categoryId === c.id
                          ? 'bg-stone-900 text-white font-semibold'
                          : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Buying Cost ({currentBusiness.currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={buyingCost || ''}
                  onChange={(e) => setBuyingCost(parseFloat(e.target.value) || null)}
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Shipping
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={shippingPrice || ''}
                  onChange={(e) => setShippingPrice(parseFloat(e.target.value) || null)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Tax (Birr)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={taxRate || ''}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || null)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Discount
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={discountPrice || ''}
                  onChange={(e) => setDiscountPrice(parseFloat(e.target.value) || null)}
                  placeholder="0"
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-stone-700 font-medium mb-1">
                  Selling Price ({currentBusiness.currency}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={sellingPrice || ''}
                  onChange={(e) => setSellingPrice(parseFloat(e.target.value) || null)}
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Description</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description and craftsmanship notes..."
                className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          {/* Product Visibility Controls (Requirement: is_active, is_published, is_online) */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <h4 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
              2. Storefront Publishing & Visibility Controls
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="mt-0.5 rounded text-stone-900 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-stone-900 block">Active in Inventory</span>
                  <span className="text-[11px] text-stone-500">
                    Product exists in system and tracks stock counts
                  </span>
                </div>
              </label>

              <label className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="mt-0.5 rounded text-stone-900 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-stone-900 block">Published to Store</span>
                  <span className="text-[11px] text-stone-500">
                    Visible to customers browsing the storefront catalog
                  </span>
                </div>
              </label>

              <label className="p-3 rounded-lg border border-stone-200 bg-stone-50 flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isOnline}
                  onChange={(e) => setIsOnline(e.target.checked)}
                  className="mt-0.5 rounded text-stone-900 focus:ring-0"
                />
                <div>
                  <span className="font-semibold text-stone-900 block">Available Online</span>
                  <span className="text-[11px] text-stone-500">
                    Allows Add-to-Cart and Telegram direct ordering
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Multiple Product Images */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <h4 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
              3. Product Images (Multiple Images Support)
            </h4>
            <div className="flex gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="flex-1 p-2 rounded-md border border-stone-300 text-xs"
              />
              <span className="text-stone-400 self-center">or</span>
              <input
                type="url"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL..."
                className="flex-1 p-2 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
              <button
                type="button"
                onClick={handleAddImage}
                className="px-4 py-2 bg-stone-800 text-white rounded-md font-medium hover:bg-stone-700 cursor-pointer"
              >
                Add Image
              </button>
            </div>

            {/* Quick Sample Image Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-stone-500">
              <span className="font-semibold text-stone-700">Quick Samples:</span>
              {[
                { label: '👗 Silk Dress', url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&auto=format&fit=crop&q=80' },
                { label: '👜 Leather Bag', url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop&q=80' },
                { label: '👠 Stiletto Heels', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80' },
                { label: '🧥 Tailored Suit', url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80' },
                { label: '✨ Gold Watch', url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=800&auto=format&fit=crop&q=80' },
              ].map((s) => (
                <button
                  key={s.label}
                  type="button"
                  onClick={() => setNewImageUrl(s.url)}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded border border-stone-200 hover:border-amber-300 transition-colors cursor-pointer text-[10px]"
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap gap-3">
              {images.map((img) => (
                <div
                  key={img.id}
                  className={`relative w-24 h-32 rounded-lg overflow-hidden border-2 bg-stone-100 group ${
                    img.isPrimary ? 'border-amber-500 shadow-sm' : 'border-stone-200'
                  }`}
                >
                  <img
                    src={img.imageUrl}
                    alt={img.altText}
                    className="w-full h-full object-cover"
                  />
                  {img.isPrimary && (
                    <span className="absolute top-1 left-1 bg-amber-500 text-stone-950 font-bold px-1.5 py-0.5 rounded text-[9px] shadow-xs">
                      Primary
                    </span>
                  )}
                  <div className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1">
                    {!img.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryImage(img.id)}
                        className="bg-white text-stone-900 text-[10px] font-semibold px-2 py-0.5 rounded hover:bg-stone-100"
                      >
                        Set Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-rose-400 hover:text-rose-200 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Product Variant Matrix (Size + Color + SKU + Stock Quantity) */}
          <div className="space-y-3 pt-2 border-t border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
                  4. Variant Matrix (Size + Color Stock Tracking)
                </h4>
                <p className="text-[11px] text-stone-500">
                  Track stock at the exact variant level. Setting stock to 0 shows "Out of Stock".
                </p>
              </div>
            </div>

            {/* Quick Add Variant Bar */}
            <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 flex flex-wrap items-center gap-2">
              <div className="flex-1 min-w-[80px]">
                <input
                  type="text"
                  placeholder="Size (e.g. S, M, L, 38)"
                  value={newVarSize}
                  onChange={(e) => setNewVarSize(e.target.value)}
                  className="w-full p-1.5 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
              <div className="flex-1 min-w-[90px]">
                <input
                  type="text"
                  placeholder="Color (e.g. Emerald, Black)"
                  value={newVarColor}
                  onChange={(e) => setNewVarColor(e.target.value)}
                  className="w-full p-1.5 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  placeholder="Stock"
                  value={newVarStock}
                  onChange={(e) => setNewVarStock(Number(e.target.value))}
                  className="w-full p-1.5 bg-white border border-stone-300 rounded text-xs"
                />
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 bg-stone-900 text-white rounded text-xs font-semibold hover:bg-stone-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            {/* Variants Table */}
            <div className="overflow-x-auto border border-stone-200 rounded-lg">
              <table className="w-full text-left">
                <thead className="bg-stone-100 text-stone-700 border-b border-stone-200">
                  <tr>
                    <th className="p-2.5 font-semibold">Size</th>
                    <th className="p-2.5 font-semibold">Color</th>
                    <th className="p-2.5 font-semibold">Variant SKU</th>
                    <th className="p-2.5 font-semibold">Stock Quantity</th>
                    <th className="p-2.5 font-semibold">Storefront Status</th>
                    <th className="p-2.5 text-right font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {variants.map((v) => (
                    <tr key={v.id} className="hover:bg-stone-50">
                      <td className="p-2.5 font-medium text-stone-900">{v.size}</td>
                      <td className="p-2.5 text-stone-700">{v.color}</td>
                      <td className="p-2.5 font-mono text-stone-500">{v.sku}</td>
                      <td className="p-2.5">
                        <input
                          type="number"
                          min="0"
                          value={v.stockQuantity}
                          onChange={(e) => handleUpdateVariantStock(v.id, Number(e.target.value))}
                          className="w-20 p-1 border border-stone-300 rounded text-xs tabular-nums text-stone-900 font-semibold"
                        />
                      </td>
                      <td className="p-2.5">
                        {v.stockQuantity === 0 ? (
                          <span className="text-rose-700 font-medium bg-rose-50 px-2 py-0.5 rounded text-[10px]">
                            Out of Stock
                          </span>
                        ) : v.stockQuantity <= 2 ? (
                          <span className="text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                            Only {v.stockQuantity} left
                          </span>
                        ) : (
                          <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded text-[10px]">
                            In Stock ({v.stockQuantity})
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteVariant(v.id)}
                          className="text-stone-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Error feedback */}
          {submitError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
              {submitError}
            </div>
          )}

          {/* Footer Submit */}
          <div className="pt-4 border-t border-stone-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isCompressingImage}
              className="px-6 py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-semibold rounded-lg shadow-xs"
            >
              {isSubmitting
                ? 'Saving Product...'
                : isCompressingImage
                ? 'Optimizing Image...'
                : isEditing
                ? 'Save Product Changes'
                : 'Create Product in Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
