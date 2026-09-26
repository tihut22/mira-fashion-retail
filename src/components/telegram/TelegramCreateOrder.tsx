import React, { useState } from 'react';
import { useRetail } from '../../context/RetailContext';
import { PaymentMethod } from '../../types';
import {
  Sparkles,
  User,
  ShoppingBag,
  CheckCircle2,
  Share2,
  Copy,
  DollarSign,
  Package,
  Camera,
  X,
  Check,
  Tag,
  Layers,
  Plane,
  Plus,
  Trash2,
  CopyPlus,
  CreditCard,
  AlertCircle,
} from 'lucide-react';
import { triggerTelegramHaptic, shareToTelegram } from '../../utils/telegramSdk';
import { compressImage } from '../../utils/imageCompression';

interface TelegramCreateOrderProps {
  initialTelegramUser?: {
    id?: number;
    first_name?: string;
    username?: string;
  } | null;
  onOrderCreated?: (orderNumber: string) => void;
}

export interface DraftOrderItem {
  id: string;
  productName: string;
  sheinSkuOrLink: string;
  categoryId: string;
  size: string;
  color: string;
  quantity: number;
  costPrice: number;
  sellingPrice: number;
  imageUrl?: string;
  imagePreview?: string | null;
}

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'One Size'];
const COMMON_COLORS = ['Black', 'White', 'Beige', 'Blue', 'Red', 'Pink'];

export const TelegramCreateOrder: React.FC<TelegramCreateOrderProps> = ({
  initialTelegramUser,
  onOrderCreated,
}) => {
  const {
    currentBusiness,
    categories,
    packageBatches,
    createBulkSheinOrder,
  } = useRetail();

  // Customer State
  const [customerName, setCustomerName] = useState(
    initialTelegramUser?.first_name || ''
  );
  const [customerPhone, setCustomerPhone] = useState('+251 9');
  const [customerTelegram, setCustomerTelegram] = useState(
    initialTelegramUser?.username ? `@${initialTelegramUser.username}` : ''
  );
  const [deliveryAddress, setDeliveryAddress] = useState('Addis Ababa, Bole');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TELEBIRR');
  const [notes, setNotes] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState(packageBatches[0]?.id || '');

  // BULK ITEMS STATE
  const [items, setItems] = useState<DraftOrderItem[]>([
    {
      id: `item-${Date.now()}-1`,
      productName: '',
      sheinSkuOrLink: '',
      categoryId: categories[0]?.id || '',
      size: 'M',
      color: 'Black',
      quantity: 1,
      costPrice: 1200,
      sellingPrice: 2400,
      imageUrl: '',
      imagePreview: null,
    },
  ]);

  // PRE-PAYMENT / ADVANCE DEPOSIT STATE
  const [prepaymentMode, setPrepaymentMode] = useState<'preset' | 'custom'>('preset');
  const [depositPercent, setDepositPercent] = useState<number>(50); // Default 50% deposit
  const [customAdvanceAmount, setCustomAdvanceAmount] = useState<number>(1200);

  // Submission Status
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);
  const [successReceipt, setSuccessReceipt] = useState<{
    orderNumber: string;
    total: number;
    advancePaid: number;
    remainingBalance: number;
    paymentStatus: string;
    customer: string;
    itemsCount: number;
    piecesCount: number;
    attachmentUrl?: string;
    rawText: string;
  } | null>(null);

  // Calculations across all items
  const totalSellingPrice = items.reduce(
    (sum, it) => sum + (it.sellingPrice || 0) * (it.quantity || 1),
    0
  );
  const totalCostPrice = items.reduce(
    (sum, it) => sum + (it.costPrice || 0) * (it.quantity || 1),
    0
  );
  const totalPiecesCount = items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  const estimatedProfit = totalSellingPrice - totalCostPrice;

  // Compute actual advance paid & remaining balance
  const calculatedAdvancePaid =
    prepaymentMode === 'preset'
      ? Math.round(totalSellingPrice * (depositPercent / 100))
      : Math.min(totalSellingPrice, Math.max(0, customAdvanceAmount || 0));

  const calculatedRemainingBalance = Math.max(0, totalSellingPrice - calculatedAdvancePaid);

  // Bulk Item Handlers
  const handleAddItem = () => {
    triggerTelegramHaptic('light');
    const newItem: DraftOrderItem = {
      id: `item-${Date.now()}-${items.length + 1}`,
      productName: '',
      sheinSkuOrLink: '',
      categoryId: categories[0]?.id || '',
      size: 'M',
      color: 'Black',
      quantity: 1,
      costPrice: 1200,
      sellingPrice: 2400,
      imageUrl: '',
      imagePreview: null,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const handleDuplicateItem = (itemToClone: DraftOrderItem) => {
    triggerTelegramHaptic('medium');
    const cloned: DraftOrderItem = {
      ...itemToClone,
      id: `item-${Date.now()}-${items.length + 1}`,
      productName: `${itemToClone.productName} (Copy)`.trim(),
    };
    setItems((prev) => [...prev, cloned]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    triggerTelegramHaptic('light');
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleUpdateItem = (id: string, updates: Partial<DraftOrderItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...updates } : it))
    );
  };

  const handleItemImageUpload = async (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file, 1024, 1024, 0.75);
        handleUpdateItem(id, {
          imagePreview: compressed,
          imageUrl: compressed,
        });
        triggerTelegramHaptic('medium');
      } catch (err) {
        console.error('Failed to compress order item image:', err);
      }
    }
  };

  // Submit Bulk Pre-Order
  const handleSubmitOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!customerName.trim()) {
      setErrorMessage('Please enter the customer name.');
      triggerTelegramHaptic('error');
      return;
    }
    if (!customerPhone.trim()) {
      setErrorMessage('Please enter the customer phone number.');
      triggerTelegramHaptic('error');
      return;
    }

    // Validate that at least one item has a name
    const invalidItemIndex = items.findIndex((it) => !it.productName.trim());
    if (invalidItemIndex !== -1) {
      setErrorMessage(`Please enter a product name for Item #${invalidItemIndex + 1}.`);
      triggerTelegramHaptic('error');
      return;
    }

    const invalidPriceIndex = items.findIndex((it) => !it.sellingPrice || it.sellingPrice <= 0);
    if (invalidPriceIndex !== -1) {
      setErrorMessage(`Please enter a valid selling price in ETB for Item #${invalidPriceIndex + 1}.`);
      triggerTelegramHaptic('error');
      return;
    }

    const res = createBulkSheinOrder({
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerTelegram: customerTelegram.trim() || undefined,
      deliveryAddress: deliveryAddress.trim(),
      paymentMethod,
      advancePaid: calculatedAdvancePaid,
      registeredBy: 'Telegram Mini App',
      notes: notes.trim() || undefined,
      packageBatchId: selectedBatchId || undefined,
      items: items.map((it) => ({
        productName: it.productName.trim(),
        sheinSkuOrLink: it.sheinSkuOrLink.trim() || `TG-PRE-${Date.now().toString().slice(-4)}`,
        categoryId: it.categoryId || categories[0]?.id || 'cat-1',
        size: it.size.trim() || 'One Size',
        color: it.color.trim() || 'Standard',
        quantity: it.quantity,
        costPrice: it.costPrice,
        sellingPrice: it.sellingPrice,
        imageUrl: (it.imagePreview || it.imageUrl)?.trim() || undefined,
      })),
    });

    if (!res.success || !res.order) {
      setErrorMessage(res.error || 'Failed to create pre-order.');
      triggerTelegramHaptic('error');
      return;
    }

    triggerTelegramHaptic('success');
    const order = res.order;

    // Generate clear, detailed Telegram receipt text
    const lines = [
      `✈️ *${currentBusiness.name} — Pre-Order Receipt*`,
      ``,
      `🔖 *Order #:* \`${order.orderNumber}\``,
      `👤 *Customer:* ${order.customerName} (${order.customerPhone})`,
      order.customerTelegram ? `📲 *Telegram:* ${order.customerTelegram}` : '',
      `📍 *Delivery:* ${order.deliveryAddress}`,
      ``,
      `📦 *Items Ordered (${order.items.length} ${order.items.length === 1 ? 'item' : 'items'}, ${totalPiecesCount} pcs):*`,
      ...order.items.map(
        (it, idx) =>
          `${idx + 1}. *${it.productName}* (${it.variantSummary}) × ${it.quantity} — ${(
            it.unitPrice * it.quantity
          ).toLocaleString()} ${currentBusiness.currency}`
      ),
      ``,
      `💰 *Total Order Amount:* ${order.total.toLocaleString()} ${currentBusiness.currency}`,
      `💳 *Pre-Payment (Deposit):* ${(order.advancePaid || 0).toLocaleString()} ${currentBusiness.currency} (${order.paymentMethod})`,
      `⏳ *Remaining Balance Due:* ${(order.remainingBalance || 0).toLocaleString()} ${currentBusiness.currency}`,
      `📊 *Payment Status:* ${order.paymentStatus.replace(/_/g, ' ')}`,
      notes ? `📝 *Notes:* ${notes}` : '',
      ``,
      `_Registered via Telegram Mini App · ${currentBusiness.name}_`,
    ].filter(Boolean);

    const receiptText = lines.join('\n');

    setSuccessReceipt({
      orderNumber: order.orderNumber,
      total: order.total,
      advancePaid: order.advancePaid || 0,
      remainingBalance: order.remainingBalance || 0,
      paymentStatus: order.paymentStatus,
      customer: order.customerName,
      itemsCount: order.items.length,
      piecesCount: totalPiecesCount,
      attachmentUrl: order.attachmentUrl || order.items[0]?.imageUrl || undefined,
      rawText: receiptText,
    });

    if (onOrderCreated) {
      onOrderCreated(order.orderNumber);
    }
  };

  const handleResetForm = () => {
    setSuccessReceipt(null);
    setErrorMessage(null);
    setItems([
      {
        id: `item-${Date.now()}-1`,
        productName: '',
        sheinSkuOrLink: '',
        categoryId: categories[0]?.id || '',
        size: 'M',
        color: 'Black',
        quantity: 1,
        costPrice: 1200,
        sellingPrice: 2400,
        imageUrl: '',
        imagePreview: null,
      },
    ]);
    setNotes('');
  };

  return (
    <div className="space-y-4 pb-24">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#24A1DE] to-[#1a85b8] text-white p-3.5 rounded-2xl shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white/20">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">Create Customer Pre-Order</h3>
            <p className="text-[11px] text-white/80 mt-0.5">
              Add multiple items at once & track advance deposit vs remaining balance
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full border border-white/20">
          Bulk Order
        </span>
      </div>

      {/* Success Modal / Card */}
      {successReceipt && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 shadow-sm space-y-3.5 animate-in fade-in">
          <div className="flex items-center gap-2.5 text-emerald-800">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="font-bold text-sm">Pre-Order Created Successfully!</h4>
              <p className="text-xs text-emerald-700">
                Order Ref: <span className="font-mono font-bold">{successReceipt.orderNumber}</span>
              </p>
            </div>
          </div>

          {/* Payment & Balance Summary Card */}
          <div className="bg-white rounded-xl p-3 border border-emerald-200 text-xs space-y-2 text-stone-700">
            <div className="flex justify-between items-center pb-1.5 border-b border-stone-100">
              <span className="text-stone-500">Customer:</span>
              <span className="font-semibold">{successReceipt.customer}</span>
            </div>
            <div className="flex justify-between items-center pb-1.5 border-b border-stone-100">
              <span className="text-stone-500">Items & Pieces:</span>
              <span className="font-semibold">
                {successReceipt.itemsCount} item(s) · {successReceipt.piecesCount} pcs
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500">Total Order Amount:</span>
              <span className="font-bold text-stone-900 font-mono">
                {successReceipt.total.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 p-2 rounded-lg">
              <span className="font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Pre-Payment (Deposit Paid):</span>
              </span>
              <span className="font-bold font-mono">
                {successReceipt.advancePaid.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-amber-900 bg-amber-50 p-2 rounded-lg border border-amber-200">
              <span className="font-bold flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                <span>Remaining Balance to Collect:</span>
              </span>
              <span className="font-bold font-mono text-sm text-amber-800">
                {successReceipt.remainingBalance.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
          </div>

          {/* Attached Photo Preview if Present */}
          {successReceipt.attachmentUrl && (
            <div className="bg-white rounded-xl p-2.5 border border-emerald-200 flex items-center gap-3">
              <img
                src={successReceipt.attachmentUrl}
                alt="Order attachment"
                className="w-12 h-12 rounded-lg object-cover bg-stone-100 border border-stone-200 shrink-0"
              />
              <div className="min-w-0">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                  Attached Item Photo / Receipt
                </span>
                <span className="text-[11px] text-stone-500 truncate block">
                  Saved with pre-order record
                </span>
              </div>
            </div>
          )}

          {/* Quick Telegram Share Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(successReceipt.rawText);
                triggerTelegramHaptic('success');
                setCopiedReceipt(true);
                setTimeout(() => setCopiedReceipt(false), 2500);
              }}
              className="px-3 py-2.5 bg-white hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-bold border border-stone-200 flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              {copiedReceipt ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  <span>Copy Receipt</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                triggerTelegramHaptic('medium');
                shareToTelegram(successReceipt.rawText);
              }}
              className="px-3 py-2.5 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share to Chat</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetForm}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold text-center cursor-pointer transition-colors"
          >
            + Create Another Pre-Order
          </button>
        </div>
      )}

      {/* Main Pre-Order Form */}
      {!successReceipt && (
        <form onSubmit={handleSubmitOrder} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Information Card */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-2 pb-2 border-b border-stone-100">
              <User className="w-4 h-4 text-[#24A1DE]" />
              <h3 className="font-bold text-stone-900 text-sm">Customer Details</h3>
            </div>

            <div className="space-y-2.5">
              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Mahlet Kebede"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+251 9..."
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50"
                  />
                </div>
                <div>
                  <label className="block text-stone-600 font-semibold mb-1">
                    Telegram @
                  </label>
                  <input
                    type="text"
                    value={customerTelegram}
                    onChange={(e) => setCustomerTelegram(e.target.value)}
                    placeholder="@username"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-stone-600 font-semibold mb-1">
                  Delivery Address
                </label>
                <input
                  type="text"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="e.g. Bole Atlas, near Edna Mall, Addis Ababa"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50"
                />
              </div>
            </div>
          </div>

          {/* BULK ITEMS LIST SECTION */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#24A1DE]" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Pre-Order Items ({items.length} {items.length === 1 ? 'item' : 'items'}, {totalPiecesCount} pcs)
                </h3>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-transform active:scale-95 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item</span>
              </button>
            </div>

            {items.map((item, index) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3 text-xs relative"
              >
                {/* Item Card Header */}
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-[#24A1DE]/10 text-[#24A1DE] flex items-center justify-center font-bold text-xs">
                      {index + 1}
                    </span>
                    <span className="font-bold text-stone-800">
                      {item.productName ? item.productName : `Item #${index + 1}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleDuplicateItem(item)}
                      title="Duplicate this item"
                      className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-100 cursor-pointer transition-colors"
                    >
                      <CopyPlus className="w-3.5 h-3.5" />
                    </button>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        title="Remove this item"
                        className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Item Fields */}
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-stone-600 font-semibold mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={item.productName}
                      onChange={(e) => handleUpdateItem(item.id, { productName: e.target.value })}
                      placeholder="e.g. Satin Cowl Neck Midi Dress"
                      className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Shein SKU / Web Link
                      </label>
                      <input
                        type="text"
                        value={item.sheinSkuOrLink}
                        onChange={(e) => handleUpdateItem(item.id, { sheinSkuOrLink: e.target.value })}
                        placeholder="e.g. sz230912345 or link"
                        className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 font-mono text-[11px]"
                      />
                    </div>
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Category
                      </label>
                      <select
                        value={item.categoryId}
                        onChange={(e) => handleUpdateItem(item.id, { categoryId: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Size & Color */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Size
                      </label>
                      <div className="flex gap-1 mb-1.5 overflow-x-auto pb-0.5">
                        {COMMON_SIZES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              handleUpdateItem(item.id, { size: s });
                              triggerTelegramHaptic('light');
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                              item.size === s
                                ? 'bg-[#24A1DE] text-white border-[#24A1DE]'
                                : 'bg-stone-50 text-stone-600 border-stone-200'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={item.size}
                        onChange={(e) => handleUpdateItem(item.id, { size: e.target.value })}
                        placeholder="Size"
                        className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Color
                      </label>
                      <div className="flex gap-1 mb-1.5 overflow-x-auto pb-0.5">
                        {COMMON_COLORS.map((c) => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => {
                              handleUpdateItem(item.id, { color: c });
                              triggerTelegramHaptic('light');
                            }}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors cursor-pointer whitespace-nowrap ${
                              item.color === c
                                ? 'bg-[#24A1DE] text-white border-[#24A1DE]'
                                : 'bg-stone-50 text-stone-600 border-stone-200'
                            }`}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                      <input
                        type="text"
                        value={item.color}
                        onChange={(e) => handleUpdateItem(item.id, { color: e.target.value })}
                        placeholder="Color"
                        className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 text-xs"
                      />
                    </div>
                  </div>

                  {/* Quantity & Unit Pricing */}
                  <div className="grid grid-cols-3 gap-2 items-end pt-1">
                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Quantity
                      </label>
                      <div className="flex items-center justify-between p-1.5 rounded-xl bg-stone-50 border border-stone-200">
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateItem(item.id, { quantity: Math.max(1, item.quantity - 1) });
                            triggerTelegramHaptic('light');
                          }}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center font-bold text-stone-700 active:scale-95"
                        >
                          -
                        </button>
                        <span className="font-bold text-xs font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateItem(item.id, { quantity: item.quantity + 1 });
                            triggerTelegramHaptic('light');
                          }}
                          className="w-6 h-6 rounded-lg bg-white border border-stone-300 flex items-center justify-center font-bold text-stone-700 active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Cost Price (ETB)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={item.costPrice || ''}
                        onChange={(e) => handleUpdateItem(item.id, { costPrice: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 font-mono text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-stone-600 font-semibold mb-1">
                        Selling Price * (ETB)
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        value={item.sellingPrice || ''}
                        onChange={(e) => handleUpdateItem(item.id, { sellingPrice: Number(e.target.value) })}
                        className="w-full p-2 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 font-mono font-bold text-stone-900 text-xs"
                      />
                    </div>
                  </div>

                  {/* Item Total Sub-banner */}
                  <div className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-stone-100 text-[11px] font-medium text-stone-700">
                    <span>
                      Item Subtotal: ({item.sellingPrice.toLocaleString()} × {item.quantity})
                    </span>
                    <span className="font-bold font-mono text-stone-900">
                      {(item.sellingPrice * item.quantity).toLocaleString()} {currentBusiness.currency}
                    </span>
                  </div>

                  {/* Photo / Screenshot for this item */}
                  <div className="pt-2 border-t border-stone-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-stone-600 font-semibold flex items-center gap-1.5 text-[11px]">
                        <Camera className="w-3.5 h-3.5 text-stone-400" />
                        <span>Item Photo / Screenshot</span>
                      </label>
                      {(item.imagePreview || item.imageUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            handleUpdateItem(item.id, { imagePreview: null, imageUrl: '' });
                            triggerTelegramHaptic('light');
                          }}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      <div className="relative w-12 h-12 rounded-xl bg-stone-100 border border-stone-300 overflow-hidden shrink-0 flex items-center justify-center">
                        {item.imagePreview || item.imageUrl ? (
                          <img
                            src={item.imagePreview || item.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="w-4 h-4 text-stone-300" />
                        )}
                      </div>

                      <div className="flex-1 space-y-1">
                        <label className="inline-flex items-center gap-1 px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold rounded-lg cursor-pointer text-[10px] transition-colors border border-stone-300">
                          <Camera className="w-3 h-3 text-stone-600" />
                          <span>Upload / Photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handleItemImageUpload(item.id, e)}
                          />
                        </label>
                        <input
                          type="text"
                          value={item.imagePreview ? '' : item.imageUrl || ''}
                          onChange={(e) =>
                            handleUpdateItem(item.id, {
                              imagePreview: null,
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder={item.imagePreview ? 'Using uploaded photo' : 'Or paste image URL...'}
                          disabled={!!item.imagePreview}
                          className="w-full px-2 py-0.5 text-[10px] rounded-lg border border-stone-300 bg-stone-50/50 disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Quick Add Button below items list */}
            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 border-2 border-dashed border-[#24A1DE]/40 hover:border-[#24A1DE] text-[#24A1DE] rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer bg-white transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Another Item to This Pre-Order</span>
            </button>
          </div>

          {/* PRE-PAYMENT & REMAINING BALANCE CARD */}
          <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-2xs space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#24A1DE]" />
                <h3 className="font-bold text-stone-900 text-sm">
                  Pre-Payment & Remaining Balance
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                Deposit Tracker
              </span>
            </div>

            {/* Quick Deposit Preset Buttons */}
            <div className="space-y-1.5">
              <label className="block text-stone-600 font-semibold">
                Customer Advance Deposit:
              </label>
              <div className="grid grid-cols-5 gap-1.5">
                {[
                  { label: '0%', val: 0, desc: 'Unpaid' },
                  { label: '30%', val: 30, desc: '30%' },
                  { label: '50%', val: 50, desc: '50% (Std)' },
                  { label: '70%', val: 70, desc: '70%' },
                  { label: '100%', val: 100, desc: 'Full' },
                ].map((p) => {
                  const isSelected = prepaymentMode === 'preset' && depositPercent === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => {
                        setPrepaymentMode('preset');
                        setDepositPercent(p.val);
                        triggerTelegramHaptic('light');
                      }}
                      className={`p-2 rounded-xl text-center border font-bold text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#24A1DE] text-white border-[#24A1DE] shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      <div>{p.label}</div>
                      <div className="text-[9px] font-normal opacity-80 mt-0.5">
                        {p.desc}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Or Custom Amount Button / Input */}
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPrepaymentMode('custom');
                      setCustomAdvanceAmount(Math.round(totalSellingPrice * 0.5));
                      triggerTelegramHaptic('light');
                    }}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] border cursor-pointer transition-colors ${
                      prepaymentMode === 'custom'
                        ? 'bg-[#24A1DE] text-white border-[#24A1DE]'
                        : 'bg-stone-100 text-stone-700 border-stone-300'
                    }`}
                  >
                    Custom ETB Amount
                  </button>
                  {prepaymentMode === 'custom' && (
                    <div className="flex-1 relative">
                      <input
                        type="number"
                        min="0"
                        max={totalSellingPrice}
                        value={customAdvanceAmount}
                        onChange={(e) => setCustomAdvanceAmount(Number(e.target.value))}
                        placeholder="e.g. 1500"
                        className="w-full p-2 pl-3 pr-10 rounded-xl border border-stone-300 font-mono font-bold text-stone-900 text-xs focus:outline-none focus:ring-1 focus:ring-[#24A1DE]"
                      />
                      <span className="absolute right-3 top-2 text-[10px] font-semibold text-stone-400">
                        {currentBusiness.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Live Payment & Balance Calculation Box */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-stone-600">Total Pre-Order:</span>
                <span className="font-bold text-stone-900 font-mono text-sm">
                  {totalSellingPrice.toLocaleString()} {currentBusiness.currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/80 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Advance Deposit Paid Now:</span>
                </span>
                <span className="font-bold font-mono text-sm text-emerald-700">
                  {calculatedAdvancePaid.toLocaleString()} {currentBusiness.currency}
                </span>
              </div>

              <div className="flex justify-between items-center text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-lg border border-amber-300">
                <span className="font-bold flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>Remaining to Pay on Arrival / Delivery:</span>
                </span>
                <span className="font-bold font-mono text-base text-amber-700">
                  {calculatedRemainingBalance.toLocaleString()} {currentBusiness.currency}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Deposit Payment Method:
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['TELEBIRR', 'CBE_BIRR', 'CASH_ON_DELIVERY', 'BANK_TRANSFER'] as PaymentMethod[]).map(
                  (pm) => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => {
                        setPaymentMethod(pm);
                        triggerTelegramHaptic('light');
                      }}
                      className={`p-2 rounded-xl text-left font-bold transition-all cursor-pointer ${
                        paymentMethod === pm
                          ? 'bg-[#24A1DE] text-white shadow-2xs'
                          : 'bg-stone-50 text-stone-700 border border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {pm.replace(/_/g, ' ')}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Optional Cargo Batch Link */}
            {packageBatches.length > 0 && (
              <div>
                <label className="block text-stone-600 font-semibold mb-1 flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-stone-400" />
                  <span>Assign to Cargo Flight Batch:</span>
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 text-xs"
                >
                  <option value="">No Batch / TBD</option>
                  {packageBatches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.batchCode} ({b.batchName || 'Cargo Batch'}) — {b.status}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-stone-600 font-semibold mb-1">
                Internal Notes & Deposit Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 50% deposit received via Telebirr ref #9821. Expected delivery 10 days."
                className="w-full p-2.5 rounded-xl border border-stone-300 focus:outline-none focus:ring-1 focus:ring-[#24A1DE] bg-stone-50/50 resize-none"
              />
            </div>
          </div>

          {/* Summary & Submit */}
          <div className="bg-stone-900 text-white rounded-2xl p-4 space-y-2 text-xs shadow-md">
            <div className="flex justify-between items-center text-stone-300">
              <span>Total Items:</span>
              <span className="font-mono">
                {items.length} {items.length === 1 ? 'item' : 'items'} ({totalPiecesCount} pcs)
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-400 text-[11px] pt-1 border-t border-stone-800">
              <span>Estimated Gross Profit:</span>
              <span className="font-mono">+{estimatedProfit.toLocaleString()} {currentBusiness.currency}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-stone-700 text-sm font-bold">
              <span>Total Pre-Order:</span>
              <span className="font-mono text-base text-[#24A1DE]">
                {totalSellingPrice.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-amber-300 pt-1">
              <span>Remaining to Collect:</span>
              <span className="font-mono font-bold">
                {calculatedRemainingBalance.toLocaleString()} {currentBusiness.currency}
              </span>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 bg-[#24A1DE] hover:bg-[#1f8fc6] text-white rounded-2xl font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-98"
          >
            <Sparkles className="w-5 h-5 text-amber-200" />
            <span>
              Confirm {items.length} {items.length === 1 ? 'Item' : 'Items'} Pre-Order ({totalSellingPrice.toLocaleString()} {currentBusiness.currency})
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
