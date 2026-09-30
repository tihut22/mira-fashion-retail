import React from 'react';
import { useRetail } from '../../context/RetailContext';
import { ShoppingBag, User, Store, Shield, ArrowRight, MessageSquare, Smartphone } from 'lucide-react';

export const TopBar: React.FC = () => {
  const {
    currentBusiness,
    businesses,
    switchBusiness,
    activeView,
    setActiveView,
    cartCount,
    setIsCartOpen,
    setIsAccountOpen,
    categories,
    selectedCategory,
    setSelectedCategory,
    setStorefrontTab,
    storefrontTab,
    currentUser,
    isLoggedIn,
    logout,
    setIsAuthModalOpen,
  } = useRetail();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      {/* Platform Switcher & Multi-Tenant Ribbon */}
      <div className="bg-stone-950 text-stone-300 text-xs px-4 py-2 flex flex-wrap items-center justify-between gap-3 border-b border-stone-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold tracking-wider uppercase text-amber-400 text-[10px]">
            Retail Platform Architecture
          </span>
          <span className="text-stone-600 hidden sm:inline">|</span>
          {/* Shop Switcher */}
          <div className="flex items-center gap-1.5 text-stone-300">
            <span className="text-stone-400 hidden md:inline text-[11px]">Active Shop:</span>
            <select
              value={currentBusiness.slug}
              onChange={(e) => switchBusiness(e.target.value)}
              className="bg-stone-900 border border-stone-700 rounded px-2 py-0.5 text-xs text-stone-200 focus:outline-none focus:border-amber-400 cursor-pointer"
            >
              {businesses.map((biz) => (
                <option key={biz.id} value={biz.slug}>
                  {biz.name} ({biz.city})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Logged in User Badge in Top Ribbon */}
          {isLoggedIn && currentUser ? (
            <div className="flex items-center gap-2 bg-stone-900 px-2.5 py-1 rounded-md border border-stone-800 text-[11px]">
              <div className="w-5 h-5 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-[10px]">
                {currentUser.name.slice(0, 1)}
              </div>
              <span className="font-semibold text-stone-200">{currentUser.name}</span>
              <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {currentUser.role}
              </span>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="text-stone-400 hover:text-white underline ml-1 cursor-pointer"
              >
                Profile
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-2.5 py-1 rounded-md bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs cursor-pointer transition-colors"
            >
              Log In
            </button>
          )}

          {/* Interface Switcher Segmented Control */}
          <div className="flex items-center bg-stone-900 rounded-md p-0.5 border border-stone-800">
            <button
              onClick={() => setActiveView('storefront')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                activeView === 'storefront'
                  ? 'bg-amber-500 text-stone-950 shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Customer Storefront</span>
            </button>
            <button
              onClick={() => setActiveView('admin')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                activeView === 'admin'
                  ? 'bg-stone-100 text-stone-900 shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Admin / Shop Portal</span>
            </button>
            <button
              onClick={() => setActiveView('telegram')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-medium transition-all cursor-pointer ${
                activeView === 'telegram'
                  ? 'bg-[#24A1DE] text-white shadow-xs font-semibold'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 text-[#24A1DE]" />
              <span className="font-semibold text-stone-200">Telegram Mini App</span>
              <span className="w-1.5 h-1.5 rounded-full bg-[#24A1DE]"></span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Top Bar following Top Bar Contract */}
      {activeView === 'storefront' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setStorefrontTab('catalog');
              }}
              className="text-2xl font-serif font-bold tracking-tight text-stone-900 hover:text-stone-700 transition-colors text-left"
            >
              {currentBusiness.name}
            </button>
          </div>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-stone-600">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setStorefrontTab('catalog');
              }}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
                selectedCategory === 'all' && storefrontTab === 'catalog'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-1'
                  : ''
              }`}
            >
              All Pieces
            </button>
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.slug);
                  setStorefrontTab('catalog');
                }}
                className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
                  selectedCategory === cat.slug && storefrontTab === 'catalog'
                    ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-1'
                    : ''
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button
              onClick={() => setStorefrontTab('story')}
              className={`hover:text-stone-900 transition-colors whitespace-nowrap ${
                storefrontTab === 'story'
                  ? 'text-stone-900 font-semibold border-b-2 border-stone-900 py-1'
                  : ''
              }`}
            >
              Our Atelier
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={currentBusiness.telegramChannel || `https://t.me/${currentBusiness.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-1.5 text-xs text-sky-700 hover:text-sky-800 bg-sky-50 px-2.5 py-1.5 rounded border border-sky-200 transition-colors whitespace-nowrap"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-sky-600/20" />
              <span>@{currentBusiness.telegramUsername}</span>
            </a>

            {/* Account & Profile Button */}
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-stone-700 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
              title="User Account & Login State"
            >
              <User className="w-4 h-4 text-stone-600" />
              <span>{isLoggedIn && currentUser ? currentUser.name.split(' ')[0] : 'Log In'}</span>
            </button>

            {/* Selected Pieces for Telegram Order Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-[#229ED9] hover:bg-[#1c8ec4] rounded-md transition-all shadow-xs"
              aria-label={`Telegram Order with ${cartCount} items`}
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Telegram Order</span>
              {cartCount > 0 && (
                <span className="bg-white text-[#006e9c] text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Admin Portal Header Bar */}
      {activeView === 'admin' && (
        <div className="w-full px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="font-serif font-bold text-lg text-stone-900">
              {currentBusiness.name}
            </span>
            <span className="text-xs text-stone-500 font-medium bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
              Shop Management Portal
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Logged in User Indicator */}
            {isLoggedIn && currentUser && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-stone-600 font-medium">Logged in:</span>
                <span className="font-bold text-stone-900">{currentUser.name}</span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-[#993333] hover:underline font-bold text-[11px] ml-1 cursor-pointer"
                >
                  [Account]
                </button>
              </div>
            )}

            <button
              onClick={() => setActiveView('telegram')}
              className="flex items-center gap-1.5 text-xs text-[#0088CC] bg-sky-50 hover:bg-sky-100 font-semibold py-1 px-2.5 rounded-lg border border-sky-200 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-[#0088CC]" />
              <span>Launch Telegram Mini App</span>
            </button>
            <button
              onClick={() => setActiveView('storefront')}
              className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 font-medium py-1 px-2.5 rounded border border-stone-200 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              <span>View Live Storefront</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
