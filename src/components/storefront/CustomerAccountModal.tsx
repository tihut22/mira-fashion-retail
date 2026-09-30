import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import {
  DateRangeFilter,
  DateFilterState,
  isDateInFilter,
  formatDisplayDate,
} from '../common/DateRangeFilter';
import {
  X,
  Package,
  User,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  MessageSquare,
  Calendar,
} from 'lucide-react';
import { OrderStatus } from '../../types';

export const CustomerAccountModal: React.FC = () => {
  const {
    isAccountOpen,
    setIsAccountOpen,
    customerProfile,
    setCustomerProfile,
    orders,
    currentBusiness,
  } = useRetail();

  const [activeTab, setActiveTab] = useState<'orders' | 'profile'>('orders');
  const [profileForm, setProfileForm] = useState(customerProfile);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilterState>({
    preset: 'ALL',
    startDate: '',
    endDate: '',
  });

  if (!isAccountOpen) return null;

  // Filter orders matching customer phone or name or all orders for this demo
  const customerOrders = orders.filter(
    (o) =>
      o.customerPhone === customerProfile.phone ||
      o.customerName.toLowerCase().includes(customerProfile.name.toLowerCase().split(' ')[0]) ||
      orders.length <= 5
  );

  const filteredCustomerOrders = customerOrders.filter((o) => isDateInFilter(o.createdAt, dateFilter));

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerProfile(profileForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-medium">Delivered</span>;
      case 'OUT_FOR_DELIVERY':
        return <span className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-medium">Out for Delivery</span>;
      case 'PROCESSING':
        return <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium">Preparing</span>;
      case 'CONFIRMED':
        return <span className="text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-medium">Confirmed</span>;
      case 'CANCELLED':
        return <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] font-medium">Cancelled</span>;
      default:
        return <span className="text-stone-700 bg-stone-100 border border-stone-200 px-2 py-0.5 rounded text-[10px] font-medium">Pending</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-stone-900 text-white flex items-center justify-center font-bold text-xs">
              {customerProfile.name ? customerProfile.name.slice(0, 2).toUpperCase() : 'CU'}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-900 leading-tight">
                {customerProfile.name || 'Customer Account'}
              </h3>
              <p className="text-xs text-stone-500">
                {customerProfile.phone} · {currentBusiness.name}
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAccountOpen(false)}
            className="p-1.5 text-stone-400 hover:text-stone-900 rounded-lg hover:bg-stone-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-200 px-6 gap-6 text-xs font-medium">
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'orders'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Order History & Tracking ({customerOrders.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 flex items-center gap-2 border-b-2 transition-colors ${
              activeTab === 'profile'
                ? 'border-stone-900 text-stone-900 font-semibold'
                : 'border-transparent text-stone-500 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Saved Profile & Addresses</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'orders' ? (
            <div className="space-y-4">
              {/* Order History Date Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-1 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-stone-500 font-medium">Filter by Date:</span>
                  <DateRangeFilter filter={dateFilter} onChange={setDateFilter} />
                </div>
                <div className="text-[11px] text-stone-500">
                  Showing <strong>{filteredCustomerOrders.length}</strong> of {customerOrders.length} orders
                </div>
              </div>

              {filteredCustomerOrders.length === 0 ? (
                <div className="text-center py-10 text-stone-500 text-xs bg-stone-50 rounded-xl border border-dashed border-stone-200">
                  <Calendar className="w-8 h-8 mx-auto text-stone-300 mb-2" />
                  <p>No orders found matching the selected date range.</p>
                  {dateFilter.preset !== 'ALL' && (
                    <button
                      type="button"
                      onClick={() => setDateFilter({ preset: 'ALL', startDate: '', endDate: '' })}
                      className="mt-2 text-xs font-semibold text-amber-700 hover:underline"
                    >
                      Reset Date Filter
                    </button>
                  )}
                </div>
              ) : (
                filteredCustomerOrders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3 text-xs"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-stone-900">
                          {order.orderNumber}
                        </span>
                        {/* Order Source Tag */}
                        <span
                          className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            order.source === 'TELEGRAM'
                              ? 'bg-[#229ED9]/15 text-[#006e9c] border border-[#229ED9]/30'
                              : order.source === 'PHONE'
                              ? 'bg-purple-100 text-purple-900 border border-purple-200'
                              : 'bg-stone-200 text-stone-800'
                          }`}
                        >
                          Channel: {order.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(order.status)}
                        <span className="text-stone-500 text-[11px] font-medium flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-stone-400" />
                          {formatDisplayDate(order.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Items */}
                    <div className="space-y-1.5">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-stone-700">
                          <span>
                            {item.quantity}x {item.productName} ({item.variantSummary})
                          </span>
                          <span className="tabular-nums font-medium text-stone-900">
                            {(item.unitPrice * item.quantity).toLocaleString()}{' '}
                            {currentBusiness.currency}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery & Total */}
                    <div className="flex justify-between items-center pt-2 border-t border-stone-200 text-stone-600">
                      <div>
                        <span>Delivery: </span>
                        <span className="text-stone-800 font-medium">{order.deliveryAddress}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-stone-900 tabular-nums">
                          Total: {order.total.toLocaleString()} {currentBusiness.currency}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              {savedSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Profile updated successfully!</span>
                </div>
              )}

              <div>
                <label className="block font-medium text-stone-700 mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={profileForm.phone}
                    onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Telegram Handle</label>
                  <input
                    type="text"
                    value={profileForm.telegram}
                    onChange={(e) => setProfileForm({ ...profileForm, telegram: e.target.value })}
                    className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Default Delivery Address</label>
                <textarea
                  rows={2}
                  value={profileForm.address}
                  onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                  className="w-full p-2.5 rounded-md border border-stone-300 focus:outline-none focus:ring-1 focus:ring-stone-900"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-stone-900 text-white font-medium hover:bg-stone-800 transition-colors shadow-xs"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
