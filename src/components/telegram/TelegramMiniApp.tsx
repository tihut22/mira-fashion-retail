import React, { useEffect, useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  initTelegramMiniApp,
  getTelegramUser,
  isTelegramEnvironment,
  triggerTelegramHaptic,
} from '../../utils/telegramSdk';
import { TelegramCreateOrder } from './TelegramCreateOrder';
import { TelegramInventory } from './TelegramInventory';
import { TelegramCatalog } from './TelegramCatalog';
import { TelegramOrdersList } from './TelegramOrdersList';
import { TelegramBotGuide } from './TelegramBotGuide';
import {
  ShoppingBag,
  Package,
  Store,
  FileText,
  Bot,
  Smartphone,
  Maximize2,
  Minimize2,
  ArrowLeft,
  Sparkles,
  User,
  Shield,
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';

export const TelegramMiniApp: React.FC = () => {
  const { currentBusiness, businesses, switchBusiness, setActiveView } = useRetail();

  // Telegram SDK User
  const [tgUser, setTgUser] = useState<{
    id?: number;
    first_name?: string;
    username?: string;
  } | null>(null);
  const [isInsideTelegram, setIsInsideTelegram] = useState(false);

  // Active Tab inside Mini App
  const [tab, setTab] = useState<'create_order' | 'inventory' | 'catalog' | 'orders' | 'bot_guide'>('create_order');

  // Device Frame View on desktop (Phone frame vs Full Width)
  const [isPhoneFrame, setIsPhoneFrame] = useState(false);

  useEffect(() => {
    initTelegramMiniApp();
    const isTg = isTelegramEnvironment();
    setIsInsideTelegram(isTg);
    const u = getTelegramUser();
    if (u) {
      setTgUser(u);
    } else {
      // Demo staff / user fallback
      setTgUser({
        first_name: 'Mira Boutique Staff',
        username: currentBusiness.telegramUsername,
      });
    }
  }, [currentBusiness.telegramUsername]);

  const handleTabChange = (nextTab: typeof tab) => {
    triggerTelegramHaptic('light');
    setTab(nextTab);
  };

  const content = (
    <div className="flex flex-col min-h-screen bg-[#F0F2F5] text-stone-900 font-sans selection:bg-[#24A1DE]/20 selection:text-[#24A1DE]">
      {/* Telegram App Bar */}
      <header className="sticky top-0 z-40 bg-[#24A1DE] text-white shadow-md">
        {/* Top Status & Context */}
        <div className="px-4 py-2 flex items-center justify-between text-xs border-b border-white/10">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="p-1 -ml-1 text-white/80 hover:text-white rounded-lg transition-colors cursor-pointer"
              title="Return to regular storefront"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1.5 font-bold tracking-tight">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Telegram Mini App</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* View Switchers */}
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="px-2 py-0.5 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 text-white"
              title="Open Customer Storefront"
            >
              <Store className="w-3 h-3" />
              <span className="hidden sm:inline">Store</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveView('admin')}
              className="px-2 py-0.5 bg-white/15 hover:bg-white/25 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center gap-1 text-white"
              title="Open Admin Portal"
            >
              <Shield className="w-3 h-3" />
              <span className="hidden sm:inline">Admin</span>
            </button>

            {/* Active Shop Selector */}
            <select
              value={currentBusiness.slug}
              onChange={(e) => switchBusiness(e.target.value)}
              className="bg-white/15 text-white font-medium text-[11px] rounded-lg px-2 py-0.5 border border-white/20 focus:outline-none cursor-pointer"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.slug} className="text-stone-900 bg-white">
                  {b.name}
                </option>
              ))}
            </select>

            {/* Desktop Frame Toggle */}
            <button
              type="button"
              onClick={() => setIsPhoneFrame(!isPhoneFrame)}
              className="hidden lg:flex p-1 bg-white/15 hover:bg-white/25 rounded-lg text-white transition-colors cursor-pointer"
              title={isPhoneFrame ? 'Expand to Full View' : 'Switch to Mobile Phone Frame'}
            >
              {isPhoneFrame ? (
                <Maximize2 className="w-3.5 h-3.5" />
              ) : (
                <Minimize2 className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>

        {/* Telegram Profile Ribbon */}
        <div className="px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 border border-white/30 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
              {tgUser?.first_name?.slice(0, 2) || 'TG'}
            </div>
            <div>
              <div className="font-bold text-xs leading-none">
                {tgUser?.first_name || 'Telegram User'}
              </div>
              <div className="text-[10px] text-white/80 font-mono mt-0.5">
                {tgUser?.username ? `@${tgUser.username}` : `@${currentBusiness.telegramUsername}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full border border-white/20">
              {isInsideTelegram ? 'Native TMA' : 'Web View'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Tab Content */}
      <main className="flex-1 p-3 sm:p-4 max-w-lg mx-auto w-full">
        {tab === 'create_order' && (
          <TelegramCreateOrder
            initialTelegramUser={tgUser}
            onOrderCreated={() => {
              // Option to jump to orders or stay
            }}
          />
        )}

        {tab === 'inventory' && <TelegramInventory />}

        {tab === 'catalog' && (
          <TelegramCatalog onNavigateToInventory={() => handleTabChange('inventory')} />
        )}

        {tab === 'orders' && <TelegramOrdersList />}

        {tab === 'bot_guide' && <TelegramBotGuide />}
      </main>

      {/* Telegram Native Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg max-w-lg mx-auto">
        <div className="grid grid-cols-5 h-15">
          {/* Create Pre-Order */}
          <button
            type="button"
            onClick={() => handleTabChange('create_order')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-colors relative ${
              tab === 'create_order' ? 'text-[#24A1DE]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                tab === 'create_order' ? 'bg-[#24A1DE]/10 scale-105' : ''
              }`}
            >
              <Sparkles className="w-5 h-5" />
            </div>
            <span>+ Pre-Order</span>
          </button>

          {/* Create Inventory */}
          <button
            type="button"
            onClick={() => handleTabChange('inventory')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${
              tab === 'inventory' ? 'text-[#24A1DE]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                tab === 'inventory' ? 'bg-[#24A1DE]/10 scale-105' : ''
              }`}
            >
              <Package className="w-5 h-5" />
            </div>
            <span>+ Stock</span>
          </button>

          {/* Store Catalog */}
          <button
            type="button"
            onClick={() => handleTabChange('catalog')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${
              tab === 'catalog' ? 'text-[#24A1DE]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                tab === 'catalog' ? 'bg-[#24A1DE]/10 scale-105' : ''
              }`}
            >
              <Store className="w-5 h-5" />
            </div>
            <span>Catalog</span>
          </button>

          {/* Orders */}
          <button
            type="button"
            onClick={() => handleTabChange('orders')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${
              tab === 'orders' ? 'text-[#24A1DE]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                tab === 'orders' ? 'bg-[#24A1DE]/10 scale-105' : ''
              }`}
            >
              <FileText className="w-5 h-5" />
            </div>
            <span>Orders</span>
          </button>

          {/* Bot Setup */}
          <button
            type="button"
            onClick={() => handleTabChange('bot_guide')}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer transition-colors ${
              tab === 'bot_guide' ? 'text-[#24A1DE]' : 'text-stone-400 hover:text-stone-700'
            }`}
          >
            <div
              className={`p-1 rounded-xl transition-all ${
                tab === 'bot_guide' ? 'bg-[#24A1DE]/10 scale-105' : ''
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>
            <span>Bot Setup</span>
          </button>
        </div>
      </nav>
    </div>
  );

  // If viewed on desktop and phone frame preview is active, render inside a realistic phone mockup
  if (isPhoneFrame) {
    return (
      <div className="min-h-screen bg-stone-900 py-8 px-4 flex flex-col items-center justify-center">
        {/* Device Frame Controls */}
        <div className="w-full max-w-sm mb-3 flex items-center justify-between text-xs text-stone-400">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-[#24A1DE]" />
            <span className="font-semibold text-stone-300">Telegram App Mobile View</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPhoneFrame(false)}
              className="text-[#24A1DE] hover:underline font-semibold cursor-pointer"
            >
              Full Screen
            </button>
            <span>•</span>
            <button
              type="button"
              onClick={() => setActiveView('storefront')}
              className="text-stone-400 hover:text-white cursor-pointer"
            >
              Exit to Shop
            </button>
          </div>
        </div>

        {/* Realistic iPhone / Telegram Frame */}
        <div className="w-full max-w-sm h-[844px] bg-black rounded-[48px] p-3 shadow-2xl ring-1 ring-white/20 relative overflow-hidden flex flex-col">
          {/* Dynamic Island / Notch */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-stone-800 mr-2"></div>
            <div className="w-2 h-2 rounded-full bg-blue-900/60"></div>
          </div>

          {/* Screen Content */}
          <div className="w-full h-full rounded-[38px] overflow-y-auto overflow-x-hidden relative flex flex-col no-scrollbar">
            {content}
          </div>
        </div>
      </div>
    );
  }

  return content;
};
