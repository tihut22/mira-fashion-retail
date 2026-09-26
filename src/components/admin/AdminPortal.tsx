import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { AdminDashboard } from './AdminDashboard';
import { InventoryManagement } from './InventoryManagement';
import { OrdersManagement } from './OrdersManagement';
import { StorefrontSettingsView } from './StorefrontSettingsView';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  ArrowRight,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles,
  Shield,
  TrendingUp,
  Boxes,
  Smartphone,
} from 'lucide-react';

export const AdminPortal: React.FC = () => {
  const {
    adminTab,
    setAdminTab,
    currentBusiness,
    orders,
    products,
    publishedProducts,
    packageBatches,
    setActiveView,
  } = useRetail();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const totalStock = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0),
    0
  );

  const menuItems = [
    {
      id: 'overview' as const,
      label: 'Operations Dashboard',
      subtitle: 'Analytics & KPIs',
      icon: LayoutDashboard,
      count: null,
      countHighlight: false,
    },
    {
      id: 'inventory' as const,
      label: 'Inventory & Visibility',
      subtitle: 'Catalog & Stock Control',
      icon: Package,
      count: products.length,
      countHighlight: false,
    },
    {
      id: 'orders' as const,
      label: 'Orders',
      subtitle: 'Customer Orders & Packages',
      icon: ShoppingCart,
      count: orders.length,
      countHighlight: true,
    },
    {
      id: 'settings' as const,
      label: 'Storefront Branding',
      subtitle: 'Theme, Logo & Messaging',
      icon: Store,
      count: null,
      countHighlight: false,
    },
  ];

  const activeItem = menuItems.find((m) => m.id === adminTab) || menuItems[0];
  const ActiveIcon = activeItem.icon;

  const renderNavButtons = () => (
    <div className="space-y-1.5">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const isActive = adminTab === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setAdminTab(item.id);
              setIsMobileMenuOpen(false);
            }}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all text-left group cursor-pointer ${
              isActive
                ? 'bg-stone-900 text-white shadow-2xs font-semibold'
                : 'text-stone-700 hover:text-stone-900 hover:bg-stone-100 font-medium'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'bg-stone-100 text-stone-600 group-hover:bg-stone-200 group-hover:text-stone-900'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold truncate leading-snug">
                  {item.label}
                </div>
                <div
                  className={`text-[10px] truncate mt-0.5 ${
                    isActive ? 'text-stone-400' : 'text-stone-400'
                  }`}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>

            {item.count !== null && (
              <span
                className={`ml-2 text-[11px] px-2 py-0.5 rounded-full font-mono font-bold shrink-0 transition-colors ${
                  isActive
                    ? item.countHighlight
                      ? 'bg-amber-400 text-stone-950'
                      : 'bg-white/20 text-white'
                    : item.countHighlight
                    ? 'bg-amber-100 text-amber-900 border border-amber-200'
                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                }`}
              >
                {item.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="min-h-[calc(100vh-94px)] bg-stone-100/70 text-stone-900 flex flex-col md:flex-row">
      {/* ------------------------------------------------------------------ */}
      {/* MOBILE TOP BANNER (Visible on small screens)                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="md:hidden bg-white border-b border-stone-200 p-3 sticky top-[94px] z-30 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center shrink-0">
            <ActiveIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-stone-900 truncate">
              {activeItem.label}
            </div>
            <div className="text-[10px] text-stone-500">
              Operations Menu
            </div>
          </div>
          {activeItem.count !== null && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-stone-100 text-stone-800 border border-stone-200 shrink-0">
              {activeItem.count}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-100 text-xs font-semibold transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* MOBILE DRAWER / OVERLAY (Small screens)                            */}
      {/* ------------------------------------------------------------------ */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-stone-950/60 backdrop-blur-2xs"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-xs bg-white h-full p-4 overflow-y-auto shadow-2xl flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-200">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-stone-900 text-amber-400 font-serif font-bold text-sm flex items-center justify-center">
                    {currentBusiness.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-xs truncate">
                      {currentBusiness.name}
                    </h3>
                    <p className="text-[10px] text-stone-500">Admin Operations</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1 rounded-md text-stone-400 hover:text-stone-700"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-1 mb-2">
                  Navigation Menu
                </div>
                {renderNavButtons()}
              </div>

              <div className="pt-2 border-t border-stone-200 space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveView('telegram');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-sky-200 bg-sky-50 text-[#0088CC] text-xs font-semibold cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Smartphone className="w-3.5 h-3.5 text-[#0088CC]" />
                    <span>Launch Telegram Mini App</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#0088CC]" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setActiveView('storefront');
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-medium cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Store className="w-3.5 h-3.5 text-stone-500" />
                    <span>View Live Storefront</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
                </button>
              </div>
            </div>

            {/* Mobile Footer Status */}
            <div className="pt-4 border-t border-stone-200 text-[11px] text-stone-500 space-y-1">
              <div className="flex justify-between">
                <span>Stock Units:</span>
                <strong className="text-stone-900">{totalStock}</strong>
              </div>
              <div className="flex justify-between">
                <span>Published:</span>
                <strong className="text-emerald-700">{publishedProducts.length}</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* DESKTOP SIDE MENU (Sticky on left)                                 */}
      {/* ------------------------------------------------------------------ */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 shrink-0 bg-white border-r border-stone-200 sticky top-[94px] h-[calc(100vh-94px)] overflow-y-auto">
        <div className="p-4 flex-1 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Shop Identity Header Card */}
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-stone-900 text-amber-400 font-serif font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                {currentBusiness.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-stone-900 text-xs truncate">
                  {currentBusiness.name}
                </div>
                <div className="text-[10px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span>{currentBusiness.city} · Shein Hub</span>
                </div>
              </div>
            </div>

            {/* Side Navigation Menu */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 pb-2">
                Operations Menu
              </div>
              {renderNavButtons()}
            </div>

            {/* Telegram Mini App Shortcut */}
            <div className="pt-2 border-t border-stone-200">
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 pb-2">
                Telegram Operations
              </div>
              <button
                type="button"
                onClick={() => setActiveView('telegram')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-sky-200 bg-sky-50/70 hover:bg-sky-100 hover:border-sky-300 text-[#0088CC] text-xs font-semibold transition-all group cursor-pointer shadow-2xs mb-2"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-[#24A1DE] text-white flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span>Launch Mini App</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#0088CC] group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

            {/* Quick Actions Card */}
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-stone-400 px-2 pb-2">
                Storefront Shortcut
              </div>
              <button
                type="button"
                onClick={() => setActiveView('storefront')}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 hover:border-stone-300 text-stone-800 text-xs font-medium transition-all group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-stone-100 flex items-center justify-center text-stone-600 group-hover:bg-amber-100 group-hover:text-amber-900 transition-colors">
                    <Store className="w-3.5 h-3.5" />
                  </div>
                  <span>Customer Storefront</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-stone-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          {/* Quick Metrics & System Health Footer */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-2 text-xs">
            <div className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
              Live Operations Snapshot
            </div>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between text-stone-600">
                <span>Total Live Stock:</span>
                <span className="font-mono font-bold text-stone-900">{totalStock} units</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Published Online:</span>
                <span className="font-mono font-bold text-emerald-700">{publishedProducts.length} items</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Active Packages:</span>
                <span className="font-mono font-bold text-stone-900">{packageBatches.length} batches</span>
              </div>
            </div>
            <div className="pt-1.5 border-t border-stone-200 text-[10px] text-stone-400 flex items-center justify-between">
              <span>Currency: {currentBusiness.currency}</span>
              <span className="text-emerald-700 font-medium">● Synced</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------------------------ */}
      {/* MAIN CONTENT AREA                                                  */}
      {/* ------------------------------------------------------------------ */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
        {adminTab === 'overview' && <AdminDashboard />}
        {adminTab === 'inventory' && <InventoryManagement />}
        {adminTab === 'orders' && <OrdersManagement />}
        {adminTab === 'settings' && <StorefrontSettingsView />}
      </main>
    </div>
  );
};
