import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { MessageSquare, Send, Copy, Check, X, ShieldAlert } from 'lucide-react';

export const TelegramOrderModal: React.FC = () => {
  const {
    telegramModalData,
    closeTelegramOrderModal,
    currentBusiness,
    buildTelegramDeepLink,
  } = useRetail();

  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);

  if (!telegramModalData) return null;

  const { product, variant, quantity } = telegramModalData;
  const unitPrice = product.discountPrice || product.sellingPrice;
  const total = unitPrice * quantity;

  const deepLink = buildTelegramDeepLink(product, variant, quantity, notes);

  const messageText = [
    `Hello ${currentBusiness.name}! I would like to place an order:`,
    `• Product: ${product.name}`,
    `• SKU: ${variant.sku}`,
    `• Variant: Size ${variant.size} / Color ${variant.color}`,
    `• Quantity: ${quantity}`,
    `• Total: ${total.toLocaleString()} ${currentBusiness.currency}`,
    notes ? `• Notes: ${notes}` : '',
    `Please confirm availability and delivery instructions.`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(messageText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenTelegram = () => {
    window.open(deepLink, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200">
        {/* Modal Header */}
        <div className="bg-[#229ED9] text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base leading-tight">Order via Telegram</h3>
              <p className="text-xs text-sky-100">
                Direct to @{currentBusiness.telegramUsername}
              </p>
            </div>
          </div>
          <button
            onClick={closeTelegramOrderModal}
            className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div className="bg-stone-50 rounded-lg p-3.5 border border-stone-200 text-xs space-y-2">
            <div className="flex justify-between font-medium text-stone-900">
              <span>{product.name}</span>
              <span className="tabular-nums font-semibold">
                {total.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
            <div className="text-stone-500 flex items-center gap-2">
              <span>Size: <strong>{variant.size}</strong></span>
              <span>·</span>
              <span>Color: <strong>{variant.color}</strong></span>
              <span>·</span>
              <span>Qty: <strong>{quantity}</strong></span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-700 mb-1">
              Add note for shop team (e.g. delivery neighborhood, fitting preference)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Bole Medhanialem near Edna Mall, please call me around 3 PM"
              rows={2}
              className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-sky-500"
            />
          </div>

          <div>
            <span className="block text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-1.5">
              Message Preview
            </span>
            <pre className="bg-stone-900 text-stone-200 text-xs p-3 rounded-md whitespace-pre-wrap font-mono leading-relaxed max-h-36 overflow-y-auto">
              {messageText}
            </pre>
          </div>

          <p className="text-xs text-stone-500 leading-relaxed">
            Clicking below opens Telegram with this order pre-composed. Our team will immediately
            confirm your order and register it in the shop system.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={handleOpenTelegram}
              className="flex-1 flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1e8cc0] text-white font-medium py-2.5 px-4 rounded-lg text-xs transition-colors shadow-xs"
            >
              <Send className="w-4 h-4" />
              <span>Launch Telegram & Send Order</span>
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center justify-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium py-2.5 px-3 rounded-lg text-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
