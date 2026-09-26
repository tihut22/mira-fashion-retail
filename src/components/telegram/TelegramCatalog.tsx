import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Product, ProductVariant } from '../../types';
import {
  ShoppingBag,
  Search,
  Sparkles,
  Check,
  Share2,
  Package,
  Layers,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { triggerTelegramHaptic, shareToTelegram } from '../../utils/telegramSdk';

interface TelegramCatalogProps {
  onNavigateToInventory?: () => void;
}

export const TelegramCatalog: React.FC<TelegramCatalogProps> = ({
  onNavigateToInventory,
}) => {
  const { currentBusiness, publishedProducts, categories, updateVariantStock } = useRetail();
  const [selectedCat, setSelectedCat] = useState('all');
  const [query, setQuery] = useState('');

  // Selected Product for variant modal
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [soldNotice, setSoldNotice] = useState<string | null>(null);

  const filtered = publishedProducts.filter((p) => {
    const matchCat = selectedCat === 'all' || p.categoryId === selectedCat;
    const matchQ =
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  const handleOpenProduct = (p: Product) => {
    triggerTelegramHaptic('light');
    setActiveProduct(p);
    setSelectedVariant(p.variants.find((v) => v.stockQuantity > 0) || p.variants[0] || null);
    setSoldNotice(null);
  };

  const handleSellOne = () => {
    if (!activeProduct || !selectedVariant || selectedVariant.stockQuantity <= 0) return;
    const newQty = selectedVariant.stockQuantity - 1;
    updateVariantStock(activeProduct.id, selectedVariant.id, newQty);
    setSelectedVariant({ ...selectedVariant, stockQuantity: newQty });
    triggerTelegramHaptic('success');
    setSoldNotice(`Recorded 1 sale for ${selectedVariant.size}/${selectedVariant.color}! Stock is now ${newQty}.`);
    setTimeout(() => {
      setSoldNotice(null);
    }, 3000);
  };

  const handleShareProduct = () => {
    if (!activeProduct) return;
    triggerTelegramHaptic('medium');
    const price = activeProduct.discountPrice || activeProduct.sellingPrice;
    const inStockVariants = activeProduct.variants
      .filter((v) => v.stockQuantity > 0)
      .map((v) => `${v.size}/${v.color} (${v.stockQuantity} left)`)
      .join(', ');

    const shareText = `✨ *${activeProduct.name}*\n` +
      `🏷️ *SKU:* \`${activeProduct.sku}\`\n` +
      `💰 *Price:* ${price.toLocaleString()} ${currentBusiness.currency}\n` +
      `📦 *In Stock:* ${inStockVariants || 'Available on request'}\n\n` +
      `📍 Available now at *${currentBusiness.name}*!\n` +
      `📲 Telegram: @${currentBusiness.telegramUsername}`;

    shareToTelegram(shareText);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Categories */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search boutique collection..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            type="button"
            onClick={() => setSelectedCat('all')}
            className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
              selectedCat === 'all'
                ? 'bg-[#24A1DE] text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            All Pieces ({publishedProducts.length})
          </button>
          {categories.map((c) => {
            const count = publishedProducts.filter((p) => p.categoryId === c.id).length;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCat(c.id)}
                className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCat === c.id
                    ? 'bg-[#24A1DE] text-white shadow-xs'
                    : 'bg-white text-stone-600 border border-stone-200'
                }`}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.length === 0 ? (
          <div className="col-span-2 bg-white rounded-2xl p-8 border border-stone-200 text-center text-xs text-stone-400 space-y-1">
            <ShoppingBag className="w-8 h-8 mx-auto text-stone-300" />
            <p className="font-semibold text-stone-600">No published items found</p>
          </div>
        ) : (
          filtered.map((prod) => {
            const totalStock = prod.variants.reduce((s, v) => s + v.stockQuantity, 0);
            const isSoldOut = totalStock <= 0;
            const price = prod.discountPrice || prod.sellingPrice;

            return (
              <div
                key={prod.id}
                onClick={() => handleOpenProduct(prod)}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col group"
              >
                <div className="relative aspect-4/5 bg-stone-100 overflow-hidden flex items-center justify-center">
                  {prod.images[0]?.imageUrl ? (
                    <img
                      src={prod.images[0].imageUrl}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 bg-stone-100 p-2 text-center">
                      <ShoppingBag className="w-8 h-8 text-stone-300" />
                      <span className="text-[9px] text-stone-400 mt-1 font-medium">No photo</span>
                    </div>
                  )}
                  {isSoldOut ? (
                    <div className="absolute inset-0 bg-stone-900/60 flex items-center justify-center">
                      <span className="text-white text-[11px] font-bold uppercase tracking-wider bg-rose-600/90 px-2 py-0.5 rounded">
                        Sold Out
                      </span>
                    </div>
                  ) : (
                    <div className="absolute top-2 right-2 bg-stone-950/70 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                      {totalStock} in stock
                    </div>
                  )}
                </div>

                <div className="p-2.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-stone-900 text-xs line-clamp-1">
                      {prod.name}
                    </h4>
                    <p className="text-[10px] text-stone-400 font-mono mt-0.5">
                      {prod.sku}
                    </p>
                  </div>

                  <div className="pt-2 mt-1 border-t border-stone-100 flex items-center justify-between">
                    <span className="font-bold text-xs text-stone-900 font-mono">
                      {price.toLocaleString()} {currentBusiness.currency}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center text-xs font-bold">
                      +
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Details & Stock Actions Modal */}
      {activeProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-stone-950/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-sm w-full p-4 space-y-3.5 shadow-2xl border border-stone-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                {activeProduct.images[0]?.imageUrl ? (
                  <img
                    src={activeProduct.images[0].imageUrl}
                    alt={activeProduct.name}
                    className="w-14 h-14 rounded-xl object-cover bg-stone-100 shrink-0 border border-stone-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-stone-100 border border-stone-200 flex flex-col items-center justify-center shrink-0 text-stone-400">
                    <ShoppingBag className="w-5 h-5 text-stone-300" />
                    <span className="text-[8px] text-stone-400 mt-0.5">No photo</span>
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-stone-900 text-sm line-clamp-1">
                    {activeProduct.name}
                  </h3>
                  <p className="text-xs font-bold text-[#24A1DE] font-mono mt-0.5">
                    {(activeProduct.discountPrice || activeProduct.sellingPrice).toLocaleString()}{' '}
                    {currentBusiness.currency}
                  </p>
                  <p className="text-[10px] text-stone-400 font-mono">
                    SKU: {activeProduct.sku}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveProduct(null)}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Notification message if stock was just sold */}
            {soldNotice && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{soldNotice}</span>
              </div>
            )}

            {/* Variant Picker */}
            <div className="space-y-1.5 text-xs">
              <label className="block text-stone-600 font-semibold">Select Size & Color Variant:</label>
              <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                {activeProduct.variants.map((v) => {
                  const isOutOfStock = v.stockQuantity <= 0;
                  const isSelected = selectedVariant?.id === v.id;

                  return (
                    <button
                      key={v.id}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => {
                        setSelectedVariant(v);
                        triggerTelegramHaptic('light');
                      }}
                      className={`p-2 rounded-xl border text-left text-xs font-medium transition-all cursor-pointer ${
                        isSelected
                          ? 'border-[#24A1DE] bg-[#24A1DE]/10 text-[#24A1DE]'
                          : isOutOfStock
                          ? 'border-stone-200 bg-stone-100 text-stone-400 cursor-not-allowed line-through'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="font-bold">{v.size} / {v.color}</div>
                      <div className="text-[10px] text-stone-500 font-mono">
                        {v.stockQuantity} in stock
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Inventory Actions */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                disabled={!selectedVariant || selectedVariant.stockQuantity <= 0}
                onClick={handleSellOne}
                className="w-full py-2.5 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-300 text-white rounded-xl font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 cursor-pointer transition-transform active:scale-98"
              >
                <Package className="w-3.5 h-3.5" />
                <span>
                  Sell 1 from Stock {selectedVariant ? `(${selectedVariant.size}/${selectedVariant.color})` : ''}
                </span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShareProduct}
                  className="py-2 px-3 bg-white hover:bg-stone-50 text-stone-700 rounded-xl font-bold text-xs border border-stone-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
                >
                  <Share2 className="w-3.5 h-3.5 text-[#24A1DE]" />
                  <span>Share Item</span>
                </button>

                {onNavigateToInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveProduct(null);
                      onNavigateToInventory();
                    }}
                    className="py-2 px-3 bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <span>Manage Stock</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
