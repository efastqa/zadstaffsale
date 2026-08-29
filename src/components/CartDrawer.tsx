import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { CartItem, Department, DeliveryMode, Order, EmployeeProfile } from '../types';
import { DEPARTMENTS, COMPANY_INFO, STAFF_ORDER_QUOTA } from '../data/mockData';
import { createWhatsAppOrderLink } from '../utils/whatsapp';
import { saveStoredMyOrderNumber } from '../utils/storage';
import { 
  X, 
  Trash2, 
  Plus, 
  Minus, 
  MessageCircle, 
  Truck, 
  Building2, 
  UserCheck, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight,
  ExternalLink,
  Printer,
  AlertTriangle,
  ShieldAlert,
  Ban
} from 'lucide-react';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  onOrderPlaced: (order: Order) => void;
  employeeProfile: EmployeeProfile;
  onUpdateEmployeeProfile: (profile: EmployeeProfile) => void;
  onOpenTracker: (orderNumber: string) => void;
  onPrintOrder: (order: Order) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderPlaced,
  employeeProfile,
  onUpdateEmployeeProfile,
  onOpenTracker,
  onPrintOrder,
}) => {
  const [employeeName, setEmployeeName] = useState(employeeProfile.name || '');
  const [employeeId, setEmployeeId] = useState(employeeProfile.id || '');
  const [department, setDepartment] = useState<Department>(employeeProfile.department || 'Sales & Key Accounts');
  const [phone, setPhone] = useState(employeeProfile.phone || '+974 ');
  const [deliveryMode, setDeliveryMode] = useState<DeliveryMode>('department_delivery');
  const [deliveryNotes, setDeliveryNotes] = useState(employeeProfile.deskLocation || '');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  // Totals calculations & Quota calculations
  const MAX_EMPLOYEE_QUOTA = STAFF_ORDER_QUOTA || 200;
  const subtotal = cart.reduce((sum, item) => sum + item.product.staffPrice * item.quantity, 0);
  const originalSubtotal = cart.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const totalSavings = originalSubtotal - subtotal;
  const deliveryFee = 0; // Free for employees
  const grandTotal = subtotal + deliveryFee;

  const isQuotaExceeded = grandTotal > MAX_EMPLOYEE_QUOTA;
  const quotaRemaining = Math.max(0, MAX_EMPLOYEE_QUOTA - grandTotal);
  const quotaOver = Math.max(0, grandTotal - MAX_EMPLOYEE_QUOTA);
  const quotaPercent = Math.min(100, (grandTotal / MAX_EMPLOYEE_QUOTA) * 100);

  const hasSoldOutItems = cart.some((item) => !item.product.stock || item.product.stock <= 0);

  const handleCheckout = (isDirectOnly = false) => {
    if (!employeeName.trim() || !employeeId.trim() || !phone.trim()) {
      alert('Please fill in your Employee Name, Staff ID, and WhatsApp Phone number.');
      return;
    }

    if (isQuotaExceeded) {
      alert(
        `⚠️ Order Quota Exceeded: Your order total is QAR ${grandTotal.toFixed(2)}, which exceeds the one-time employee quota limit of QAR ${MAX_EMPLOYEE_QUOTA.toFixed(2)} by QAR ${quotaOver.toFixed(2)}. Please reduce your items to proceed.`
      );
      return;
    }

    if (hasSoldOutItems) {
      alert('⚠️ One or more items in your cart are Sold Out. Please remove them to proceed with checkout.');
      return;
    }

    setIsSubmitting(true);

    // Save profile for future
    const updatedProfile: EmployeeProfile = {
      id: employeeId.trim(),
      name: employeeName.trim(),
      department,
      phone: phone.trim(),
      deskLocation: deliveryNotes,
    };
    onUpdateEmployeeProfile(updatedProfile);

    // Create Order Record
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderNumber = `ZAD-${randomNum}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      employeeName: employeeName.trim(),
      employeeId: employeeId.trim(),
      employeePhone: phone.trim(),
      department,
      deliveryMode,
      deliveryNotes: deliveryNotes.trim(),
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        barcode: item.product.barcode,
        quantity: item.quantity,
        unitPrice: item.product.staffPrice,
        regularPrice: item.product.originalPrice,
        totalPrice: item.product.staffPrice * item.quantity,
        unit: item.product.unit,
        imageUrl: item.product.imageUrl,
      })),
      subtotal,
      savingsTotal: totalSavings,
      deliveryFee: 0,
      grandTotal,
      status: 'confirmed',
      whatsappMessageSent: true,
    };

    saveStoredMyOrderNumber(orderNumber);
    onOrderPlaced(newOrder);
    setPlacedOrder(newOrder);
    onClearCart();
    setIsSubmitting(false);

    // Launch celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#002B66', '#059669', '#2563eb', '#f59e0b'],
      });
    } catch {
      // ignore
    }

    // Open WhatsApp in new tab unless direct only
    if (!isDirectOnly) {
      const waLink = createWhatsAppOrderLink(newOrder);
      window.open(waLink, '_blank');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-full sm:max-w-lg bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-4 sm:px-6 py-4 sm:py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <Truck className="w-4 h-4 text-slate-200" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Staff Order & Delivery</h3>
                <p className="text-[11px] text-slate-300">
                  Exclusive ZAD Employee Clearance
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Success Screen after placing order */}
          {placedOrder ? (
            <div className="flex-1 p-6 overflow-y-auto space-y-6 flex flex-col justify-center items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 uppercase tracking-wider">
                  Order Successfully Registered
                </span>
                <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
                  Order #{placedOrder.orderNumber}
                </h2>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your order has been queued in the ZAD Admin Panel for department delivery arrangement.
                </p>
              </div>

              {/* Summary Card */}
              <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Employee:</span>
                  <span className="font-semibold text-slate-800">
                    {placedOrder.employeeName} ({placedOrder.employeeId})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                    {placedOrder.department}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Delivery Arrangement:</span>
                  <span className="font-semibold text-slate-800 capitalize">
                    {placedOrder.deliveryMode.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-sm">
                  <span>Grand Total:</span>
                  <span className="text-slate-900">QAR {placedOrder.grandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="w-full space-y-2.5">
                <a
                  href={createWhatsAppOrderLink(placedOrder)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full shadow-xs transition-all text-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  Open WhatsApp Order ({COMPANY_INFO.whatsappDisplay})
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      onOpenTracker(placedOrder.orderNumber);
                      onClose();
                      setPlacedOrder(null);
                    }}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-full text-xs transition-colors"
                  >
                    Track Status Live <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onPrintOrder(placedOrder)}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 font-semibold rounded-full text-xs transition-colors"
                  >
                    <Printer className="w-3.5 h-3.5" /> Print Staff Slip
                  </button>
                </div>

                <button
                  onClick={() => {
                    setPlacedOrder(null);
                    onClose();
                  }}
                  className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Continue Shopping Staff Store
                </button>
              </div>
            </div>
          ) : (
            /* Cart and Checkout Form */
            <div className="flex-1 flex flex-col overflow-hidden">
              {cart.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                    <Truck className="w-7 h-7" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Your Staff Cart is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs">
                    Browse the staff sales catalog or scan carton barcodes to add subsidized items to your order.
                  </p>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
                  {/* ONE-TIME EMPLOYEE QUOTA PROGRESS BAR & STATUS */}
                  <div className={`p-4 rounded-2xl border transition-all ${
                    isQuotaExceeded 
                      ? 'bg-rose-50 border-rose-300 text-rose-900 shadow-sm' 
                      : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isQuotaExceeded ? (
                          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold truncate">
                          One-Time Employee Quota (حد الموظف)
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-xs font-black ${
                          isQuotaExceeded ? 'text-rose-700' : 'text-slate-900'
                        }`}>
                          QAR {grandTotal.toFixed(2)} / {MAX_EMPLOYEE_QUOTA}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isQuotaExceeded 
                            ? 'bg-rose-600' 
                            : quotaPercent > 80 
                            ? 'bg-amber-500' 
                            : 'bg-emerald-600'
                        }`}
                        style={{ width: `${Math.min(100, quotaPercent)}%` }}
                      />
                    </div>

                    {/* Subtext info */}
                    <div className="text-[11px] flex items-center justify-between">
                      {isQuotaExceeded ? (
                        <span className="text-rose-700 font-bold">
                          ⚠️ Exceeds QAR {MAX_EMPLOYEE_QUOTA} limit by QAR {quotaOver.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-600">
                          <strong>QAR {quotaRemaining.toFixed(2)}</strong> remaining under your staff quota
                        </span>
                      )}
                      <span className="text-slate-400 font-mono text-[10px]">
                        Max QAR {MAX_EMPLOYEE_QUOTA}
                      </span>
                    </div>
                  </div>

                  {/* Cart Items List */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Selected Items ({cart.reduce((a, b) => a + b.quantity, 0)})
                      </h4>
                      <button
                        onClick={onClearCart}
                        className="text-xs font-medium text-slate-500 hover:text-red-600 flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                      </button>
                    </div>

                    <div className="space-y-3">
                      {cart.map((item) => {
                        const isItemSoldOut = !item.product.stock || item.product.stock <= 0;
                        const isOverStock = item.quantity > item.product.stock;

                        return (
                          <div
                            key={item.product.id}
                            className={`flex items-center gap-3 p-3 bg-white border rounded-2xl shadow-xs transition-colors ${
                              isItemSoldOut 
                                ? 'border-rose-200 bg-rose-50/40' 
                                : 'border-slate-200'
                            }`}
                          >
                            <div className="relative w-14 h-14 rounded-xl border border-slate-200 bg-slate-50 flex-shrink-0 overflow-hidden flex items-center justify-center">
                              <img
                                src={item.product.imageUrl}
                                alt={item.product.name}
                                className={`w-full h-full object-cover ${
                                  isItemSoldOut ? 'grayscale opacity-50' : ''
                                }`}
                              />
                              {isItemSoldOut && (
                                <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center p-0.5">
                                  <span className="text-[8px] font-black text-white bg-rose-600 px-1 py-0.2 rounded uppercase">
                                    Sold Out
                                  </span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <h5 className="text-xs font-bold text-slate-900 line-clamp-1">
                                {item.product.name}
                              </h5>
                              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                                <span className="font-mono">{item.product.barcode}</span>
                                <span>• {item.product.unit}</span>
                                {isItemSoldOut && (
                                  <span className="text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 text-[10px]">
                                    Sold Out
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-extrabold text-slate-900">
                                  QAR {(item.product.staffPrice * item.quantity).toFixed(2)}
                                </span>
                                {isOverStock && (
                                  <span className="text-[10px] text-rose-600 font-bold">
                                    (Only {item.product.stock} available)
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1 border border-slate-200 rounded-full bg-slate-50 p-0.5">
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, -1)}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-slate-600 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center text-xs font-bold text-slate-800">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => onUpdateQuantity(item.product.id, 1)}
                                disabled={isItemSoldOut || item.quantity >= item.product.stock}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white text-slate-600 disabled:opacity-30 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <button
                              onClick={() => onRemoveItem(item.product.id)}
                              className="text-slate-400 hover:text-red-500 p-1 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Employee Verification Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <UserCheck className="w-4 h-4 text-slate-700" />
                      Employee Verification Details
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Full Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeName}
                          onChange={(e) => setEmployeeName(e.target.value)}
                          placeholder="e.g. Mohamed Al-Kuwari"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Staff ID *
                        </label>
                        <input
                          type="text"
                          required
                          value={employeeId}
                          onChange={(e) => setEmployeeId(e.target.value)}
                          placeholder="e.g. EMP-0412"
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Department (For Delivery Grouping) *
                      </label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <select
                          value={department}
                          onChange={(e) => setDepartment(e.target.value as Department)}
                          className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 focus:outline-none"
                        >
                          {DEPARTMENTS.map((dept) => (
                            <option key={dept} value={dept}>
                              {dept}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        WhatsApp Contact Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+974 5512 3456"
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Delivery Arrangement Selection */}
                  <div className="space-y-3">
                    <label className="block text-xs font-bold text-slate-700">
                      Select Delivery Method:
                    </label>

                    <div className="space-y-2">
                      <label
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          deliveryMode === 'department_delivery'
                            ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery_mode"
                          checked={deliveryMode === 'department_delivery'}
                          onChange={() => setDeliveryMode('department_delivery')}
                          className="mt-1 accent-slate-900"
                        />
                        <div>
                          <div className="text-xs font-bold">
                            🏢 Deliver to Department Hub (Recommended)
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Batch delivery to your department drop-off zone.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          deliveryMode === 'central_warehouse_pickup'
                            ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery_mode"
                          checked={deliveryMode === 'central_warehouse_pickup'}
                          onChange={() => setDeliveryMode('central_warehouse_pickup')}
                          className="mt-1 accent-slate-900"
                        />
                        <div>
                          <div className="text-xs font-bold">
                            🏭 Central Warehouse Staff Counter Pickup
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Industrial Area Gate 3 - Staff Collection Point.
                          </div>
                        </div>
                      </label>

                      <label
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          deliveryMode === 'individual_desk'
                            ? 'bg-slate-50 border-slate-900 text-slate-900 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="delivery_mode"
                          checked={deliveryMode === 'individual_desk'}
                          onChange={() => setDeliveryMode('individual_desk')}
                          className="mt-1 accent-slate-900"
                        />
                        <div>
                          <div className="text-xs font-bold">
                            📍 Direct Desk Handover
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Personal handover directly to your office workstation desk.
                          </div>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Specific Desk Location / Delivery Instructions:
                      </label>
                      <input
                        type="text"
                        value={deliveryNotes}
                        onChange={(e) => setDeliveryNotes(e.target.value)}
                        placeholder="e.g. Building A, Floor 2, Desk #S-12"
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Savings & Guarantee Banner */}
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    <div className="text-xs text-emerald-800">
                      <span className="font-bold">Exclusive Employee Pricing: </span>
                      You are saving <strong className="font-bold text-emerald-700">QAR {totalSavings.toFixed(2)}</strong> on this order!
                    </div>
                  </div>
                </div>
              )}

              {/* Order Footer Actions */}
              {cart.length > 0 && (
                <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 space-y-3">
                  {/* Totals */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Regular Retail Value:</span>
                      <span className="line-through">QAR {originalSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Staff Subsidy Savings:</span>
                      <span>- QAR {totalSavings.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Internal Delivery:</span>
                      <span className="text-emerald-600 font-semibold">FREE (Staff Benefit)</span>
                    </div>
                    <div className="flex justify-between text-slate-900 font-extrabold text-base border-t border-slate-200 pt-2">
                      <span>Staff Total:</span>
                      <span className="text-slate-900">QAR {grandTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Quota Exceeded Warning Banner */}
                  {isQuotaExceeded && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Quota Limit Exceeded:</strong> One-time employee order is capped at <strong>QAR {MAX_EMPLOYEE_QUOTA}.00</strong>. Your cart is <strong>QAR {grandTotal.toFixed(2)}</strong> (QAR {quotaOver.toFixed(2)} over limit). Please decrease quantity or remove items to place order.
                      </div>
                    </div>
                  )}

                  {hasSoldOutItems && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                      <Ban className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-bold">Sold Out Items in Cart:</strong> One or more items in your cart are no longer in stock. Please remove sold out items to proceed.
                      </div>
                    </div>
                  )}

                  {/* WhatsApp Order Button */}
                  <button
                    onClick={() => handleCheckout(false)}
                    disabled={isSubmitting || isQuotaExceeded || hasSoldOutItems}
                    className={`w-full flex items-center justify-center gap-2 py-3 px-4 text-white font-semibold rounded-full shadow-xs transition-all text-xs ${
                      isQuotaExceeded || hasSoldOutItems
                        ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                        : 'bg-emerald-600 hover:bg-emerald-500 active:scale-98'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    {isQuotaExceeded 
                      ? `Exceeds QAR ${MAX_EMPLOYEE_QUOTA} Staff Quota` 
                      : hasSoldOutItems
                      ? 'Remove Sold Out Items'
                      : `Place Order via WhatsApp (${COMPANY_INFO.whatsappDisplay})`}
                  </button>

                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={isSubmitting || isQuotaExceeded || hasSoldOutItems}
                    className={`w-full py-2 text-xs font-medium rounded-full transition-colors border border-dashed ${
                      isQuotaExceeded || hasSoldOutItems
                        ? 'border-slate-200 text-slate-400 cursor-not-allowed'
                        : 'border-slate-300 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Register in Admin System Only (Without WhatsApp)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
