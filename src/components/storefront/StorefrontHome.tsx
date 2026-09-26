import React, { useState, useMemo } from 'react';
import { useRetail } from '../../context/RetailContext';
import { ProductCard } from './ProductCard';
import { Search, SlidersHorizontal, MessageSquare, ArrowDown, MapPin, Clock, Phone, Sparkles } from 'lucide-react';

export const StorefrontHome: React.FC = () => {
  const {
    publishedProducts,
    categories,
    selectedCategory,
    setSelectedCategory,
    searchQuery,
    setSearchQuery,
    currentBusiness,
    storefrontTab,
    setStorefrontTab,
  } = useRetail();

  const [sortBy, setSortBy] = useState<'newest' | 'price-asc' | 'price-desc'>('newest');
  const [inStockOnly, setInStockOnly] = useState(false);

  // Filtered and sorted products
  const filteredProducts = useMemo(() => {
    return publishedProducts
      .filter((product) => {
        // Category filter
        if (selectedCategory !== 'all') {
          const cat = categories.find((c) => c.slug === selectedCategory);
          if (cat && product.categoryId !== cat.id) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = product.name.toLowerCase().includes(q);
          const matchDesc = product.description.toLowerCase().includes(q);
          const matchSku = product.sku.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchSku) return false;
        }

        // In-stock only filter
        if (inStockOnly) {
          const totalStock = product.variants.reduce((acc, v) => acc + v.stockQuantity, 0);
          if (totalStock <= 0) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = a.discountPrice || a.sellingPrice;
        const priceB = b.discountPrice || b.sellingPrice;
        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [publishedProducts, selectedCategory, categories, searchQuery, inStockOnly, sortBy]);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-stone-900 flex flex-col">
      {/* Top Notification Announcement */}
      {currentBusiness.bannerText && (
        <div className="bg-amber-950 text-amber-100 text-xs px-4 py-2 text-center border-b border-amber-900/50">
          <p className="font-medium tracking-wide flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{currentBusiness.bannerText}</span>
          </p>
        </div>
      )}

      {/* Hero Showcase Section */}
      <section className="relative bg-stone-900 text-white overflow-hidden py-16 sm:py-24 px-4 sm:px-6 lg:px-8 border-b border-stone-800">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-amber-300 font-medium">
            <span>{currentBusiness.city}, Ethiopia</span>
            <span aria-hidden="true">·</span>
            <span>Bespoke Collection</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-serif font-bold tracking-tight text-stone-100 text-balance leading-tight">
            {currentBusiness.tagline}
          </h1>

          <p className="max-w-2xl mx-auto text-stone-300 text-sm sm:text-base font-light leading-relaxed">
            {currentBusiness.description}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#catalog"
              className="bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <span>Explore Available Stock</span>
              <ArrowDown className="w-3.5 h-3.5" />
            </a>
            <a
              href={currentBusiness.telegramChannel || `https://t.me/${currentBusiness.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-[#229ED9] hover:bg-[#1f8fc4] text-white text-xs font-semibold py-3 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-xs"
            >
              <MessageSquare className="w-3.5 h-3.5 fill-white" />
              <span>Contact Seller on Telegram</span>
            </a>
          </div>
        </div>
      </section>

      {/* How Ordering Works: Portal to Telegram */}
      <section className="bg-white border-b border-stone-200 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-900 font-bold flex items-center justify-center shrink-0">
              1
            </div>
            <div>
              <h4 className="font-semibold text-stone-900">Browse Live Boutique Stock</h4>
              <p className="text-stone-500 mt-0.5 leading-relaxed">
                Check available sizes, colors, and real-time inventory counts right from our showroom.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-stone-100 text-stone-900 font-bold flex items-center justify-center shrink-0">
              2
            </div>
            <div>
              <h4 className="font-semibold text-stone-900">Select Your Piece & Size</h4>
              <p className="text-stone-500 mt-0.5 leading-relaxed">
                Pick your preferred size/color. Order a single piece or select multiple pieces for one inquiry.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-[#229ED9]/15 text-[#0369a1] font-bold flex items-center justify-center shrink-0">
              3
            </div>
            <div>
              <h4 className="font-semibold text-stone-900">Direct Telegram Order</h4>
              <p className="text-stone-500 mt-0.5 leading-relaxed">
                Tapping "Order via Telegram" leads directly to our seller chat with your pieces pre-filled.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalog & Filter Navigation */}
      <section id="catalog" className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 flex-1">
        {/* Search & Categories Bar */}
        <div className="space-y-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
                Curated Pieces
              </h2>
              <p className="text-xs text-stone-500 mt-1">
                Connected directly to live boutique inventory · Real-time stock counts
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search pieces, dresses, fabrics..."
                className="w-full bg-white text-xs pl-9 pr-4 py-2.5 rounded-lg border border-stone-200 focus:outline-none focus:ring-1 focus:ring-stone-900 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Category Filter Buttons & Sort Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-stone-200">
            {/* Category Filter Controls */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 bg-stone-100 rounded-lg">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                All ({publishedProducts.length})
              </button>
              {categories.map((cat) => {
                const count = publishedProducts.filter((p) => p.categoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.slug)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      selectedCategory === cat.slug
                        ? 'bg-white text-stone-900 shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* In-Stock & Sorting Controls */}
            <div className="flex items-center gap-3 text-xs">
              <label className="flex items-center gap-1.5 text-stone-600 hover:text-stone-900 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(e) => setInStockOnly(e.target.checked)}
                  className="rounded border-stone-300 text-stone-900 focus:ring-0"
                />
                <span>In Stock Only</span>
              </label>

              <div className="flex items-center gap-1 text-stone-500">
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-stone-200 rounded px-2.5 py-1 text-xs text-stone-800 focus:outline-none focus:border-stone-400 cursor-pointer"
                >
                  <option value="newest">Newest Arrivals</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <p className="font-serif text-xl text-stone-800 font-semibold">
              No matching pieces found
            </p>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              We couldn't find any items matching your active category or search query.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setInStockOnly(false);
              }}
              className="text-xs font-semibold text-stone-900 hover:underline pt-2 inline-block"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* Atelier Story & Store Information Section */}
      <section className="bg-stone-100 border-t border-stone-200 py-12 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-xs text-stone-600">
          <div className="space-y-2">
            <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-700" />
              <span>Boutique & Atelier</span>
            </h4>
            <p className="leading-relaxed">{currentBusiness.address}</p>
            <p className="text-stone-500">{currentBusiness.city}, Ethiopia</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-700" />
              <span>Showroom Hours</span>
            </h4>
            <p className="leading-relaxed">{currentBusiness.businessHours}</p>
            <p className="text-stone-500">Walk-ins and private fitting appointments welcomed.</p>
          </div>

          <div className="space-y-2">
            <h4 className="font-serif font-bold text-base text-stone-900 flex items-center gap-2">
              <Phone className="w-4 h-4 text-amber-700" />
              <span>Direct Client Care</span>
            </h4>
            <p className="font-medium text-stone-900">{currentBusiness.phone}</p>
            <a
              href={`https://t.me/${currentBusiness.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sky-700 hover:text-sky-900 font-semibold"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Telegram: @{currentBusiness.telegramUsername}</span>
            </a>
          </div>
        </div>
      </section>

      {/* Minimalist Footer */}
      <footer className="bg-stone-950 text-stone-400 py-6 px-4 border-t border-stone-800 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {currentBusiness.name}. Powered by Retail Platform Architecture.</p>
          <div className="flex items-center gap-4 text-stone-500">
            <span>Unified Inventory</span>
            <span>·</span>
            <span>Customer Storefront</span>
            <span>·</span>
            <span>Telegram Channel Sync</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
