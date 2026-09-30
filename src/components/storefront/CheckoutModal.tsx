import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { PaymentMethod } from '../../types';
import { X, ShieldCheck, CheckCircle2, AlertCircle, ShoppingBag } from 'lucide-react';

export const CheckoutModal: React.FC = () => {
  const {
    isCheckoutOpen,
    setIsCheckoutOpen,
    cart,
    cartSubtotal,
    currentBusiness,
    checkoutOnline,
    customerProfile,
    setCustomerProfile,
  } = useRetail();

  const [name, setName] = useState(customerProfile.name);
  const [phone, setPhone] = useState(customerProfile.phone);
  const [email, setEmail] = useState(customerProfile.email);
  const [telegram, setTelegram] = useState(customerProfile.telegram);
  const [address, setAddress] = useState(customerProfile.address);
  const [deliveryOption, setDeliveryOption] = useState('Standard Courier (Addis Ababa)');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isCheckoutOpen) return null;

  const isFreeDelivery = cartSubtotal >= currentBusiness.freeDeliveryThreshold;
  const deliveryFee = isFreeDelivery ? 0 : currentBusiness.deliveryFee;
  const total = cartSubtotal + deliveryFee;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('Please complete your name, phone number, and delivery address.');
      return;
    }

    setIsSubmitting(true);

    // Save profile for future
    setCustomerProfile({
      name,
      phone,
      email,
      telegram,
      address,
    });

    const result = checkoutOnline({
      customerName: name,
      customerPhone: phone,
      customerEmail: email || undefined,
      customerTelegram: telegram || undefined,
      deliveryAddress: address,
      deliveryOption,
      paymentMethod,
      notes: notes || undefined,
    });

    setIsSubmitting(false);

    if (!result.success) {
      setErrorMsg(result.error || 'Failed to place order.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                Secure Storefront Checkout
              </h3>
              <p className="text-xs text-stone-400">
                {currentBusiness.name} · Direct Order & Inventory Reservation
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsCheckoutOpen(false)}
            className="p-1 rounded-md text-stone-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Customer Details</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Selamawit Haile"
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Phone Number (Ethiopia) *
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+251 91 123 4567"
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Telegram Username (Optional)
                </label>
                <input
                  type="text"
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  placeholder="@your_telegram"
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="selam@example.com"
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Delivery Details */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              2. Delivery Address & Destination
            </h4>
            <div>
              <label className="block text-xs font-medium text-stone-700 mb-1">
                Specific Address in Addis Ababa or Region *
              </label>
              <textarea
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g. Bole Atlas, behind 2000 Habesha, near Edna Mall, House 45"
                className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Delivery Speed
                </label>
                <select
                  value={deliveryOption}
                  onChange={(e) => setDeliveryOption(e.target.value)}
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 bg-white focus:outline-none focus:ring-1 focus:ring-stone-900 cursor-pointer"
                >
                  <option value="Standard Courier (Addis Ababa)">
                    Standard Courier (Same/Next Day) — {deliveryFee === 0 ? 'FREE' : `${deliveryFee} ${currentBusiness.currency}`}
                  </option>
                  <option value="Express 3-Hour Delivery">
                    Express 3-Hour Delivery — +100 {currentBusiness.currency}
                  </option>
                  <option value="Boutique In-Store Pickup">
                    Self-Pickup at Bole Medhanialem Atelier — FREE
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  Order / Fitting Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Please call 30 mins before arrival"
                  className="w-full text-xs p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="space-y-3 pt-2 border-t border-stone-100">
            <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wider">
              3. Payment Method
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { id: 'TELEBIRR', label: 'Telebirr', sub: 'Instant mobile pay' },
                { id: 'CBE_BIRR', label: 'CBE Birr', sub: 'Commercial Bank' },
                { id: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', sub: 'Pay when delivered' },
                { id: 'BANK_TRANSFER', label: 'Bank Transfer', sub: 'Direct deposit' },
              ].map((method) => (
                <button
                  type="button"
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    paymentMethod === method.id
                      ? 'border-stone-900 bg-stone-900 text-white shadow-xs'
                      : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-800'
                  }`}
                >
                  <div className="font-semibold text-xs">{method.label}</div>
                  <div className={`text-[10px] mt-0.5 ${paymentMethod === method.id ? 'text-stone-300' : 'text-stone-500'}`}>
                    {method.sub}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Order Summary Line */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-2 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Items Total ({cart.length} unique variant{cart.length > 1 ? 's' : ''})</span>
              <span className="tabular-nums font-medium text-stone-900">
                {cartSubtotal.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>Delivery Charge</span>
              <span className="tabular-nums font-medium text-stone-900">
                {deliveryFee === 0 ? 'FREE' : `${deliveryFee.toLocaleString()} ${currentBusiness.currency}`}
              </span>
            </div>
            <div className="flex justify-between text-stone-900 font-bold text-sm pt-2 border-t border-stone-200">
              <span>Total Payable</span>
              <span className="tabular-nums text-base">
                {total.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setIsCheckoutOpen(false)}
              className="px-4 py-2.5 rounded-lg border border-stone-300 text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors"
            >
              Back to Bag
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition-colors flex items-center gap-2 shadow-xs disabled:opacity-60"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{isSubmitting ? 'Confirming Order...' : 'Confirm & Place Order'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
