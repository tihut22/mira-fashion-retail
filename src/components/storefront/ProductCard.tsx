import React from 'react';
import { Product } from '../../types';
import { useRetail } from '../../context/RetailContext';
import { ProductImageDisplay } from '../common/ProductImageDisplay';
import { MessageSquare, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { currentBusiness, setSelectedProduct, categories, openTelegramOrderModal } = useRetail();

  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  const category = categories.find((c) => c.id === product.categoryId)?.name || 'Collection';

  // Calculate total in-stock across all variants
  const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 3;

  const displayPrice = product.discountPrice || product.sellingPrice;

  // Primary variant for quick Telegram trigger
  const defaultVariant =
    product.variants.find((v) => v.stockQuantity > 0) || product.variants[0];

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className="group flex flex-col bg-white rounded-xl overflow-hidden border border-stone-200/80 hover:border-stone-300 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      {/* Product Image Frame */}
      <div className="relative overflow-hidden bg-stone-50">
        <ProductImageDisplay
          src={primaryImage?.imageUrl || ''}
          alt={primaryImage?.altText || product.name}
          category={category}
          aspectRatio="portrait"
        />

        {/* Stock Status Badge */}
        <div className="absolute top-3 left-3 z-10">
          {isOutOfStock ? (
            <span className="text-[10px] font-semibold tracking-wider uppercase text-rose-800 bg-rose-50/95 backdrop-blur-xs px-2 py-0.5 rounded border border-rose-200/80 shadow-xs">
              Out of Stock
            </span>
          ) : isLowStock ? (
            <span className="text-[10px] font-semibold tracking-wider uppercase text-amber-900 bg-amber-50/95 backdrop-blur-xs px-2 py-0.5 rounded border border-amber-200/80 shadow-xs">
              Only {totalStock} left
            </span>
          ) : (
            <span className="text-[10px] font-medium tracking-wider uppercase text-emerald-900 bg-emerald-50/90 backdrop-blur-xs px-2 py-0.5 rounded border border-emerald-200/60 shadow-xs">
              In Stock
            </span>
          )}
        </div>

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 bg-stone-950/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-3 gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProduct(product);
            }}
            className="flex-1 bg-white text-stone-900 text-xs font-semibold py-2 px-3 rounded-lg shadow-sm hover:bg-stone-50 transition-colors flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Piece</span>
          </button>
          {defaultVariant && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                openTelegramOrderModal(product, defaultVariant, 1);
              }}
              title="Order directly via Telegram"
              className="bg-[#229ED9] text-white p-2 rounded-lg shadow-sm hover:bg-[#1c8ec4] transition-colors"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
            </button>
          )}
        </div>
      </div>

      {/* Card Content & Clean Unboxed Metadata */}
      <div className="p-4 flex flex-col justify-between flex-1 space-y-2">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-stone-600 font-medium">
            {category}
          </div>
          <h3 className="font-serif font-semibold text-stone-900 text-base line-clamp-1 group-hover:text-stone-700 transition-colors mt-0.5">
            {product.name}
          </h3>
        </div>

        {/* Variant Indicators & Price */}
        <div className="flex items-center justify-between pt-1 border-t border-stone-100">
          <div className="flex items-center gap-1">
            <span className="text-xs text-stone-600 font-medium">
              {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold text-stone-900 tabular-nums text-sm">
              {displayPrice.toLocaleString()} {currentBusiness.currency}
            </span>
            {product.discountPrice && (
              <span className="text-xs text-stone-600 line-through tabular-nums">
                {product.sellingPrice.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
