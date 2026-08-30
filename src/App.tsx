import React, { useState, useEffect, useMemo } from 'react';
import { Product, Order, CartItem, EmployeeProfile, Department, OrderStatus } from './types';
import { 
  getStoredProducts, 
  saveStoredProducts, 
  getStoredOrders, 
  saveStoredOrders, 
  getStoredCart, 
  saveStoredCart, 
  getStoredEmployee, 
  saveStoredEmployee,
  getStoredAdminAuth,
  saveStoredAdminAuth,
  saveStoredMyOrderNumber
} from './utils/storage';
import { 
  subscribeToProducts, 
  subscribeToOrders, 
  saveFirebaseProduct, 
  saveFirebaseProductsBulk,
  deleteFirebaseProduct, 
  clearAllFirebaseProducts, 
  createFirebaseOrder, 
  updateFirebaseOrderStatus, 
  clearAllFirebaseOrders 
} from './services/firebase';
import { COMPANY_INFO } from './data/mockData';

// Components
import { Navbar } from './components/Navbar';
import { StaffSaleBanner } from './components/StaffSaleBanner';
import { ProductCard } from './components/ProductCard';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { CartDrawer } from './components/CartDrawer';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AdminPanel } from './components/AdminPanel';
import { PrintSlipModal } from './components/PrintSlipModal';
import { EmployeeProfileModal } from './components/EmployeeProfileModal';
import { BarcodeModalView } from './components/BarcodeModalView';
import { AdminPasswordModal } from './components/AdminPasswordModal';

// Icons
import { 
  Search, 
  Filter, 
  Sparkles, 
  ScanLine, 
  ShoppingBag, 
  Layers, 
  CheckCircle, 
  MessageCircle, 
  Flame,
  ArrowUpDown,
  Lock,
  Truck,
  LayoutGrid,
  Grid2X2,
  List
} from 'lucide-react';

export default function App() {
  // Primary State
  const [products, setProducts] = useState<Product[]>(getStoredProducts);
  const [orders, setOrders] = useState<Order[]>(getStoredOrders);
  const [cart, setCart] = useState<CartItem[]>(getStoredCart);
  const [employeeProfile, setEmployeeProfile] = useState<EmployeeProfile>(getStoredEmployee);
  const [isCloudConnected, setIsCloudConnected] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'large'>('grid');

  // Real-time Firestore Cloud Subscriptions
  useEffect(() => {
    let unsubscribeProducts: (() => void) | undefined;
    let unsubscribeOrders: (() => void) | undefined;

    try {
      unsubscribeProducts = subscribeToProducts(
        (cloudProducts) => {
          setIsCloudConnected(true);
          if (cloudProducts.length > 0) {
            setProducts(cloudProducts);
            saveStoredProducts(cloudProducts);
          } else {
            setProducts([]);
            saveStoredProducts([]);
          }
        },
        (error) => {
          console.warn('Firestore products offline or permission issue, using local storage:', error);
          setIsCloudConnected(false);
        }
      );

      unsubscribeOrders = subscribeToOrders(
        (cloudOrders) => {
          setIsCloudConnected(true);
          setOrders(cloudOrders);
          saveStoredOrders(cloudOrders);
        },
        (error) => {
          console.warn('Firestore orders offline, using local storage:', error);
          setIsCloudConnected(false);
        }
      );
    } catch (e) {
      console.warn('Using local fallback for database:', e);
      setIsCloudConnected(false);
    }

    return () => {
      if (unsubscribeProducts) unsubscribeProducts();
      if (unsubscribeOrders) unsubscribeOrders();
    };
  }, []);

  // Navigation & View
  const [activeView, setActiveView] = useState<'store' | 'admin' | 'tracking'>('store');
  const [isAdminPasswordModalOpen, setIsAdminPasswordModalOpen] = useState(false);
  const [highlightedProductId, setHighlightedProductId] = useState<string | null>(null);
  const [newOrderAlert, setNewOrderAlert] = useState<Order | null>(null);

  // Modals
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string>('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedBarcodeProduct, setSelectedBarcodeProduct] = useState<Product | null>(null);

  // Printable Document State
  const [printOrder, setPrintOrder] = useState<Order | null>(null);
  const [printDeptBatch, setPrintDeptBatch] = useState<{ department: Department; orders: Order[] } | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Store Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'recommended' | 'price_low' | 'price_high' | 'discount'>('recommended');
  const [onlySpecialClearance, setOnlySpecialClearance] = useState(false);

  // Pending orders calculation
  const pendingOrdersCount = useMemo(() => {
    return orders.filter((o) => ['pending_whatsapp', 'confirmed', 'packing'].includes(o.status)).length;
  }, [orders]);

  // Handle Admin Navigation with Password Check
  const handleSelectView = (view: 'store' | 'admin' | 'tracking') => {
    if (view === 'tracking') {
      setIsTrackingOpen(true);
      return;
    }

    if (view === 'admin') {
      const isAuth = getStoredAdminAuth();
      if (!isAuth) {
        setIsAdminPasswordModalOpen(true);
        return;
      }
      setActiveView('admin');
      return;
    }

    setActiveView('store');
  };

  // View updated item directly in store
  const handleViewInStore = (productId: string) => {
    setActiveView('store');
    setSelectedCategory('All');
    setSearchQuery('');
    setOnlySpecialClearance(false);
    setHighlightedProductId(productId);

    setTimeout(() => {
      const el = document.getElementById(`product-${productId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);

    setTimeout(() => {
      setHighlightedProductId(null);
    }, 6000);
  };

  // Lock Admin
  const handleLockAdmin = () => {
    saveStoredAdminAuth(false);
    setActiveView('store');
  };

  // Sync to local storage
  useEffect(() => {
    saveStoredProducts(products);
  }, [products]);

  useEffect(() => {
    saveStoredOrders(orders);
  }, [orders]);

  useEffect(() => {
    saveStoredCart(cart);
  }, [cart]);

  useEffect(() => {
    saveStoredEmployee(employeeProfile);
  }, [employeeProfile]);

  // Deep Link Query Params check
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const trackParam = params.get('track');
    const viewParam = params.get('view');
    const scanParam = params.get('scan');

    if (trackParam) {
      setTrackingOrderNumber(trackParam);
      setIsTrackingOpen(true);
    }

    if (viewParam === 'admin') {
      if (getStoredAdminAuth()) {
        setActiveView('admin');
      } else {
        setIsAdminPasswordModalOpen(true);
      }
    }

    if (scanParam === 'true') {
      setIsScannerOpen(true);
    }
  }, []);

  // Cart Handlers
  const handleAddToCart = (product: Product, quantity = 1) => {
    if (!product.stock || product.stock <= 0) {
      alert(`"${product.name}" is currently Sold Out.`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      }
      return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.product.id === productId) {
            const updated = item.quantity + delta;
            return updated > 0 ? { ...item, quantity: updated } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderPlaced = async (newOrder: Order) => {
    saveStoredMyOrderNumber(newOrder.orderNumber);
    setOrders((prev) => [newOrder, ...prev]);
    setNewOrderAlert(newOrder);
    try {
      setIsSyncing(true);
      await createFirebaseOrder(newOrder);
    } catch (e) {
      console.error('Failed to sync new order to Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Order Status Updates (from Admin)
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, assignedDispatcher?: string) => {
    const updates = {
      status,
      assignedDispatcher,
      deliveredAt: status === 'delivered' ? new Date().toISOString() : undefined,
    };

    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId) {
          return {
            ...o,
            status,
            assignedDispatcher: assignedDispatcher || o.assignedDispatcher,
            deliveredAt: status === 'delivered' ? new Date().toISOString() : o.deliveredAt,
            updatedAt: new Date().toISOString(),
          };
        }
        return o;
      })
    );

    try {
      setIsSyncing(true);
      await updateFirebaseOrderStatus(orderId, updates);
    } catch (e) {
      console.error('Failed to sync order update to Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Clear all orders (for starting completely fresh)
  const handleClearAllOrders = async () => {
    setOrders([]);
    try {
      setIsSyncing(true);
      await clearAllFirebaseOrders();
    } catch (e) {
      console.error('Failed to clear orders in Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Product Catalog Updates
  const handleAddProduct = async (newProduct: Product) => {
    setProducts((prev) => [newProduct, ...prev]);
    try {
      setIsSyncing(true);
      await saveFirebaseProduct(newProduct);
    } catch (e) {
      console.error('Failed to save product to Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleBulkAddProducts = async (newProductsList: Product[]) => {
    setProducts((prev) => [...newProductsList, ...prev]);
    try {
      setIsSyncing(true);
      await saveFirebaseProductsBulk(newProductsList);
    } catch (e) {
      console.error('Failed to bulk save products to Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpdateProduct = async (updated: Product) => {
    setProducts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    try {
      setIsSyncing(true);
      await saveFirebaseProduct(updated);
    } catch (e) {
      console.error('Failed to update product in Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    try {
      setIsSyncing(true);
      await deleteFirebaseProduct(productId);
    } catch (e) {
      console.error('Failed to delete product from Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearAllProducts = async () => {
    setProducts([]);
    try {
      setIsSyncing(true);
      await clearAllFirebaseProducts();
    } catch (e) {
      console.error('Failed to clear products from Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetDefaultProducts = async () => {
    const module = await import('./data/mockData');
    setProducts(module.INITIAL_PRODUCTS);
    try {
      setIsSyncing(true);
      await saveFirebaseProductsBulk(module.INITIAL_PRODUCTS);
    } catch (e) {
      console.error('Failed to reset default products in Firebase:', e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Print Handlers
  const handleTriggerPrintOrder = (order: Order) => {
    setPrintOrder(order);
    setPrintDeptBatch(null);
    setIsPrintModalOpen(true);
  };

  const handleTriggerPrintDeptBatch = (department: Department, deptOrders: Order[]) => {
    setPrintDeptBatch({ department, orders: deptOrders });
    setPrintOrder(null);
    setIsPrintModalOpen(true);
  };

  // Categories list derived from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => set.add(p.category));
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
        const matchesSpecial = !onlySpecialClearance || p.isStaffSpecial;
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          p.name.toLowerCase().includes(q) ||
          (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
          p.barcode.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q);

        return matchesCategory && matchesSpecial && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.staffPrice - b.staffPrice;
        if (sortBy === 'price_high') return b.staffPrice - a.staffPrice;
        if (sortBy === 'discount') {
          const discA = (a.originalPrice - a.staffPrice) / a.originalPrice;
          const discB = (b.originalPrice - b.staffPrice) / b.originalPrice;
          return discB - discA;
        }
        return 0; // recommended default
      });
  }, [products, selectedCategory, onlySpecialClearance, searchQuery, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-900 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeView={activeView}
        onSelectView={handleSelectView}
        onOpenCart={() => setIsCartOpen(true)}
        cart={cart}
        employeeProfile={employeeProfile}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Floating Real-time Admin Order Alert Notification */}
      {newOrderAlert && (
        <div className="sticky top-20 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3 animate-in fade-in slide-in-from-top-3">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border-2 border-emerald-500 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center shrink-0 animate-pulse">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded-full">
                    New Staff Order Received
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">
                    {newOrderAlert.orderNumber}
                  </span>
                </div>
                <div className="text-xs text-slate-300 mt-0.5">
                  <strong>{newOrderAlert.employeeName}</strong> ({newOrderAlert.department}) placed an order for{' '}
                  <strong className="text-emerald-400 font-mono">QAR {newOrderAlert.grandTotal.toFixed(2)}</strong> (
                  {newOrderAlert.items.length} items).
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => {
                  const orderNum = newOrderAlert.orderNumber;
                  setNewOrderAlert(null);
                  setTrackingOrderNumber(orderNum);
                  setIsTrackingOpen(true);
                }}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-full transition-colors shadow-xs flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Track Order #{newOrderAlert.orderNumber}
              </button>
              <button
                onClick={() => setNewOrderAlert(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                <CheckCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'admin' ? (
          /* ADMIN HUB */
          <AdminPanel
            orders={orders}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            products={products}
            onAddProduct={handleAddProduct}
            onBulkAddProducts={handleBulkAddProducts}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onClearAllProducts={handleClearAllProducts}
            onClearAllOrders={handleClearAllOrders}
            onResetDefaultProducts={handleResetDefaultProducts}
            onPrintOrder={handleTriggerPrintOrder}
            onPrintDepartmentBatch={handleTriggerPrintDeptBatch}
            onViewInStore={handleViewInStore}
            onAddToCart={handleAddToCart}
            onOpenBarcodeView={(p) => setSelectedBarcodeProduct(p)}
            onLockAdmin={handleLockAdmin}
            isCloudConnected={isCloudConnected}
            isSyncing={isSyncing}
          />
        ) : (
          /* EMPLOYEE STAFF SALES STORE */
          <div className="space-y-4 sm:space-y-6">
            {/* Banner & Hero Highlights */}
            <StaffSaleBanner
              onOpenTracking={() => setIsTrackingOpen(true)}
              onScrollToCatalog={() => {
                const el = document.getElementById('staff-catalog-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* Spotlight Banner when an item was just updated in Admin */}
            {highlightedProductId && (
              <div className="bg-emerald-900 text-white px-5 py-3 rounded-2xl shadow-lg border border-emerald-700 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in slide-in-from-top-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">
                      Spotlight: Newly Updated Item
                    </div>
                    <div className="text-[11px] text-emerald-200">
                      Product updated from Admin Hub is highlighted below for test ordering.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const item = products.find((p) => p.id === highlightedProductId);
                      if (item) handleAddToCart(item, 1);
                    }}
                    className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-full text-xs transition-colors"
                  >
                    Quick Add to Cart
                  </button>
                  <button
                    onClick={() => setHighlightedProductId(null)}
                    className="p-1 text-emerald-300 hover:text-white rounded-lg"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Catalog Filter Controls Bar */}
            <div id="staff-catalog-section" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-5 space-y-2.5 sm:space-y-4">
              {/* Search & Clearance Switch */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by product name, barcode (EAN-13), brand, or SKU..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Filter toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setOnlySpecialClearance(!onlySpecialClearance)}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all border ${
                      onlySpecialClearance
                        ? 'bg-rose-50 border-rose-200 text-rose-700 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Flame className={`w-3.5 h-3.5 ${onlySpecialClearance ? 'text-rose-600' : 'text-slate-400'}`} />
                    Special Subsidies
                  </button>

                  <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-2 rounded-full text-xs">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-transparent font-medium text-slate-700 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="recommended">Featured Staff Deals</option>
                      <option value="discount">Highest Discount %</option>
                      <option value="price_low">Price: Low to High</option>
                      <option value="price_high">Price: High to Low</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-thin">
                <span className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex-shrink-0 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-slate-700" />
                  Category:
                </span>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-full font-medium transition-all flex-shrink-0 text-xs ${
                      selectedCategory === cat
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Grid & Status */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Available Staff Items
                  </h2>
                  <span className="text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-full border border-slate-200">
                    {filteredProducts.length} items
                  </span>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  {/* Phone View Mode Switcher */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'grid'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="2-Column Compact Grid (Small Photos)"
                    >
                      <Grid2X2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Grid</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('list')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'list'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Compact List View (Fast Ordering)"
                    >
                      <List className="w-3.5 h-3.5" />
                      <span className="text-[11px]">List</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('large')}
                      className={`hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        viewMode === 'large'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Spacious Single Cards"
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Cards</span>
                    </button>
                  </div>

                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="text-xs font-semibold text-slate-900 hover:text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs flex items-center gap-1.5"
                  >
                    <ScanLine className="w-4 h-4 text-slate-700" />
                    <span className="hidden sm:inline">Scan Barcode</span>
                    <span className="sm:hidden">Scan</span>
                  </button>
                </div>
              </div>

              {products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4 shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-slate-800">
                      Staff Store Catalog Is Being Prepared
                    </h3>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      All sample items have been cleared. Head to the <strong>Admin Hub</strong> to bulk import or add your company's official products.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsAdminPasswordModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2"
                  >
                    Open Admin Hub to Add Products
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3 shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <ShoppingBag className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    No items match your filter
                  </h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try adjusting your search query, clearing category filters, or scan a carton barcode.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setOnlySpecialClearance(false);
                    }}
                    className="px-4 py-2 bg-slate-900 text-white rounded-full text-xs font-semibold hover:bg-slate-800 transition-colors"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                <div className={
                  viewMode === 'list'
                    ? 'flex flex-col gap-2.5'
                    : viewMode === 'large'
                    ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5'
                    : 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-5'
                }>
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                      employeeName={employeeProfile.name}
                      employeeId={employeeProfile.id}
                      department={employeeProfile.department}
                      onOpenBarcodeDetails={(p) => setSelectedBarcodeProduct(p)}
                      isHighlighted={product.id === highlightedProductId}
                      viewMode={viewMode}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-center sm:text-left">
            <span className="font-bold text-slate-900">
              {COMPANY_INFO.nameEn}
            </span>
            <span className="font-arabic font-semibold text-slate-700">
              {COMPANY_INFO.nameAr}
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span>{COMPANY_INFO.location}</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-700 font-semibold hover:underline"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              WhatsApp: {COMPANY_INFO.whatsappDisplay}
            </a>
            <button
              onClick={() => handleSelectView('admin')}
              className="text-slate-400 hover:text-slate-700 font-medium transition-colors flex items-center gap-1 text-[11px]"
              title="Admin & Dispatch Fulfillment (Authorized Staff Only)"
            >
              <Lock className="w-3.5 h-3.5" />
              Admin Portal
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Sticky Floating Cart Bar (Always clearly visible on all mobile displays when items are in cart) */}
      {cart.length > 0 && activeView === 'store' && (
        <div className="md:hidden fixed bottom-4 left-3 right-3 z-40 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-2xl p-3 shadow-2xl border border-slate-700/80 flex items-center justify-between transition-all active:scale-98"
          >
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900">
                  {cart.reduce((acc, item) => acc + item.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <span>Staff Cart</span>
                  <span className="text-[10px] font-normal text-amber-300">
                    ({cart.reduce((acc, item) => acc + item.quantity, 0)} {cart.reduce((acc, item) => acc + item.quantity, 0) === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 font-mono font-bold">
                  Total: QAR {cart.reduce((acc, item) => acc + item.product.staffPrice * item.quantity, 0).toFixed(2)}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-amber-400 text-slate-950 px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-xs shrink-0">
              <span>View Cart</span>
              <span className="text-sm font-black">→</span>
            </div>
          </button>
        </div>
      )}

      {/* MODALS */}
      {/* 0. Admin Password Protection Modal */}
      <AdminPasswordModal
        isOpen={isAdminPasswordModalOpen}
        onClose={() => setIsAdminPasswordModalOpen(false)}
        onSuccess={() => {
          setIsAdminPasswordModalOpen(false);
          setActiveView('admin');
        }}
      />

      {/* 1. Barcode & QR Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        products={products}
        onAddToCart={handleAddToCart}
        currentEmployeeName={employeeProfile.name}
        currentEmployeeId={employeeProfile.id}
        currentDepartment={employeeProfile.department}
      />

      {/* 2. Cart & WhatsApp Checkout Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderPlaced={handleOrderPlaced}
        employeeProfile={employeeProfile}
        onUpdateEmployeeProfile={(p) => setEmployeeProfile(p)}
        onOpenTracker={(orderNum) => {
          setTrackingOrderNumber(orderNum);
          setIsTrackingOpen(true);
        }}
        onPrintOrder={handleTriggerPrintOrder}
      />

      {/* 3. Real-time Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingOpen}
        onClose={() => {
          setIsTrackingOpen(false);
          setTrackingOrderNumber('');
        }}
        orders={orders}
        currentEmployee={employeeProfile}
        initialOrderNumber={trackingOrderNumber}
        onPrintOrder={handleTriggerPrintOrder}
      />

      {/* 4. Employee Profile Switcher Modal */}
      <EmployeeProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={employeeProfile}
        onSaveProfile={(p) => setEmployeeProfile(p)}
      />

      {/* 5. Barcode Pass Modal View */}
      <BarcodeModalView
        product={selectedBarcodeProduct}
        onClose={() => setSelectedBarcodeProduct(null)}
        onAddToCart={handleAddToCart}
        employeeName={employeeProfile.name}
        employeeId={employeeProfile.id}
        department={employeeProfile.department}
      />

      {/* 6. Printable Staff Slip & Batch Manifest Modal */}
      <PrintSlipModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        order={printOrder}
        departmentBatch={printDeptBatch}
      />
    </div>
  );
}
