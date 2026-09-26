import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { X, Trash2, MessageSquare, Send, Copy, Check, Info } from 'lucide-react';
import { ProductImageDisplay } from '../common/ProductImageDisplay';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    removeFromCart,
    updateCartQuantity,
    cartSubtotal,
    currentBusiness,
  } = useRetail();

  const [deliveryNote, setDeliveryNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isCartOpen) return null;

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  const buildTelegramMessage = () => {
    const lines = [
      `Hello ${currentBusiness.name}! I am contacting you from your portal to order these selected pieces:`,
      '',
    ];

    cart.forEach((item, index) => {
      const price = (item.product.discountPrice || item.product.sellingPrice) * item.quantity;
      lines.push(
        `${index + 1}. ${item.product.name}`
      );
      lines.push(
        `   • SKU: ${item.variant.sku}`
      );
      lines.push(
        `   • Size: ${item.variant.size} | Color: ${item.variant.color}`
      );
      lines.push(
        `   • Qty: ${item.quantity} × ${(item.product.discountPrice || item.product.sellingPrice).toLocaleString()} ${currentBusiness.currency} = ${price.toLocaleString()} ${currentBusiness.currency}`
      );
    });

    lines.push('');
    lines.push(`• Total Amount: ${cartSubtotal.toLocaleString()} ${currentBusiness.currency}`);
    if (deliveryNote.trim()) {
      lines.push(`• Customer Note: ${deliveryNote.trim()}`);
    }
    lines.push('');
    lines.push('Please confirm availability and let me know the payment / delivery steps!');

    return lines.join('\n');
  };

  const handleSendTelegramOrder = () => {
    const text = buildTelegramMessage();
    const deepLink = `https://t.me/${currentBusiness.telegramUsername}?text=${encodeURIComponent(text)}`;
    window.open(deepLink, '_blank', 'noopener,noreferrer');
  };

  const handleCopyMessage = () => {
    const text = buildTelegramMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs flex justify-end">
      <div className="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full border-l border-stone-200 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#229ED9] text-white flex items-center justify-center">
              <MessageSquare className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                Selected for Telegram
              </h3>
              <p className="text-[11px] text-stone-500">
                Direct to @{currentBusiness.telegramUsername}
              </p>
            </div>
            <span className="text-xs text-sky-800 font-semibold bg-sky-100 px-2 py-0.5 rounded-full ml-1">
              {totalQuantity}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Informative Guidance */}
        <div className="px-4 py-2.5 bg-sky-50/70 border-b border-sky-100 text-xs text-sky-950 flex items-start gap-2">
          <Info className="w-4 h-4 text-[#229ED9] shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            From this portal you can view item details and stock. When you click below, your selected items are pre-formatted so you can immediately contact the seller on Telegram to place your order!
          </p>
        </div>

        {/* Selected Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-3 text-stone-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <p className="font-serif text-base text-stone-800 font-medium">
                No items selected yet
              </p>
              <p className="text-xs text-stone-500 mt-1 max-w-xs">
                Browse our collection, select your size and color, and click "Order via Telegram" or "Select for Telegram".
              </p>
            </div>
          ) : (
            cart.map((item) => {
              const unitPrice =
                item.product.discountPrice || item.product.sellingPrice;
              const maxStock = item.variant.stockQuantity;

              return (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 rounded-xl border border-stone-200 bg-white hover:border-stone-300 transition-colors"
                >
                  {/* Thumbnail */}
                  <div className="w-14 h-18 rounded-lg overflow-hidden shrink-0 border border-stone-200 bg-stone-50">
                    <ProductImageDisplay
                      src={item.product.images[0]?.imageUrl || ''}
                      alt={item.product.name}
                      aspectRatio="portrait"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <h4 className="text-xs font-semibold text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-stone-400 hover:text-rose-600 transition-colors p-0.5"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Size: <strong>{item.variant.size}</strong> · Color:{' '}
                        <strong>{item.variant.color}</strong>
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        SKU: {item.variant.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-100">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-200 rounded bg-stone-50 overflow-hidden text-xs">
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity - 1)
                          }
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200"
                        >
                          −
                        </button>
                        <span className="px-2 text-stone-900 font-semibold tabular-nums">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateCartQuantity(item.id, item.quantity + 1)
                          }
                          disabled={item.quantity >= maxStock}
                          className="px-2 py-0.5 text-stone-600 hover:bg-stone-200 disabled:opacity-30"
                        >
                          +
                        </button>
                      </div>

                      {/* Price */}
                      <span className="text-xs font-semibold text-stone-900 tabular-nums">
                        {(unitPrice * item.quantity).toLocaleString()}{' '}
                        {currentBusiness.currency}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer & Direct Telegram Trigger */}
        {cart.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50 space-y-3">
            {/* Optional Note for Seller */}
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Optional note for seller (delivery neighborhood, preferred time)
              </label>
              <input
                type="text"
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="e.g. Bole Medhanialem, please deliver tomorrow morning"
                className="w-full text-xs p-2 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#229ED9]"
              />
            </div>

            {/* Total */}
            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-stone-600 font-medium">Total for Selected Pieces</span>
              <span className="text-base font-bold text-stone-900 tabular-nums font-serif">
                {cartSubtotal.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>

            {/* Primary Action: Direct to Telegram */}
            <div className="space-y-2 pt-1">
              <button
                onClick={handleSendTelegramOrder}
                className="w-full flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1c8ec4] text-white font-medium py-3 px-4 rounded-lg text-xs transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
                <span>Contact Seller on Telegram to Order</span>
              </button>

              <button
                onClick={handleCopyMessage}
                className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-medium py-2 px-3 rounded-lg text-xs transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Order Message Copied!' : 'Copy Order Text'}</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-500 text-center">
              Direct connection to @{currentBusiness.telegramUsername}. Payment (Telebirr/CBE) is confirmed directly with the seller.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
