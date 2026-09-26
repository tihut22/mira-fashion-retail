import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { CheckCircle2, Store, MessageSquare, Globe, Sparkles } from 'lucide-react';

export const StorefrontSettingsView: React.FC = () => {
  const { currentBusiness, updateBusinessSettings, setActiveView, clearAllData } = useRetail();

  const [name, setName] = useState(currentBusiness.name);
  const [tagline, setTagline] = useState(currentBusiness.tagline);
  const [description, setDescription] = useState(currentBusiness.description);
  const [phone, setPhone] = useState(currentBusiness.phone);
  const [telegramUsername, setTelegramUsername] = useState(currentBusiness.telegramUsername);
  const [address, setAddress] = useState(currentBusiness.address);
  const [businessHours, setBusinessHours] = useState(currentBusiness.businessHours);
  const [currency, setCurrency] = useState<'ETB' | 'USD'>(currentBusiness.currency);
  const [deliveryFee, setDeliveryFee] = useState(currentBusiness.deliveryFee);
  const [freeDeliveryThreshold, setFreeDeliveryThreshold] = useState(currentBusiness.freeDeliveryThreshold);
  const [bannerText, setBannerText] = useState(currentBusiness.bannerText || '');
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessSettings({
      name,
      tagline,
      description,
      phone,
      telegramUsername: telegramUsername.replace('@', ''),
      address,
      businessHours,
      currency,
      deliveryFee: Number(deliveryFee),
      freeDeliveryThreshold: Number(freeDeliveryThreshold),
      bannerText,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Overview & Multi-Tenant Info */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-1">
            Storefront Customization & Multi-Tenancy
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">
            {currentBusiness.name} Branding & Settings
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Every business has its own storefront accessible via /store/{currentBusiness.slug}.
          </p>
        </div>

        <button
          onClick={() => setActiveView('storefront')}
          className="bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold py-2 px-4 rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
        >
          <Store className="w-4 h-4" />
          <span>Preview Live Storefront</span>
        </button>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Storefront branding and settings saved successfully!</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6 text-xs">
        {/* Brand & Store Identity */}
        <div className="space-y-3">
          <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
            1. Brand & Store Identity
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Shop / Brand Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-stone-700 font-medium mb-1">Store Slug (URL Path)</label>
              <input
                type="text"
                disabled
                value={`/store/${currentBusiness.slug}`}
                className="w-full p-2.5 rounded-md border border-stone-200 bg-stone-50 text-stone-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Brand Tagline *</label>
            <input
              type="text"
              required
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">Storefront Description & Story</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>

          <div>
            <label className="block text-stone-700 font-medium mb-1">
              Top Announcement Banner Message (Optional)
            </label>
            <input
              type="text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="e.g. Free express delivery in Addis Ababa over 3,000 ETB"
              className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
            />
          </div>
        </div>

        {/* Telegram & Contact Channels */}
        <div className="space-y-3 pt-3 border-t border-stone-200">
          <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-[#229ED9]" />
            <span>2. Telegram & Contact Integration</span>
          </h3>
          <p className="text-[11px] text-stone-500">
            Customers clicking "Order via Telegram" will be directed to this Telegram username with an auto-composed order template.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Shop Telegram Username (without @) *
              </label>
              <div className="flex">
                <span className="p-2.5 bg-stone-100 border border-r-0 border-stone-300 rounded-l-md text-stone-500 font-mono">
                  @
                </span>
                <input
                  type="text"
                  required
                  value={telegramUsername}
                  onChange={(e) => setTelegramUsername(e.target.value)}
                  placeholder="mirafashion_orders"
                  className="flex-1 p-2.5 rounded-r-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Customer Support Phone</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>
        </div>

        {/* Location & Delivery Policy */}
        <div className="space-y-3 pt-3 border-t border-stone-200">
          <h3 className="font-semibold text-stone-900 uppercase tracking-wider text-[11px]">
            3. Showroom Location & Delivery Settings
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">Showroom Hours</label>
              <input
                type="text"
                value={businessHours}
                onChange={(e) => setBusinessHours(e.target.value)}
                className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-stone-700 font-medium mb-1">Primary Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as any)}
                className="w-full p-2.5 rounded-md border border-stone-300 bg-white"
              >
                <option value="ETB">Ethiopian Birr (ETB)</option>
                <option value="USD">US Dollar (USD)</option>
              </select>
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Standard Delivery Fee ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={deliveryFee}
                onChange={(e) => setDeliveryFee(Number(e.target.value))}
                className="w-full p-2.5 rounded-md border border-stone-300"
              />
            </div>

            <div>
              <label className="block text-stone-700 font-medium mb-1">
                Free Delivery Above ({currency})
              </label>
              <input
                type="number"
                min="0"
                value={freeDeliveryThreshold}
                onChange={(e) => setFreeDeliveryThreshold(Number(e.target.value))}
                className="w-full p-2.5 rounded-md border border-stone-300"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-stone-200 flex justify-between items-center">
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete all products, orders, and batches? This will clear all data completely.')) {
                clearAllData();
                alert('All data has been reset to clean empty state.');
              }
            }}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-semibold rounded-lg text-xs transition-colors"
          >
            Clear All Products & Data
          </button>
          <button
            type="submit"
            className="px-6 py-2.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-lg shadow-xs transition-colors"
          >
            Save Storefront Settings
          </button>
        </div>
      </form>
    </div>
  );
};
