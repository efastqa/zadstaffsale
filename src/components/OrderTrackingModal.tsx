import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderStatus, EmployeeProfile } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { 
  getStoredMyOrderNumbers, 
  saveStoredMyOrderNumber, 
  cleanPhoneNumber, 
  isOrderOwnedByEmployee 
} from '../utils/storage';
import { 
  X, 
  Search, 
  CheckCircle2, 
  Clock, 
  Package, 
  Truck, 
  MapPin, 
  MessageCircle, 
  Printer, 
  Building,
  User,
  ShieldCheck,
  AlertCircle,
  Lock,
  ShoppingBag
} from 'lucide-react';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  currentEmployee?: EmployeeProfile;
  initialOrderNumber?: string;
  onPrintOrder: (order: Order) => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  currentEmployee,
  initialOrderNumber = '',
  onPrintOrder,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialOrderNumber);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [storedOrderNumbers, setStoredOrderNumbers] = useState<string[]>(getStoredMyOrderNumbers);

  // Filter orders that strictly belong to the current employee
  const myOrders = useMemo(() => {
    return orders.filter((o) => 
      isOrderOwnedByEmployee(o, currentEmployee, storedOrderNumbers)
    );
  }, [orders, currentEmployee, storedOrderNumbers]);

  // Determine active order
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Sync state when modal opens or initial order changes
  useEffect(() => {
    if (!isOpen) return;

    // Refresh stored order numbers from local storage
    const latestStored = getStoredMyOrderNumbers();
    setStoredOrderNumbers(latestStored);
    setSearchError(null);

    if (initialOrderNumber) {
      const match = orders.find(
        (o) => o.orderNumber.toLowerCase() === initialOrderNumber.toLowerCase()
      );
      if (match) {
        setActiveOrder(match);
        setSearchQuery(match.orderNumber);
        return;
      }
    }

    // Default to the employee's own most recent order, or null if none exist
    const userOrders = orders.filter((o) => 
      isOrderOwnedByEmployee(o, currentEmployee, latestStored)
    );

    if (userOrders.length > 0) {
      setActiveOrder(userOrders[0]);
      setSearchQuery(userOrders[0].orderNumber);
    } else {
      setActiveOrder(null);
      setSearchQuery('');
    }
  }, [isOpen, initialOrderNumber, orders, currentEmployee]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError(null);
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const queryDigits = cleanPhoneNumber(query);

    // Search specifically in the system
    const found = orders.find((o) => {
      // Match by exact or partial order number (e.g. "5403" or "ZAD-5403")
      if (o.orderNumber.toLowerCase() === query || o.orderNumber.toLowerCase().includes(query)) {
        return true;
      }
      // Match by phone number
      if (queryDigits.length >= 7) {
        const orderPhoneDigits = cleanPhoneNumber(o.employeePhone);
        if (orderPhoneDigits.includes(queryDigits) || queryDigits.includes(orderPhoneDigits)) {
          return true;
        }
      }
      // Match by exact Staff ID
      if (o.employeeId.toLowerCase() === query) {
        return true;
      }
      return false;
    });

    if (found) {
      setActiveOrder(found);
      saveStoredMyOrderNumber(found.orderNumber);
      setStoredOrderNumbers(getStoredMyOrderNumbers());
      setSearchError(null);
    } else {
      setSearchError(
        `No order found matching "${searchQuery}". Please check your Order Number (e.g. ZAD-5403) or Phone Number.`
      );
    }
  };

  const getStepStatus = (status: OrderStatus, step: number) => {
    const statusSteps: Record<OrderStatus, number> = {
      pending_whatsapp: 1,
      confirmed: 2,
      packing: 3,
      ready_for_dispatch: 4,
      out_for_delivery: 4,
      delivered: 5,
      cancelled: 0,
    };

    const currentStep = statusSteps[status] || 1;
    if (currentStep > step) return 'completed';
    if (currentStep === step) return 'active';
    return 'upcoming';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Privacy Indicator */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Staff Order Live Tracking</h3>
                <span className="text-[10px] bg-white/10 text-slate-300 px-2 py-0.5 rounded-full flex items-center gap-1 font-medium border border-white/10">
                  <Lock className="w-2.5 h-2.5 text-emerald-400" /> Private View
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Track your personal orders and department delivery progress
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

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Search Bar */}
          <form onSubmit={handleSearch} className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="Enter your Order # (e.g. ZAD-5403) or Phone number"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs transition-colors shadow-xs"
              >
                Track
              </button>
            </div>

            {searchError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{searchError}</span>
              </div>
            )}
          </form>

          {/* Quick Select: ONLY the logged-in employee's own orders */}
          {myOrders.length > 0 ? (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-700 font-bold flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-slate-500" />
                  My Orders ({myOrders.length})
                </span>
                <span className="text-[10px] text-slate-400">
                  {currentEmployee?.name ? `Logged in: ${currentEmployee.name}` : 'Saved on this device'}
                </span>
              </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {myOrders.map((o) => {
                  const isActive = activeOrder?.id === o.id;
                  const isDelivered = o.status === 'delivered';
                  
                  return (
                    <button
                      key={o.id}
                      onClick={() => {
                        setActiveOrder(o);
                        setSearchQuery(o.orderNumber);
                        setSearchError(null);
                      }}
                      className={`px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all flex items-center gap-2 flex-shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="font-mono font-bold">#{o.orderNumber}</span>
                      <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-semibold ${
                        isActive 
                          ? 'bg-white/20 text-white' 
                          : isDelivered
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {o.status.replace(/_/g, ' ')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl flex items-center gap-2.5 text-xs text-slate-500">
              <Lock className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                <strong>Private Tracking:</strong> Only orders linked to your phone number or placed from this browser will appear here.
              </span>
            </div>
          )}

          {/* Active Order Details */}
          {activeOrder ? (
            <div className="space-y-5 animate-in fade-in">
              {/* Order Status Header Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono font-bold bg-slate-900 text-white px-2.5 py-0.5 rounded-full">
                      #{activeOrder.orderNumber}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(activeOrder.createdAt).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 mt-1">
                    Employee: {activeOrder.employeeName}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600 mt-0.5">
                    <span className="font-semibold">{activeOrder.department}</span>
                    <span>•</span>
                    <span className="font-mono text-slate-500">{activeOrder.employeeId}</span>
                  </div>
                </div>

                <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Order Total
                  </span>
                  <div className="text-xl font-black text-slate-900">
                    QAR {activeOrder.grandTotal.toFixed(2)}
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100 inline-block mt-0.5">
                    Saved QAR {activeOrder.savingsTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Visual Progress Timeline */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Live Dispatch Timeline
                </h5>

                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-200 -z-0" />

                  <div className="space-y-6 relative z-10">
                    {/* Step 1 */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-xs transition-all ${
                          getStepStatus(activeOrder.status, 1) === 'completed' ||
                          getStepStatus(activeOrder.status, 1) === 'active'
                            ? 'bg-emerald-600 ring-2 ring-emerald-100'
                            : 'bg-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          Staff Order Placed & WhatsApp Message Logged
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Order queued for verification with ZAD internal sales team.
                        </div>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                          getStepStatus(activeOrder.status, 2) === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : getStepStatus(activeOrder.status, 2) === 'active'
                            ? 'bg-slate-900 text-white ring-2 ring-slate-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Clock className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          Sales Operations Confirmed
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Employee verification confirmed. Stock reserved at Industrial Area Warehouse.
                        </div>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                          getStepStatus(activeOrder.status, 3) === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : getStepStatus(activeOrder.status, 3) === 'active'
                            ? 'bg-slate-900 text-white ring-2 ring-slate-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Package className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          Warehouse Picking & Barcode Verification
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Items packed into staff sales carton with employee badge tag.
                        </div>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                          getStepStatus(activeOrder.status, 4) === 'completed'
                            ? 'bg-emerald-600 text-white'
                            : getStepStatus(activeOrder.status, 4) === 'active'
                            ? 'bg-slate-900 text-white ring-2 ring-slate-200'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <Truck className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          Dispatched for Department / Desk Delivery
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {activeOrder.assignedDispatcher ? (
                            <span className="font-semibold text-slate-900">
                              Assigned Dispatcher: {activeOrder.assignedDispatcher}
                            </span>
                          ) : (
                            'En route in ZAD internal distribution fleet van.'
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Step 5 */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-xs transition-all ${
                          getStepStatus(activeOrder.status, 5) === 'completed' ||
                          getStepStatus(activeOrder.status, 5) === 'active'
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                            : 'bg-slate-200 text-slate-500'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">
                          Delivered / Handed Over
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {activeOrder.deliveredAt
                            ? `Delivered on ${new Date(activeOrder.deliveredAt).toLocaleDateString('en-GB')}`
                            : 'Awaiting final staff sign-off.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Delivery Details & Items */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h6 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-slate-700" />
                    Delivery Destination
                  </h6>
                  <p className="text-slate-600">
                    <strong>Department:</strong> {activeOrder.department}
                  </p>
                  <p className="text-slate-600">
                    <strong>Mode:</strong> {activeOrder.deliveryMode.replace(/_/g, ' ')}
                  </p>
                  {activeOrder.deliveryNotes && (
                    <p className="text-slate-600">
                      <strong>Notes:</strong> {activeOrder.deliveryNotes}
                    </p>
                  )}
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2">
                  <h6 className="font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-700" />
                    Staff Contact
                  </h6>
                  <p className="text-slate-600">
                    <strong>Phone:</strong> {activeOrder.employeePhone}
                  </p>
                  <p className="text-slate-600">
                    <strong>Status:</strong>{' '}
                    <span className="capitalize font-bold text-slate-900">
                      {activeOrder.status.replace(/_/g, ' ')}
                    </span>
                  </p>
                  <p className="text-slate-600">
                    <strong>Support WhatsApp:</strong> {COMPANY_INFO.whatsappDisplay}
                  </p>
                </div>
              </div>

              {/* Itemized list */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 border-b border-slate-200">
                  Ordered Staff Items ({activeOrder.items.length})
                </div>
                <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
                  {activeOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Barcode: {item.barcode} • Qty: {item.quantity} ({item.unit})
                        </div>
                      </div>
                      <div className="font-bold text-slate-900">
                        QAR {item.totalPrice.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 pt-2">
                <a
                  href={`https://wa.me/${COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                    `Hi ZAD Staff Support, I would like an update on my order #${activeOrder.orderNumber} for ${activeOrder.employeeName} (${activeOrder.department}). Thank you!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-w-[200px] flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full text-xs shadow-xs transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Follow Up on WhatsApp ({COMPANY_INFO.whatsappDisplay})
                </a>

                <button
                  onClick={() => onPrintOrder(activeOrder)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-full text-xs transition-colors"
                >
                  <Printer className="w-4 h-4" /> Print Receipt Slip
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-200/60 flex items-center justify-center mx-auto text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800">Track Your Order</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Enter your <strong>Order Number</strong> (e.g. <span className="font-mono text-slate-700">ZAD-5403</span>) or your <strong>WhatsApp Phone Number</strong> in the box above to check live delivery progress.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
