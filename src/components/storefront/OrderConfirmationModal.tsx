import React from 'react';
import { useRetail } from '../../context/RetailContext';
import { CheckCircle2, MessageSquare, Package, ArrowRight, X } from 'lucide-react';

export const OrderConfirmationModal: React.FC = () => {
  const { lastPlacedOrder, setLastPlacedOrder, currentBusiness, setIsAccountOpen } = useRetail();

  if (!lastPlacedOrder) return null;

  const handleOpenAccount = () => {
    setLastPlacedOrder(null);
    setIsAccountOpen(true);
  };

  const handleTelegramFollowUp = () => {
    const text = encodeURIComponent(
      `Hello ${currentBusiness.name}, I just placed order #${lastPlacedOrder.orderNumber} for ${lastPlacedOrder.total.toLocaleString()} ${currentBusiness.currency}. My name is ${lastPlacedOrder.customerName}.`
    );
    window.open(`https://t.me/${currentBusiness.telegramUsername}?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-stone-200 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-stone-900 text-white p-6 text-center relative">
          <button
            onClick={() => setLastPlacedOrder(null)}
            className="absolute top-4 right-4 text-stone-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-2xl">Order Received</h3>
          <p className="text-xs text-stone-300 mt-1">
            Order Reference: <strong className="text-white font-mono tracking-wider">{lastPlacedOrder.orderNumber}</strong>
          </p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2">
            <div className="flex justify-between font-medium text-stone-700">
              <span>Customer</span>
              <span className="text-stone-900">{lastPlacedOrder.customerName}</span>
            </div>
            <div className="flex justify-between font-medium text-stone-700">
              <span>Phone</span>
              <span className="text-stone-900">{lastPlacedOrder.customerPhone}</span>
            </div>
            <div className="flex justify-between font-medium text-stone-700">
              <span>Delivery Address</span>
              <span className="text-stone-900 text-right max-w-[200px] truncate">{lastPlacedOrder.deliveryAddress}</span>
            </div>
            <div className="flex justify-between font-medium text-stone-700">
              <span>Payment Mode</span>
              <span className="text-stone-900">{lastPlacedOrder.paymentMethod.replace('_', ' ')}</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 pt-2 border-t border-stone-200 text-sm">
              <span>Total Amount</span>
              <span className="tabular-nums">
                {lastPlacedOrder.total.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
          </div>

          {/* Items Summary */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
              Items Reserved in Inventory
            </span>
            <div className="space-y-1">
              {lastPlacedOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-stone-700 py-1 border-b border-stone-100">
                  <span>
                    {item.quantity}x {item.productName} ({item.variantSummary})
                  </span>
                  <span className="tabular-nums font-medium">
                    {(item.unitPrice * item.quantity).toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-stone-500 leading-relaxed text-[11px]">
            Stock has been reserved and your order is logged in {currentBusiness.name}'s shop system. You can notify our concierge on Telegram or track your shipment progress.
          </p>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <button
              onClick={handleTelegramFollowUp}
              className="w-full flex items-center justify-center gap-2 bg-[#229ED9] hover:bg-[#1a8bc0] text-white font-medium py-2.5 px-4 rounded-lg transition-colors shadow-xs"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Notify Concierge on Telegram</span>
            </button>
            <button
              onClick={handleOpenAccount}
              className="w-full flex items-center justify-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-medium py-2.5 px-4 rounded-lg transition-colors"
            >
              <Package className="w-4 h-4 text-stone-600" />
              <span>Track in Customer Orders</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
