import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { ProductImageDisplay } from '../common/ProductImageDisplay';
import { X, ShoppingBag, MessageSquare, Check, AlertCircle } from 'lucide-react';

export const ProductDetailModal: React.FC = () => {
  const {
    selectedProduct,
    setSelectedProduct,
    currentBusiness,
    addToCart,
    openTelegramOrderModal,
  } = useRetail();

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Initialize selected color and size when product changes
  React.useEffect(() => {
    if (selectedProduct && selectedProduct.variants.length > 0) {
      setActiveImageIndex(0);
      setQuantity(1);
      // Select first in-stock variant or first variant
      const firstInStock =
        selectedProduct.variants.find((v) => v.stockQuantity > 0) ||
        selectedProduct.variants[0];
      setSelectedColor(firstInStock.color);
      setSelectedSize(firstInStock.size);
    }
  }, [selectedProduct]);

  if (!selectedProduct) return null;

  // Extract unique colors and sizes
  const availableColors = Array.from(
    new Set(selectedProduct.variants.map((v) => v.color))
  );

  const availableSizes = Array.from(
    new Set(selectedProduct.variants.map((v) => v.size))
  );

  // Find currently active variant
  const activeVariant =
    selectedProduct.variants.find(
      (v) => v.color === selectedColor && v.size === selectedSize
    ) ||
    selectedProduct.variants.find((v) => v.color === selectedColor) ||
    selectedProduct.variants[0];

  const currentStock = activeVariant ? activeVariant.stockQuantity : 0;
  const isOutOfStock = currentStock === 0;
  const isLowStock = currentStock > 0 && currentStock <= 2;

  const currentPrice =
    activeVariant?.price ||
    selectedProduct.discountPrice ||
    selectedProduct.sellingPrice;

  const handleAddToCart = () => {
    if (!activeVariant || isOutOfStock) return;
    const ok = addToCart(selectedProduct, activeVariant, quantity);
    if (ok) {
      setAddedNotice(true);
      setTimeout(() => setAddedNotice(false), 2000);
    }
  };

  const handleTelegramOrder = () => {
    if (!activeVariant) return;
    openTelegramOrderModal(selectedProduct, activeVariant, quantity);
  };

  const images = selectedProduct.images.length > 0
    ? selectedProduct.images
    : [{ id: '1', productId: selectedProduct.id, imageUrl: '', altText: selectedProduct.name, isPrimary: true, sortOrder: 1 }];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto border border-stone-200 my-auto">
        {/* Close Button */}
        <button
          onClick={() => setSelectedProduct(null)}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/80 hover:bg-white text-stone-700 hover:text-stone-950 shadow-xs border border-stone-200 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 sm:p-8">
          {/* Gallery Column */}
          <div className="space-y-4">
            <div className="rounded-xl overflow-hidden border border-stone-200/80 bg-stone-50">
              <ProductImageDisplay
                src={images[activeImageIndex]?.imageUrl}
                alt={images[activeImageIndex]?.altText || selectedProduct.name}
                category={selectedProduct.name}
                aspectRatio="portrait"
              />
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setActiveImageIndex(idx)}
                    className={`w-16 h-20 rounded-md overflow-hidden border-2 shrink-0 transition-all ${
                      activeImageIndex === idx
                        ? 'border-stone-900 ring-2 ring-stone-900/10'
                        : 'border-stone-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img.imageUrl}
                      alt={img.altText}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info & Purchase Module */}
          <div className="flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              {/* Clean Unboxed Metadata */}
              <div className="flex items-center gap-2 text-xs text-stone-500 uppercase tracking-widest font-medium">
                <span>SKU: {activeVariant?.sku || selectedProduct.sku}</span>
                <span aria-hidden="true">·</span>
                <span>Handcrafted in Addis Ababa</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900 leading-tight">
                {selectedProduct.name}
              </h2>

              {/* Price & Stock Status Indicator */}
              <div className="flex items-baseline gap-3">
                <span className="text-2xl font-semibold text-stone-900 tabular-nums">
                  {currentPrice.toLocaleString()} {currentBusiness.currency}
                </span>
                {selectedProduct.discountPrice && (
                  <span className="text-sm text-stone-400 line-through tabular-nums">
                    {selectedProduct.sellingPrice.toLocaleString()} {currentBusiness.currency}
                  </span>
                )}

                {/* Stock Status Badge */}
                {isOutOfStock ? (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 animate-pulse">
                    Only {currentStock} left!
                  </span>
                ) : (
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    In Stock ({currentStock} available)
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                {selectedProduct.description}
              </p>

              {/* Color Selection */}
              {availableColors.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-stone-100">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-stone-700">
                      Color: <strong className="text-stone-900">{selectedColor}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color) => {
                      const sampleVariant = selectedProduct.variants.find(
                        (v) => v.color === color
                      );
                      const isColorSelected = selectedColor === color;
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 ${
                            isColorSelected
                              ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                              : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100'
                          }`}
                        >
                          {sampleVariant?.colorHex && (
                            <span
                              className="w-2.5 h-2.5 rounded-full border border-white/40 shrink-0"
                              style={{ backgroundColor: sampleVariant.colorHex }}
                            />
                          )}
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Size Selection */}
              {availableSizes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-medium text-stone-700">
                      Size: <strong className="text-stone-900">{selectedSize}</strong>
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size) => {
                      // Check variant stock for this specific size + current color
                      const matchingVariant = selectedProduct.variants.find(
                        (v) => v.size === size && v.color === selectedColor
                      );
                      const sizeStock = matchingVariant ? matchingVariant.stockQuantity : 0;
                      const isSizeOutOfStock = sizeStock === 0;
                      const isSizeSelected = selectedSize === size;

                      return (
                        <button
                          key={size}
                          onClick={() => setSelectedSize(size)}
                          className={`min-w-10 px-3 py-2 rounded-md text-xs font-medium border text-center transition-all relative ${
                            isSizeSelected
                              ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                              : isSizeOutOfStock
                              ? 'border-stone-200 bg-stone-100 text-stone-400 line-through'
                              : 'border-stone-200 bg-white text-stone-700 hover:border-stone-400'
                          }`}
                        >
                          <span>{size}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Stepper */}
              {!isOutOfStock && (
                <div className="flex items-center gap-3 pt-2">
                  <span className="text-xs font-medium text-stone-700">Quantity:</span>
                  <div className="flex items-center border border-stone-200 rounded-md bg-stone-50 overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 text-xs font-semibold disabled:opacity-40"
                    >
                      −
                    </button>
                    <span className="px-3 text-xs font-semibold tabular-nums text-stone-900">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => Math.min(currentStock, q + 1))}
                      disabled={quantity >= currentStock}
                      className="px-2.5 py-1 text-stone-600 hover:bg-stone-200 text-xs font-semibold disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    Max: {currentStock}
                  </span>
                </div>
              )}

              {/* Craftsmanship Details */}
              {selectedProduct.details && selectedProduct.details.length > 0 && (
                <div className="pt-3 border-t border-stone-100">
                  <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider mb-2">
                    Craftsmanship & Details
                  </h4>
                  <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
                    {selectedProduct.details.map((detail, index) => (
                      <li key={index}>{detail}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* TELEGRAM ORDER ACTIONS */}
            <div className="pt-4 border-t border-stone-200 space-y-3">
              {addedNotice && (
                <div className="p-2.5 rounded-lg bg-sky-50 border border-sky-200 text-sky-900 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#229ED9]" />
                  <span>Added to your Telegram order list! You can review or add more pieces before contacting the seller.</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Action 1: Direct Telegram Order */}
                <button
                  onClick={handleTelegramOrder}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1a8bc0] text-white font-medium py-3 px-4 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 fill-white" />
                  <span>{isOutOfStock ? 'Item Out of Stock' : 'Order via Telegram'}</span>
                </button>

                {/* Action 2: Add to Telegram Order List */}
                <button
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className="w-full flex items-center justify-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium py-3 px-4 rounded-lg text-xs transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  <span>Select for Multi-Item Order</span>
                </button>
              </div>

              <p className="text-[11px] text-stone-500 text-center">
                Portal orders are fulfilled via Telegram directly with @{currentBusiness.telegramUsername}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
