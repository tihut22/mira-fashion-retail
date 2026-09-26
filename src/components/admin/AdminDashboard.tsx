import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  DateRangeFilter,
  DateFilterState,
  isDateInFilter,
  formatDisplayDate,
} from '../common/DateRangeFilter';
import {
  MessageSquare,
  Store,
  TrendingUp,
  AlertTriangle,
  Package,
  ArrowUpRight,
  PhoneCall,
  Calendar,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { orders, products, publishedProducts, currentBusiness, setAdminTab, setActiveView } = useRetail();

  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'ALL',
    startDate: '',
    endDate: '',
  });

  // Filtered orders for dashboard KPIs & Recent Orders
  const filteredOrders = orders.filter((o) => isDateInFilter(o.createdAt, dateFilter));

  // Revenue metrics by source (TELEGRAM, WALK_IN, PHONE) based on date filter
  const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.status !== 'CANCELLED' ? o.total : 0), 0);

  const channelStats = {
    TELEGRAM: {
      revenue: filteredOrders
        .filter((o) => o.source === 'TELEGRAM' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0),
      count: filteredOrders.filter((o) => o.source === 'TELEGRAM').length,
    },
    WALK_IN: {
      revenue: filteredOrders
        .filter((o) => o.source === 'WALK_IN' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0),
      count: filteredOrders.filter((o) => o.source === 'WALK_IN').length,
    },
    PHONE: {
      revenue: filteredOrders
        .filter((o) => o.source === 'PHONE' && o.status !== 'CANCELLED')
        .reduce((sum, o) => sum + o.total, 0),
      count: filteredOrders.filter((o) => o.source === 'PHONE').length,
    },
  };

  const telegramPct = totalRevenue > 0 ? Math.round((channelStats.TELEGRAM.revenue / totalRevenue) * 100) : 0;
  const walkInPct = totalRevenue > 0 ? Math.round((channelStats.WALK_IN.revenue / totalRevenue) * 100) : 0;
  const phonePct = totalRevenue > 0 ? Math.max(0, 100 - telegramPct - walkInPct) : 0;

  // Inventory & stock metrics
  const totalStockUnits = products.reduce(
    (sum, p) => sum + p.variants.reduce((vSum, v) => vSum + v.stockQuantity, 0),
    0
  );

  const lowStockVariants = products.flatMap((p) =>
    p.variants
      .filter((v) => v.stockQuantity <= 2)
      .map((v) => ({ product: p, variant: v }))
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="text-xs uppercase tracking-wider text-amber-700 font-semibold mb-1">
            Retail Operations Overview · {currentBusiness.city}
          </div>
          <h2 className="text-2xl font-serif font-bold text-stone-900">
            {currentBusiness.name} Command Center
          </h2>
          <p className="text-xs text-stone-500 mt-1">
            Portal stock browsing with direct Telegram ordering & physical boutique inventory synchronization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dashboard Date Filter */}
          <div className="flex items-center gap-1.5 bg-stone-50 p-1.5 rounded-xl border border-stone-200">
            <span className="text-[11px] text-stone-500 font-medium pl-1">Period:</span>
            <DateRangeFilter filter={dateFilter} onChange={setDateFilter} align="right" />
          </div>

          <button
            onClick={() => setActiveView('storefront')}
            className="px-3.5 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <span>Launch Customer Store</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Date Filter Status Banner if active */}
      {dateFilter.preset !== 'ALL' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-950">
          <div className="flex items-center gap-2 font-medium">
            <Calendar className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Filtering dashboard metrics and orders by <strong>{dateFilter.preset.replace(/_/g, ' ')}</strong> ({filteredOrders.length} orders matched)
            </span>
          </div>
          <button
            type="button"
            onClick={() => setDateFilter({ preset: 'ALL', startDate: '', endDate: '' })}
            className="text-xs font-semibold text-amber-800 hover:underline"
          >
            Clear Date Filter
          </button>
        </div>
      )}

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Total Gross Revenue</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900 tabular-nums">
            {totalRevenue.toLocaleString()} {currentBusiness.currency}
          </div>
          <div className="text-[11px] text-stone-400">
            Across {filteredOrders.length} {dateFilter.preset !== 'ALL' ? 'filtered' : 'registered'} orders
          </div>
        </div>

        {/* Customer Orders Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Customer Orders</span>
            <Package className="w-4 h-4 text-sky-700" />
          </div>
          <div className="text-2xl font-bold font-serif text-sky-950 tabular-nums">
            {channelStats.TELEGRAM.revenue.toLocaleString()} {currentBusiness.currency}
          </div>
          <div className="text-[11px] text-sky-700 font-medium">
            {telegramPct}% of total ({channelStats.TELEGRAM.count} orders)
          </div>
        </div>

        {/* Physical Boutique Walk-In Revenue */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Boutique Showroom</span>
            <Store className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-amber-950 tabular-nums">
            {channelStats.WALK_IN.revenue.toLocaleString()} {currentBusiness.currency}
          </div>
          <div className="text-[11px] text-amber-700 font-medium">
            {walkInPct}% of total ({channelStats.WALK_IN.count} orders)
          </div>
        </div>

        {/* Products & Inventory Status */}
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs text-stone-500">
            <span>Published / Inventory</span>
            <Package className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-serif text-stone-900 tabular-nums">
            {publishedProducts.length} <span className="text-sm font-sans font-normal text-stone-400">/ {products.length} products</span>
          </div>
          <div className="text-[11px] text-stone-500">
            {totalStockUnits} units in total stock
          </div>
        </div>
      </div>

      {/* Channel Revenue Comparison Report */}
      <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-900">
              Channel Revenue Breakdown: Telegram vs Physical Boutique
            </h3>
            <p className="text-xs text-stone-500">
              Orders initiated via customer portal direct to Telegram vs in-person boutique sales
            </p>
          </div>
        </div>

        {/* Multi-colored Channel Distribution Bar */}
        <div className="space-y-2">
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden flex">
            <div
              style={{ width: `${telegramPct}%` }}
              className="h-full bg-[#229ED9] transition-all"
              title={`Telegram: ${telegramPct}%`}
            />
            <div
              style={{ width: `${walkInPct}%` }}
              className="h-full bg-amber-600 transition-all"
              title={`Boutique Showroom: ${walkInPct}%`}
            />
            {phonePct > 0 && (
              <div
                style={{ width: `${phonePct}%` }}
                className="h-full bg-purple-600 transition-all"
                title={`Phone Orders: ${phonePct}%`}
              />
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
            <div className="p-3 rounded-lg bg-sky-50 border border-sky-100">
              <div className="flex items-center gap-1.5 font-semibold text-sky-900">
                <span className="w-2.5 h-2.5 rounded-full bg-[#229ED9]" />
                <span>Telegram Orders</span>
              </div>
              <div className="text-lg font-bold tabular-nums text-stone-900 mt-1">
                {channelStats.TELEGRAM.revenue.toLocaleString()} {currentBusiness.currency}
              </div>
              <div className="text-[11px] text-stone-500">
                {channelStats.TELEGRAM.count} orders · {telegramPct}% revenue
              </div>
            </div>

            <div className="p-3 rounded-lg bg-amber-50 border border-amber-100">
              <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                <span>Physical Boutique / Walk-In</span>
              </div>
              <div className="text-lg font-bold tabular-nums text-stone-900 mt-1">
                {channelStats.WALK_IN.revenue.toLocaleString()} {currentBusiness.currency}
              </div>
              <div className="text-[11px] text-stone-500">
                {channelStats.WALK_IN.count} orders · {walkInPct}% revenue
              </div>
            </div>

            <div className="p-3 rounded-lg bg-purple-50 border border-purple-100">
              <div className="flex items-center gap-1.5 font-semibold text-purple-900">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                <span>Phone / Concierge</span>
              </div>
              <div className="text-lg font-bold tabular-nums text-stone-900 mt-1">
                {channelStats.PHONE.revenue.toLocaleString()} {currentBusiness.currency}
              </div>
              <div className="text-[11px] text-stone-500">
                {channelStats.PHONE.count} orders · {phonePct}% revenue
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Alert & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <h3 className="font-serif font-bold text-base text-stone-900">
                Low & Depleted Stock Alerts ({lowStockVariants.length})
              </h3>
            </div>
            <button
              onClick={() => setAdminTab('inventory')}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium"
            >
              Manage Inventory →
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1 text-xs">
            {lowStockVariants.length === 0 ? (
              <div className="text-stone-400 py-6 text-center">
                All inventory variants are comfortably stocked.
              </div>
            ) : (
              lowStockVariants.map(({ product, variant }) => (
                <div
                  key={variant.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-stone-50/70"
                >
                  <div>
                    <div className="font-medium text-stone-900">{product.name}</div>
                    <div className="text-[11px] text-stone-500">
                      Variant: Size {variant.size} / {variant.color} ({variant.sku})
                    </div>
                  </div>
                  <div>
                    {variant.stockQuantity === 0 ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        0 in stock (Sold Out)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        {variant.stockQuantity} left
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-stone-900">
                Recent Orders Log
              </h3>
              <span className="text-[11px] text-stone-500">
                ({filteredOrders.length} {dateFilter.preset !== 'ALL' ? 'filtered' : 'recent'})
              </span>
            </div>
            <button
              onClick={() => setAdminTab('orders')}
              className="text-xs text-stone-600 hover:text-stone-900 font-medium"
            >
              View All Orders →
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto pr-1 text-xs">
            {filteredOrders.length === 0 ? (
              <div className="p-6 text-center text-stone-400 bg-stone-50 rounded-lg border border-dashed border-stone-200">
                <Calendar className="w-6 h-6 text-stone-300 mx-auto mb-1.5" />
                <p>No orders registered for the selected date range.</p>
                {dateFilter.preset !== 'ALL' && (
                  <button
                    type="button"
                    onClick={() => setDateFilter({ preset: 'ALL', startDate: '', endDate: '' })}
                    className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
                  >
                    Reset to All Time
                  </button>
                )}
              </div>
            ) : (
              filteredOrders.slice(0, 8).map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-stone-200 bg-stone-50/70 hover:bg-stone-50 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2 font-semibold text-stone-900">
                      <span className="font-mono">{order.orderNumber}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-sans uppercase font-bold ${
                          order.source === 'TELEGRAM'
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : order.source === 'PHONE'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-stone-100 text-stone-800'
                        }`}
                      >
                        {order.source === 'TELEGRAM' ? 'SHEIN ORDER' : order.source}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500 flex items-center gap-2 mt-0.5">
                      <span>{order.customerName}</span>
                      <span>·</span>
                      <span className="text-stone-400 flex items-center gap-1 font-mono text-[10px]">
                        <Calendar className="w-3 h-3 text-stone-400" />
                        {formatDisplayDate(order.createdAt)}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold tabular-nums text-stone-900">
                      {order.total.toLocaleString()} {currentBusiness.currency}
                    </div>
                    <div className="text-[10px] text-stone-500 uppercase">{order.status}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
