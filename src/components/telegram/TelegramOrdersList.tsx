import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { Order, OrderStatus } from '../../types';
import {
  FileText,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  PackageCheck,
  XCircle,
  Share2,
  Copy,
  ChevronDown,
  Trash2,
  Phone,
  User,
  MapPin,
  ShoppingBag,
  Paperclip,
  Check,
  X,
  CreditCard,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { triggerTelegramHaptic, shareToTelegram } from '../../utils/telegramSdk';

export const TelegramOrdersList: React.FC = () => {
  const { currentBusiness, orders, updateOrderStatus, updateOrderPayment, deleteOrder } = useRetail();

  const [statusFilter, setStatusFilter] = useState<'ALL' | OrderStatus>('ALL');
  const [search, setSearch] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [selectedFullImage, setSelectedFullImage] = useState<string | null>(null);

  // Payment settle modal state
  const [settlingOrder, setSettlingOrder] = useState<Order | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);

  const filteredOrders = orders.filter((o) => {
    const matchStatus = statusFilter === 'ALL' || o.status === statusFilter;
    const matchSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    return matchStatus && matchSearch;
  });

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pending', bg: 'bg-amber-100 text-amber-800' };
      case 'CONFIRMED':
        return { label: 'Confirmed', bg: 'bg-blue-100 text-blue-800' };
      case 'PROCESSING':
        return { label: 'Processing', bg: 'bg-indigo-100 text-indigo-800' };
      case 'OUT_FOR_DELIVERY':
        return { label: 'Out for Delivery', bg: 'bg-purple-100 text-purple-800' };
      case 'DELIVERED':
        return { label: 'Delivered', bg: 'bg-emerald-100 text-emerald-800' };
      case 'CANCELLED':
        return { label: 'Cancelled', bg: 'bg-rose-100 text-rose-800' };
      default:
        return { label: status, bg: 'bg-stone-100 text-stone-800' };
    }
  };

  const handleShareReceipt = (order: Order) => {
    triggerTelegramHaptic('medium');
    const advance = order.advancePaid ?? (order.paymentStatus === 'PAID' ? order.total : 0);
    const balance = order.remainingBalance ?? (order.paymentStatus === 'PAID' ? 0 : Math.max(0, order.total - advance));

    const lines = [
      `🛍️ *${currentBusiness.name} — Order Receipt*`,
      ``,
      `🔖 *Order Number:* \`${order.orderNumber}\``,
      `👤 *Customer:* ${order.customerName} (${order.customerPhone})`,
      order.customerTelegram ? `📲 *Telegram:* ${order.customerTelegram}` : '',
      `📍 *Delivery:* ${order.deliveryAddress}`,
      `💳 *Payment Method:* ${order.paymentMethod.replace(/_/g, ' ')}`,
      `📦 *Order Status:* ${order.status.replace(/_/g, ' ')}`,
      ``,
      `*Ordered Items (${order.items.length} item(s)):*`,
      ...order.items.map(
        (i, idx) =>
          `${idx + 1}. ${i.productName} (${i.variantSummary}) × ${i.quantity} = ${(
            i.unitPrice * i.quantity
          ).toLocaleString()} ${currentBusiness.currency}`
      ),
      ``,
      `💰 *Total Amount:* ${order.total.toLocaleString()} ${currentBusiness.currency}`,
      `💳 *Pre-Payment (Deposit):* ${advance.toLocaleString()} ${currentBusiness.currency}`,
      balance > 0
        ? `⏳ *Remaining Balance Due:* ${balance.toLocaleString()} ${currentBusiness.currency}`
        : `✅ *Balance:* Paid in Full`,
      order.notes ? `📝 *Notes:* ${order.notes}` : '',
      ``,
      `_Thank you for shopping with ${currentBusiness.name}!_`,
    ].filter(Boolean);

    shareToTelegram(lines.join('\n'));
  };

  const handleCopyReceipt = (order: Order) => {
    triggerTelegramHaptic('success');
    const advance = order.advancePaid ?? (order.paymentStatus === 'PAID' ? order.total : 0);
    const balance = order.remainingBalance ?? (order.paymentStatus === 'PAID' ? 0 : Math.max(0, order.total - advance));

    const lines = [
      `🛍️ ${currentBusiness.name} — Order Receipt`,
      `Order #: ${order.orderNumber}`,
      `Customer: ${order.customerName} (${order.customerPhone})`,
      `Delivery: ${order.deliveryAddress}`,
      `Payment: ${order.paymentMethod.replace(/_/g, ' ')}`,
      `Total: ${order.total.toLocaleString()} ${currentBusiness.currency}`,
      `Deposit Paid: ${advance.toLocaleString()} ${currentBusiness.currency}`,
      `Remaining Due: ${balance.toLocaleString()} ${currentBusiness.currency}`,
      `Status: ${order.status}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedOrderId(order.id);
    setTimeout(() => setCopiedOrderId(null), 2500);
  };

  const handleOpenSettleModal = (order: Order) => {
    setSettlingOrder(order);
    // Default settle amount to full total (fully settled)
    setSettleAmount(order.total);
    triggerTelegramHaptic('light');
  };

  const handleSaveSettlePayment = () => {
    if (!settlingOrder) return;
    updateOrderPayment(settlingOrder.id, settleAmount);
    triggerTelegramHaptic('success');
    setSettlingOrder(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Search & Filter Header */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, phone..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-white text-xs focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs">
          {(
            [
              'ALL',
              'CONFIRMED',
              'PROCESSING',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
            ] as const
          ).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                statusFilter === st
                  ? 'bg-stone-900 text-white'
                  : 'bg-white text-stone-600 border border-stone-200'
              }`}
            >
              {st === 'ALL' ? `All Orders (${orders.length})` : st.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-2.5">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-stone-200 text-center space-y-1">
            <FileText className="w-8 h-8 text-stone-300 mx-auto" />
            <h4 className="font-bold text-stone-700 text-xs">No Orders Found</h4>
            <p className="text-[11px] text-stone-400">
              Orders created from Telegram or the storefront will appear here.
            </p>
          </div>
        ) : (
          filteredOrders.map((ord) => {
            const isExpanded = expandedOrderId === ord.id;
            const badge = getStatusBadge(ord.status);
            const advance = ord.advancePaid ?? (ord.paymentStatus === 'PAID' ? ord.total : 0);
            const remaining = ord.remainingBalance ?? (ord.paymentStatus === 'PAID' ? 0 : Math.max(0, ord.total - advance));
            const orderCost = ord.items.reduce((s, it) => s + ((it.costPrice || 0) * it.quantity), 0);
            const orderRevenue = ord.subtotal || ord.items.reduce((s, it) => s + (it.unitPrice * it.quantity), 0);
            const orderProfit = orderRevenue - orderCost;
            const orderMarginPercent = orderRevenue > 0 ? Math.round((orderProfit / orderRevenue) * 100) : 0;

            return (
              <div
                key={ord.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden"
              >
                {/* Header Row */}
                <div
                  onClick={() => {
                    triggerTelegramHaptic('light');
                    setExpandedOrderId(isExpanded ? null : ord.id);
                  }}
                  className="p-3.5 flex items-start justify-between cursor-pointer hover:bg-stone-50/50 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-mono font-bold text-xs text-stone-900">
                        {ord.orderNumber}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {ord.attachmentUrl && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-50 text-[#24A1DE] border border-sky-200 text-[10px] font-semibold">
                          <Paperclip className="w-2.5 h-2.5" />
                          <span>Photo</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-stone-600">
                      <User className="w-3.5 h-3.5 text-stone-400" />
                      <span className="font-semibold text-stone-900">{ord.customerName}</span>
                      <span className="text-stone-400">•</span>
                      <span>{ord.items.length} item(s)</span>
                    </div>
                  </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-[#24A1DE]">
                        {ord.total.toLocaleString()} {currentBusiness.currency}
                      </div>
                      <div className="flex flex-col items-end gap-0.5 mt-0.5">
                        {remaining > 0 ? (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                            Due: {remaining.toLocaleString()} {currentBusiness.currency}
                          </span>
                        ) : (
                          <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                            Paid in Full
                          </span>
                        )}
                        <span className="inline-block px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-mono font-semibold">
                          Profit: +{orderProfit.toLocaleString()} ({orderMarginPercent}%)
                        </span>
                      </div>
                    </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-3.5 pb-3.5 pt-2 border-t border-stone-100 space-y-3 text-xs bg-stone-50/40 animate-in fade-in">
                    {/* Items */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Ordered Items ({ord.items.length})
                      </span>
                      {ord.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 bg-white rounded-xl border border-stone-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {it.imageUrl ? (
                              <img
                                src={it.imageUrl}
                                alt={it.productName}
                                className="w-8 h-8 rounded-lg object-cover bg-stone-100 shrink-0 border border-stone-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 text-stone-400">
                                <ShoppingBag className="w-4 h-4 text-stone-400" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-stone-900 truncate text-[11px]">
                                {it.productName}
                              </p>
                              <p className="text-[10px] text-stone-500">
                                {it.variantSummary} × {it.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-mono font-bold text-stone-800 text-[11px]">
                            {(it.unitPrice * it.quantity).toLocaleString()}{' '}
                            {currentBusiness.currency}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Pre-Payment & Remaining Balance Info Box */}
                    <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-[#24A1DE]" />
                          <span>Pre-Payment & Remaining Balance</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenSettleModal(ord)}
                          className="px-2 py-0.5 rounded-lg bg-[#24A1DE]/10 hover:bg-[#24A1DE]/20 text-[#24A1DE] font-bold text-[10px] cursor-pointer transition-colors"
                        >
                          Update Payment
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 pt-1 text-center">
                        <div className="p-2 rounded-lg bg-stone-50 border border-stone-100">
                          <div className="text-[10px] text-stone-400">Total Order</div>
                          <div className="font-mono font-bold text-stone-900 text-xs mt-0.5">
                            {ord.total.toLocaleString()}
                          </div>
                        </div>

                        <div className="p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
                          <div className="text-[10px] text-emerald-700 font-medium">Deposit Paid</div>
                          <div className="font-mono font-bold text-emerald-800 text-xs mt-0.5">
                            {advance.toLocaleString()}
                          </div>
                        </div>

                        <div className={`p-2 rounded-lg border ${
                          remaining > 0
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-stone-50 border-stone-100'
                        }`}>
                          <div className={`text-[10px] font-medium ${
                            remaining > 0 ? 'text-amber-800' : 'text-stone-400'
                          }`}>
                            Remaining Due
                          </div>
                          <div className={`font-mono font-bold text-xs mt-0.5 ${
                            remaining > 0 ? 'text-amber-900' : 'text-stone-500'
                          }`}>
                            {remaining.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {remaining > 0 && (
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-stone-500">
                            Via {ord.paymentMethod.replace(/_/g, ' ')}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              updateOrderPayment(ord.id, ord.total);
                              triggerTelegramHaptic('success');
                            }}
                            className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Mark Settle Full Remaining</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Attached Photo / Payment Proof if present */}
                    {ord.attachmentUrl && (
                      <div className="p-2.5 bg-white rounded-xl border border-stone-200 space-y-1.5">
                        <div className="flex items-center justify-between text-stone-600 font-semibold text-[11px]">
                          <span className="flex items-center gap-1.5">
                            <Paperclip className="w-3.5 h-3.5 text-[#24A1DE]" />
                            <span>Attached Photo / Payment Slip</span>
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFullImage(ord.attachmentUrl!);
                            }}
                            className="text-[#24A1DE] text-[10px] font-bold hover:underline cursor-pointer"
                          >
                            View Full
                          </button>
                        </div>
                        <div
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFullImage(ord.attachmentUrl!);
                          }}
                          className="rounded-lg overflow-hidden border border-stone-200 max-h-40 bg-stone-50 cursor-pointer flex items-center justify-center group"
                        >
                          <img
                            src={ord.attachmentUrl}
                            alt="Attachment"
                            className="w-full max-h-40 object-contain group-hover:scale-102 transition-transform"
                          />
                        </div>
                      </div>
                    )}

                    {/* Customer & Address Details */}
                    <div className="p-2.5 bg-white rounded-xl border border-stone-200 space-y-1 text-[11px]">
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span className="font-mono">{ord.customerPhone}</span>
                        {ord.customerTelegram && (
                          <span className="text-[#24A1DE] font-mono ml-2">
                            {ord.customerTelegram}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-600">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span className="truncate">{ord.deliveryAddress}</span>
                      </div>
                      {ord.notes && (
                        <div className="text-stone-500 italic pt-1 border-t border-stone-100">
                          Note: "{ord.notes}"
                        </div>
                      )}
                    </div>

                    {/* Status Changer & Quick Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold text-stone-500">Status:</span>
                        <select
                          value={ord.status}
                          onChange={(e) => {
                            triggerTelegramHaptic('medium');
                            updateOrderStatus(ord.id, e.target.value as OrderStatus);
                          }}
                          className="bg-white border border-stone-300 rounded-lg px-2 py-1 text-xs font-semibold text-stone-800"
                        >
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="PROCESSING">Processing</option>
                          <option value="OUT_FOR_DELIVERY">Out for Delivery</option>
                          <option value="DELIVERED">Delivered</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleCopyReceipt(ord)}
                          className="p-1.5 bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 transition-colors cursor-pointer"
                          title="Copy receipt text"
                        >
                          {copiedOrderId === ord.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareReceipt(ord)}
                          className="px-2.5 py-1.5 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Share</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(ord)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Gross Orders Performance Summary Card */}
      {filteredOrders.length > 0 && (() => {
        const totalRevenue = filteredOrders.reduce((s, o) => s + o.total, 0);
        const totalCost = filteredOrders.reduce(
          (s, o) => s + o.items.reduce((sum, it) => sum + ((it.costPrice || 0) * it.quantity), 0),
          0
        );
        const totalSubtotal = filteredOrders.reduce((s, o) => s + (o.subtotal || 0), 0);
        const totalProfit = totalSubtotal - totalCost;
        const grossMargin = totalSubtotal > 0 ? Math.round((totalProfit / totalSubtotal) * 100) : 0;

        return (
          <div className="bg-stone-900 text-white rounded-2xl p-4 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-stone-200">Gross Orders Performance</span>
              <span className="font-mono text-stone-400">{filteredOrders.length} order(s)</span>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-stone-800 text-xs">
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Gross Revenue</span>
                <span className="font-bold font-mono text-white text-sm">
                  {totalRevenue.toLocaleString()} {currentBusiness.currency}
                </span>
                <span className="text-[10px] text-stone-400 block font-mono mt-0.5">
                  Cost: {totalCost.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-stone-400 block uppercase font-medium">Gross Profit</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  +{totalProfit.toLocaleString()} {currentBusiness.currency}
                </span>
                <span className="text-[10px] text-emerald-300/80 block font-mono mt-0.5">
                  +{grossMargin}% Gross Margin
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Settle / Update Payment Modal */}
      {settlingOrder && (
        <div
          onClick={() => setSettlingOrder(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-sm w-full p-4 border border-stone-200 shadow-2xl space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#24A1DE]" />
                <h4 className="font-bold text-stone-900 text-sm">
                  Update Payment / Balance
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSettlingOrder(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-stone-600">
                Order <span className="font-mono font-bold">{settlingOrder.orderNumber}</span> for{' '}
                <span className="font-semibold text-stone-900">{settlingOrder.customerName}</span>
              </p>

              <div className="p-3 bg-stone-50 rounded-xl space-y-1.5 border border-stone-200">
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Order Amount:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {settlingOrder.total.toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Currently Paid:</span>
                  <span className="font-mono font-semibold text-emerald-700">
                    {(settlingOrder.advancePaid || 0).toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-stone-600">Remaining Due:</span>
                  <span className="font-mono text-amber-800">
                    {(settlingOrder.remainingBalance || 0).toLocaleString()} {currentBusiness.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-stone-700 font-semibold mb-1">
                  New Total Amount Paid (ETB):
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max={settlingOrder.total}
                    value={settleAmount}
                    onChange={(e) => setSettleAmount(Number(e.target.value))}
                    className="w-full p-2.5 pl-3 pr-12 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 text-sm focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-semibold text-stone-400">
                    {currentBusiness.currency}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSettleAmount(settlingOrder.total)}
                  className="flex-1 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] cursor-pointer"
                >
                  Full Amount ({settlingOrder.total.toLocaleString()})
                </button>
                <button
                  type="button"
                  onClick={() => setSettleAmount(Math.round(settlingOrder.total * 0.5))}
                  className="flex-1 py-1.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 font-bold text-[11px] cursor-pointer"
                >
                  50% Deposit
                </button>
              </div>

              <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex justify-between items-center">
                <span>New Remaining Balance:</span>
                <span className="font-mono font-bold">
                  {Math.max(0, settlingOrder.total - settleAmount).toLocaleString()} {currentBusiness.currency}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setSettlingOrder(null)}
                className="px-3 py-2 rounded-xl bg-stone-100 text-stone-700 font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSettlePayment}
                className="px-4 py-2 rounded-xl bg-[#24A1DE] hover:bg-[#1f8fc6] text-white font-bold cursor-pointer"
              >
                Save Payment Update
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {selectedFullImage && (
        <div
          onClick={() => setSelectedFullImage(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative bg-white rounded-2xl max-w-lg w-full p-3 overflow-hidden shadow-2xl space-y-2"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-[#24A1DE]" />
                <span>Attached Photo / Payment Slip</span>
              </span>
              <button
                type="button"
                onClick={() => setSelectedFullImage(null)}
                className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden bg-stone-100 max-h-[70vh] flex items-center justify-center">
              <img
                src={selectedFullImage}
                alt="Full attachment preview"
                className="w-full max-h-[70vh] object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-2xl space-y-3 text-xs">
            <h4 className="font-bold text-stone-900 text-sm">Delete Order {deleteTarget.orderNumber}?</h4>
            <p className="text-stone-600">
              Are you sure you want to permanently delete this order for {deleteTarget.customerName}?
            </p>
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-3 py-1.5 rounded-lg bg-stone-100 text-stone-700 font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteOrder(deleteTarget.id);
                  setDeleteTarget(null);
                  triggerTelegramHaptic('medium');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
