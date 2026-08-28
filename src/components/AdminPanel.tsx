import React, { useState } from 'react';
import { Order, Product, Department, OrderStatus } from '../types';
import { DEPARTMENTS, COMPANY_INFO } from '../data/mockData';
import { FMCG_PRESETS, CURATED_IMAGES, generateEAN13Barcode } from '../data/fmcgPresets';
import { getStoredAdminPassword, saveStoredAdminPassword, saveStoredProducts } from '../utils/storage';
import { createSingleProductWhatsAppLink } from '../utils/whatsapp';
import { BulkProductModal } from './BulkProductModal';
import { EBSExportModal } from './EBSExportModal';
import { AdminSummaryDashboard } from './AdminSummaryDashboard';
import { compressImageFile } from '../utils/imageCompressor';
import { 
  Building2, 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Printer, 
  Download, 
  FileSpreadsheet,
  MessageCircle, 
  ExternalLink,
  DollarSign,
  TrendingUp,
  Boxes,
  Barcode,
  Users,
  Layers,
  Save,
  X,
  AlertCircle,
  Eye,
  ShoppingBag,
  Sparkles,
  Lock,
  KeyRound,
  Check,
  RotateCcw,
  Zap,
  ArrowRight,
  ShieldCheck,
  Sliders,
  Image as ImageIcon,
  Tag,
  Copy,
  ChevronRight,
  Upload,
  BarChart3
} from 'lucide-react';

interface AdminPanelProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: OrderStatus, assignedDispatcher?: string) => void;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onBulkAddProducts?: (products: Product[]) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onClearAllProducts?: () => void;
  onClearAllOrders?: () => void;
  onResetDefaultProducts?: () => void;
  onPrintOrder: (order: Order) => void;
  onPrintDepartmentBatch: (department: Department, orders: Order[]) => void;
  onViewInStore?: (productId: string) => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onOpenBarcodeView?: (product: Product) => void;
  onLockAdmin?: () => void;
  isCloudConnected?: boolean;
  isSyncing?: boolean;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  orders,
  onUpdateOrderStatus,
  products,
  onAddProduct,
  onBulkAddProducts,
  onUpdateProduct,
  onDeleteProduct,
  onClearAllProducts,
  onClearAllOrders,
  onResetDefaultProducts,
  onPrintOrder,
  onPrintDepartmentBatch,
  onViewInStore,
  onAddToCart,
  onOpenBarcodeView,
  onLockAdmin,
  isCloudConnected = true,
  isSyncing = false,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'delivery_matrix' | 'products' | 'settings'>('overview');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Product Edit Modal state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingProduct) {
      try {
        const compressedDataUrl = await compressImageFile(file, 600, 0.75);
        setEditingProduct({
          ...editingProduct,
          imageUrl: compressedDataUrl,
        });
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  // Bulk Product Importer state
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkSuccessCount, setBulkSuccessCount] = useState<number | null>(null);

  // Oracle EBS / Excel Export state
  const [isEBSModalOpen, setIsEBSModalOpen] = useState(false);

  // Recently updated/added item banner state
  const [lastUpdatedProduct, setLastUpdatedProduct] = useState<{ product: Product; action: 'added' | 'updated' } | null>(null);
  const [cartSuccessToast, setCartSuccessToast] = useState<string | null>(null);

  // Password Settings state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Dispatcher Assignment State
  const [dispatcherInputs, setDispatcherInputs] = useState<Record<string, string>>({});

  // Calculations for Stats
  const totalRevenue = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.grandTotal : sum), 0);
  const totalSavings = orders.reduce((sum, o) => (o.status !== 'cancelled' ? sum + o.savingsTotal : sum), 0);
  const pendingOrders = orders.filter((o) => ['pending_whatsapp', 'confirmed', 'packing'].includes(o.status));
  const readyDispatches = orders.filter((o) => ['ready_for_dispatch', 'out_for_delivery'].includes(o.status));
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    const matchesDept = selectedDeptFilter === 'all' || o.department === selectedDeptFilter;
    const matchesStatus = selectedStatusFilter === 'all' || o.status === selectedStatusFilter;
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.items.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesDept && matchesStatus && matchesSearch;
  });

  // Filtered Products for Catalog tab
  const [productCategoryFilter, setProductCategoryFilter] = useState<string>('all');
  const [productSearch, setProductSearch] = useState('');

  const filteredProducts = products.filter((p) => {
    const matchesCat = productCategoryFilter === 'all' || p.category === productCategoryFilter;
    const matchesQuery =
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.barcode.includes(productSearch) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.brand && p.brand.toLowerCase().includes(productSearch.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  const categories = Array.from(new Set(products.map((p) => p.category)));

  // Grouped by Department for Delivery Matrix
  const departmentOrdersMap = DEPARTMENTS.reduce((acc, dept) => {
    acc[dept] = orders.filter((o) => o.department === dept && o.status !== 'cancelled');
    return acc;
  }, {} as Record<Department, Order[]>);

  const exportCSV = () => {
    const headers = [
      'Order Number',
      'Date',
      'Employee Name',
      'Employee ID',
      'Department',
      'Phone',
      'Delivery Mode',
      'Items Count',
      'Staff Subtotal (QAR)',
      'Employee Savings (QAR)',
      'Grand Total (QAR)',
      'Status',
      'Assigned Dispatcher',
    ];

    const rows = orders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleDateString('en-GB'),
      `"${o.employeeName}"`,
      o.employeeId,
      `"${o.department}"`,
      o.employeePhone,
      o.deliveryMode,
      o.items.reduce((s, i) => s + i.quantity, 0),
      o.subtotal.toFixed(2),
      o.savingsTotal.toFixed(2),
      o.grandTotal.toFixed(2),
      o.status,
      `"${o.assignedDispatcher || ''}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZAD_Staff_Sales_Orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewProduct = () => {
    const randomBarcode = generateEAN13Barcode();
    setEditingProduct({
      id: `prod-${Date.now()}`,
      name: '',
      nameAr: '',
      sku: `ZAD-STF-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: randomBarcode,
      category: 'Beverages & Juices',
      brand: 'ZAD Distribution',
      description: '',
      originalPrice: 40,
      staffPrice: 20,
      stock: 30,
      unit: 'Carton (12 pcs)',
      imageUrl: CURATED_IMAGES[0].url,
      isStaffSpecial: true,
      clearanceReason: 'Special Employee Subsidy 50% Off',
    });
    setIsProductModalOpen(true);
  };

  const handleApplyPreset = (preset: typeof FMCG_PRESETS[0]) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      name: preset.name,
      nameAr: preset.nameAr,
      category: preset.category,
      brand: preset.brand,
      description: preset.description,
      originalPrice: preset.originalPrice,
      staffPrice: preset.staffPrice,
      stock: preset.stock,
      unit: preset.unit,
      imageUrl: preset.imageUrl,
      isStaffSpecial: preset.isStaffSpecial,
      clearanceReason: preset.clearanceReason,
    });
  };

  const handleSaveProduct = (andViewStore = false) => {
    if (!editingProduct || !editingProduct.name.trim()) return;

    const exists = products.some((p) => p.id === editingProduct.id);
    if (exists) {
      onUpdateProduct(editingProduct);
      setLastUpdatedProduct({ product: editingProduct, action: 'updated' });
    } else {
      onAddProduct(editingProduct);
      setLastUpdatedProduct({ product: editingProduct, action: 'added' });
    }

    const savedId = editingProduct.id;
    setIsProductModalOpen(false);
    setEditingProduct(null);

    if (andViewStore && onViewInStore) {
      onViewInStore(savedId);
    }
  };

  const handleQuickStockAdjust = (product: Product, delta: number) => {
    const newStock = Math.max(0, product.stock + delta);
    const updated = { ...product, stock: newStock };
    onUpdateProduct(updated);
    setLastUpdatedProduct({ product: updated, action: 'updated' });
  };

  const handleQuickToggleClearance = (product: Product) => {
    const updated = { ...product, isStaffSpecial: !product.isStaffSpecial };
    onUpdateProduct(updated);
    setLastUpdatedProduct({ product: updated, action: 'updated' });
  };

  const handleAddToCartTest = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product, 1);
      setCartSuccessToast(`Added 1x "${product.name}" to Staff Cart`);
      setTimeout(() => setCartSuccessToast(null), 3000);
    }
  };

  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordChangeSuccess(false);

    if (!newPassword.trim()) {
      setPasswordError('Password cannot be empty.');
      return;
    }

    if (newPassword.length < 4) {
      setPasswordError('Password should be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    saveStoredAdminPassword(newPassword.trim());
    setPasswordChangeSuccess(true);
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification for Cart Actions */}
      {cartSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{cartSuccessToast}</span>
          <button
            onClick={() => setCartSuccessToast(null)}
            className="p-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Banner & Security Actions */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden border border-slate-800 shadow-xs">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-3 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Authenticated Admin Session
              </span>
              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1.5 ${
                isCloudConnected 
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isCloudConnected ? 'bg-blue-400 animate-pulse' : 'bg-amber-400'}`}></span>
                {isSyncing ? 'Syncing...' : isCloudConnected ? 'Free Cloud Database Live' : 'Local Fallback'}
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">
              ZAD Staff Sales Fulfillment Hub
            </h1>
            <p className="text-xs text-slate-300 max-w-xl mt-1">
              Manage WhatsApp orders, arrange department batch dispatches, configure subsidized rates, and test live staff ordering.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEBSModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full text-xs transition-all shadow-xs border border-blue-400/40"
              title="Export all orders with Item Codes, Descriptions, Qty, and Employee Details for Oracle EBS / Excel"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              <span>EBS / Excel Export</span>
            </button>

            <button
              onClick={handleOpenNewProduct}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full text-xs transition-colors shadow-xs"
            >
              <Plus className="w-4 h-4" /> Add Staff Item
            </button>

            {onLockAdmin && (
              <button
                onClick={onLockAdmin}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-full text-xs font-semibold transition-colors"
                title="Lock Admin Hub and return to Store"
              >
                <Lock className="w-3.5 h-3.5" /> Lock & Exit
              </button>
            )}
          </div>
        </div>
      </div>

      {/* RECENTLY UPDATED ITEM LIVE ORDER BAR - Allows instant viewing & test ordering */}
      {lastUpdatedProduct && (
        <div className="bg-white border-2 border-emerald-500/40 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative">
              <img
                src={lastUpdatedProduct.product.imageUrl}
                alt={lastUpdatedProduct.product.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-200 bg-slate-50"
              />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[9px] font-bold">
                ✓
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 bg-emerald-100 text-emerald-800 rounded-full">
                  {lastUpdatedProduct.action === 'added' ? 'New Item Added' : 'Item Updated'}
                </span>
                <span className="text-xs font-mono text-slate-500">
                  {lastUpdatedProduct.product.sku} • Stock: {lastUpdatedProduct.product.stock}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-0.5 line-clamp-1">
                {lastUpdatedProduct.product.name}
              </h4>
              <div className="flex items-center gap-2 text-xs mt-0.5">
                <span className="font-extrabold text-slate-900">
                  QAR {lastUpdatedProduct.product.staffPrice.toFixed(2)}
                </span>
                <span className="text-slate-400 line-through text-[11px]">
                  QAR {lastUpdatedProduct.product.originalPrice.toFixed(2)}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 rounded-full border border-emerald-100">
                  Save QAR {(lastUpdatedProduct.product.originalPrice - lastUpdatedProduct.product.staffPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {onViewInStore && (
              <button
                onClick={() => onViewInStore(lastUpdatedProduct.product.id)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-full shadow-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View & Order in Store
              </button>
            )}

            <button
              onClick={() => handleAddToCartTest(lastUpdatedProduct.product)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-full transition-colors"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> Add to Cart Test
            </button>

            <a
              href={createSingleProductWhatsAppLink(
                lastUpdatedProduct.product,
                COMPANY_INFO.whatsappNumber,
                'ZAD Admin Tester'
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-full transition-colors shadow-xs"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Order
              <ExternalLink className="w-3 h-3 opacity-80" />
            </a>

            <button
              onClick={() => setLastUpdatedProduct(null)}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-900 shrink-0">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">Staff Sales Revenue</div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              QAR {totalRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> {orders.length} orders placed
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-emerald-600 shrink-0">
            <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">Total Staff Savings</div>
            <div className="text-lg sm:text-xl font-black text-emerald-600">
              QAR {totalSavings.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              Subsidies granted
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">Pending Packing</div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              {pendingOrders.length} Orders
            </div>
            <div className="text-[11px] text-amber-700 font-medium">
              Awaiting picking
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-slate-100 flex items-center justify-center text-blue-600 shrink-0">
            <Truck className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-500 truncate">Dept Dispatches</div>
            <div className="text-lg sm:text-xl font-black text-slate-900">
              {readyDispatches.length} In Transit
            </div>
            <div className="text-[11px] text-slate-500">
              {deliveredOrders.length} delivered
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white p-1.5 sm:px-4 rounded-2xl shadow-xs gap-1 sm:gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-slate-900 text-slate-900 bg-slate-50/80 sm:bg-transparent rounded-t-xl sm:rounded-none'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Executive Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-slate-900 text-slate-900 bg-slate-50/80 sm:bg-transparent rounded-t-xl sm:rounded-none'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Boxes className="w-4 h-4 shrink-0" />
          <span>Orders ({orders.length})</span>
          {pendingOrders.length > 0 && (
            <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] animate-pulse shadow-xs">
              {pendingOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('delivery_matrix')}
          className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'delivery_matrix'
              ? 'border-slate-900 text-slate-900 bg-slate-50/80 sm:bg-transparent rounded-t-xl sm:rounded-none'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Department Delivery Planner</span>
          <span className="sm:hidden">Deliveries</span>
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-slate-900 text-slate-900 bg-slate-50/80 sm:bg-transparent rounded-t-xl sm:rounded-none'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Barcode className="w-4 h-4 shrink-0" />
          <span>Catalog & Stock ({products.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-3 sm:px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
            activeTab === 'settings'
              ? 'border-slate-900 text-slate-900 bg-slate-50/80 sm:bg-transparent rounded-t-xl sm:rounded-none'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <KeyRound className="w-4 h-4 shrink-0" />
          <span>Security</span>
        </button>
      </div>

      {/* TAB 0: EXECUTIVE SUMMARY & ANALYTICS DASHBOARD */}
      {activeTab === 'overview' && (
        <AdminSummaryDashboard
          orders={orders}
          products={products}
          onNavigateTab={(tab) => setActiveTab(tab)}
          onOpenEBSExport={() => setIsEBSModalOpen(true)}
        />
      )}

      {/* TAB 1: ORDER MANAGEMENT */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 space-y-5">
          {/* Active Orders Notification Alert */}
          {pendingOrders.length > 0 && (
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-950 animate-in fade-in">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm shrink-0 animate-bounce">
                  🔔
                </div>
                <div>
                  <div className="font-bold text-xs">
                    {pendingOrders.length} New Staff Order{pendingOrders.length > 1 ? 's' : ''} Awaiting Action
                  </div>
                  <div className="text-[11px] text-amber-800">
                    Incoming orders submitted from employee staff store are ready for picking and dispatch.
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  onClick={() => setSelectedStatusFilter('confirmed')}
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-full transition-colors text-center shadow-2xs"
                >
                  Filter Pending ({pendingOrders.length})
                </button>
              </div>
            </div>
          )}

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
            <div className="relative flex-1 max-w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by Order #, Staff Name, ID, or Item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedDeptFilter}
                  onChange={(e) => setSelectedDeptFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer w-full text-xs"
                >
                  <option value="all">All Departments</option>
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={selectedStatusFilter}
                  onChange={(e) => setSelectedStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-700 font-semibold focus:outline-none cursor-pointer w-full text-xs"
                >
                  <option value="all">All Statuses</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="packing">Packing</option>
                  <option value="ready_for_dispatch">Ready for Dispatch</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => setIsEBSModalOpen(true)}
                className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold px-3 py-1.5 rounded-xl text-xs transition-colors"
                title="Export filtered orders for Oracle EBS"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-700" />
                <span>Export EBS Sheet</span>
              </button>
            </div>
          </div>

          {/* Responsive Orders View: Mobile Stacked Cards on <lg, Full Table on lg+ */}
          {filteredOrders.length === 0 ? (
            <div className="border border-slate-200 rounded-2xl p-10 text-center text-slate-400 text-xs">
              No orders match the selected filters.
            </div>
          ) : (
            <>
              {/* MOBILE STACKED CARDS VIEW (Block on mobile, hidden on lg screens) */}
              <div className="block lg:hidden space-y-3">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3 text-xs shadow-2xs hover:border-slate-300 transition-colors"
                  >
                    {/* Header Row: Order Number, Badge, Time, and Actions */}
                    <div className="flex items-center justify-between border-b border-slate-200/70 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-slate-900 text-sm">
                          #{order.orderNumber}
                        </span>
                        {(order.status === 'confirmed' || order.status === 'pending_whatsapp') && (
                          <span className="px-2 py-0.5 text-[9px] font-black uppercase bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                            NEW
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <button
                        onClick={() => onPrintOrder(order)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg shadow-2xs flex items-center gap-1 text-[11px] font-semibold"
                        title="Print Slip"
                      >
                        <Printer className="w-3.5 h-3.5" /> Slip
                      </button>
                    </div>

                    {/* Employee & Department */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/60">
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Employee</div>
                        <div className="font-bold text-slate-900 truncate">{order.employeeName}</div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {order.employeeId} • {order.employeePhone}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-400 uppercase font-semibold">Department</div>
                        <span className="inline-block mt-0.5 px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
                          {order.department}
                        </span>
                      </div>
                    </div>

                    {/* Items Ordered List */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 uppercase font-semibold flex justify-between">
                        <span>Items List</span>
                        <span>{order.items.reduce((s, i) => s + i.quantity, 0)} total units</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/60 text-slate-700 divide-y divide-slate-100">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="py-1 first:pt-0 last:pb-0 flex justify-between items-center text-[11px]">
                            <span className="font-medium text-slate-800 line-clamp-1 pr-2">
                              {item.quantity}x {item.productName}
                            </span>
                            <span className="font-mono font-bold text-slate-900 shrink-0">
                              QAR {(item.staffPrice * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total, Delivery Mode & Status Controls */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-200/70">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">
                            Total Payable (Staff Subsidized)
                          </div>
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-slate-900 font-mono">
                              QAR {order.grandTotal.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-semibold">
                              Saved QAR {order.savingsTotal.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="text-[10px] text-slate-400 uppercase font-semibold">Handover Mode</div>
                          <div className="text-slate-800 capitalize font-semibold text-[11px]">
                            {order.deliveryMode.replace(/_/g, ' ')}
                          </div>
                        </div>
                      </div>

                      {order.deliveryNotes && (
                        <div className="text-[10px] text-slate-500 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60">
                          <strong className="text-amber-800">Note:</strong> {order.deliveryNotes}
                        </div>
                      )}

                      {/* Status Dropdown */}
                      <div className="pt-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                          Update Fulfillment Status
                        </label>
                        <select
                          value={order.status}
                          onChange={(e) =>
                            onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                          }
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none ${
                            order.status === 'delivered'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : order.status === 'out_for_delivery'
                              ? 'bg-blue-50 text-blue-800 border-blue-300'
                              : order.status === 'ready_for_dispatch'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                              : order.status === 'packing'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-white text-slate-700 border-slate-300'
                          }`}
                        >
                          <option value="confirmed">Confirmed (Pending Packing)</option>
                          <option value="packing">Packing Items</option>
                          <option value="ready_for_dispatch">Ready for Dispatch</option>
                          <option value="out_for_delivery">Out for Delivery</option>
                          <option value="delivered">Delivered to Employee</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        {order.assignedDispatcher && (
                          <div className="text-[10px] text-slate-500 font-medium mt-1">
                            Assigned Runner: {order.assignedDispatcher}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP TABLE VIEW (Hidden on mobile, block on lg+) */}
              <div className="hidden lg:block overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                      <th className="p-3.5">Order #</th>
                      <th className="p-3.5">Employee</th>
                      <th className="p-3.5">Department</th>
                      <th className="p-3.5">Items</th>
                      <th className="p-3.5">Total (QAR)</th>
                      <th className="p-3.5">Delivery Arrangement</th>
                      <th className="p-3.5">Status & Dispatch</th>
                      <th className="p-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <span>#{order.orderNumber}</span>
                            {(order.status === 'confirmed' || order.status === 'pending_whatsapp') && (
                              <span className="px-1.5 py-0.2 text-[9px] font-black uppercase bg-emerald-500 text-slate-950 rounded-full animate-pulse">
                                NEW
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-sans">
                            {new Date(order.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-slate-900">{order.employeeName}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {order.employeeId} • {order.employeePhone}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-semibold text-[11px] border border-slate-200">
                            {order.department}
                          </span>
                        </td>

                        <td className="p-3.5 max-w-[200px]">
                          <div className="line-clamp-2 text-slate-700">
                            {order.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {order.items.reduce((s, i) => s + i.quantity, 0)} total units
                          </div>
                        </td>

                        <td className="p-3.5 font-bold">
                          <div className="text-slate-900 font-black">
                            QAR {order.grandTotal.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            Saved QAR {order.savingsTotal.toFixed(2)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="text-slate-800 capitalize font-medium">
                            {order.deliveryMode.replace(/_/g, ' ')}
                          </div>
                          {order.deliveryNotes && (
                            <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                              {order.deliveryNotes}
                            </div>
                          )}
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1.5">
                            <select
                              value={order.status}
                              onChange={(e) =>
                                onUpdateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border focus:outline-none ${
                                order.status === 'delivered'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                  : order.status === 'out_for_delivery'
                                  ? 'bg-blue-50 text-blue-800 border-blue-300'
                                  : order.status === 'ready_for_dispatch'
                                  ? 'bg-indigo-50 text-indigo-800 border-indigo-300'
                                  : order.status === 'packing'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-700 border-slate-300'
                              }`}
                            >
                              <option value="confirmed">Confirmed</option>
                              <option value="packing">Packing</option>
                              <option value="ready_for_dispatch">Ready for Dispatch</option>
                              <option value="out_for_delivery">Out for Delivery</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>

                            {order.assignedDispatcher && (
                              <div className="text-[10px] text-slate-500 font-medium">
                                Runner: {order.assignedDispatcher}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3.5 text-right space-x-1 whitespace-nowrap">
                          <button
                            onClick={() => onPrintOrder(order)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Print Slip"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: DEPARTMENT DELIVERY PLANNER */}
      {activeTab === 'delivery_matrix' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div>
            <h3 className="font-bold text-base text-slate-900">
              Department Batch Delivery & Van Allocation Matrix
            </h3>
            <p className="text-xs text-slate-500">
              Group orders by ZAD department for consolidated internal delivery manifests.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPARTMENTS.map((dept) => {
              const deptOrders = departmentOrdersMap[dept] || [];
              const totalDeptAmount = deptOrders.reduce((s, o) => s + o.grandTotal, 0);
              const totalItemsCount = deptOrders.reduce(
                (s, o) => s + o.items.reduce((sum, i) => sum + i.quantity, 0),
                0
              );

              return (
                <div
                  key={dept}
                  className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between space-y-4 shadow-2xs"
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-900 text-xs">{dept}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-900 text-white rounded-full">
                        {deptOrders.length} orders
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Total Items:</span>
                        <strong className="text-slate-900">{totalItemsCount} units</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Consolidated Value:</span>
                        <strong className="text-slate-900 font-mono">QAR {totalDeptAmount.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>

                  {deptOrders.length > 0 && (
                    <div className="pt-3 border-t border-slate-200 flex gap-2">
                      <button
                        onClick={() => onPrintDepartmentBatch(dept, deptOrders)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs transition-colors shadow-xs"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Batch Manifest
                      </button>

                      <button
                        onClick={() => {
                          const runner = prompt(
                            `Assign Driver / Runner for ${dept} orders:`,
                            'Fleet Van #2 - Driver Tariq'
                          );
                          if (runner) {
                            deptOrders.forEach((o) => {
                              onUpdateOrderStatus(o.id, 'out_for_delivery', runner);
                            });
                          }
                        }}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-full text-xs transition-colors"
                        title="Bulk Dispatch Department"
                      >
                        <Truck className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCT CATALOG & BARCODE MANAGER */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Staff Sale Items & Clearance Inventory ({products.length})
              </h3>
              <p className="text-xs text-slate-500">
                Configure subsidized rates, quick stock adjustments, barcodes, and test order links.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {products.length > 0 && onClearAllProducts && (
                <button
                  onClick={() => {
                    if (
                      window.confirm(
                        `Are you sure you want to remove ALL ${products.length} catalog items so you can start fresh with your company's own products?`
                      )
                    ) {
                      onClearAllProducts();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-full text-xs transition-colors"
                  title="Remove default sample items and start with a clean catalog"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear All Items ({products.length})
                </button>
              )}

              {products.length === 0 && onResetDefaultProducts && (
                <button
                  onClick={onResetDefaultProducts}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full text-xs transition-colors"
                >
                  Load Sample Items
                </button>
              )}

              <button
                onClick={() => setIsBulkModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full text-xs transition-all shadow-xs active:scale-98"
              >
                <Upload className="w-4 h-4" /> Bulk Add Products
              </button>

              <button
                onClick={handleOpenNewProduct}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4" /> Add Single Item
              </button>
            </div>
          </div>

          {/* Bulk Import Success Toast */}
          {bulkSuccessCount !== null && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 px-4 py-3 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="text-xs font-bold">
                  Successfully imported and published {bulkSuccessCount} products with custom photos to staff store!
                </span>
              </div>
              <button
                onClick={() => setBulkSuccessCount(null)}
                className="p-1 text-emerald-700 hover:text-emerald-950 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Catalog Filter Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-50 p-3 rounded-2xl border border-slate-200/80">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search staff catalog by name, barcode, SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 font-medium shrink-0">Filter:</span>
              <button
                onClick={() => setProductCategoryFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  productCategoryFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All ({products.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setProductCategoryFilter(cat)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                    productCategoryFilter === cat
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {products.length === 0 ? (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center space-y-4">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                <Upload className="w-7 h-7" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Your Catalog is Clean & Ready for Company Products</h4>
                <p className="text-xs text-slate-500">
                  All default sample products have been removed. You can now bulk import your company's actual FMCG stock or add items individually.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsBulkModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-full transition-all shadow-xs flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Bulk Add Company Products
                </button>
                <button
                  onClick={handleOpenNewProduct}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-full transition-colors flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Single Product
                </button>
                {onResetDefaultProducts && (
                  <button
                    onClick={onResetDefaultProducts}
                    className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-full transition-colors"
                  >
                    Restore Sample Items
                  </button>
                )}
              </div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-500">
              No products found matching your search or category filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProducts.map((product) => {
              const discountPercent = Math.round(
                ((product.originalPrice - product.staffPrice) / product.originalPrice) * 100
              );

              return (
                <div
                  key={product.id}
                  className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow group shadow-2xs"
                >
                  <div className="relative">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-36 object-cover bg-slate-100"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                        {discountPercent}% STAFF OFF
                      </span>
                      {product.isStaffSpecial && (
                        <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                          Special Subsidy
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleQuickToggleClearance(product)}
                      className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 p-1.5 rounded-full shadow-xs text-[10px] font-semibold transition-colors"
                      title="Toggle Special Clearance Tag"
                    >
                      <Tag className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{product.sku}</span>
                        <span className={`font-semibold ${product.stock <= 5 ? 'text-amber-600 font-bold' : 'text-slate-700'}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs mt-1 line-clamp-2">
                        {product.name}
                      </h4>
                      <div className="flex items-center justify-between mt-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200/60 font-mono text-[10px] text-slate-600">
                        <div className="flex items-center gap-1">
                          <Barcode className="w-3.5 h-3.5 text-slate-400" />
                          <span>{product.barcode}</span>
                        </div>
                        {onOpenBarcodeView && (
                          <button
                            onClick={() => onOpenBarcodeView(product)}
                            className="text-slate-500 hover:text-slate-900 underline text-[10px]"
                            title="Show Barcode Pass"
                          >
                            Pass
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stock Quick Stepper & Price */}
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-900 font-mono">
                            QAR {product.staffPrice.toFixed(2)}
                          </span>
                          <span className="text-xs text-slate-400 line-through font-mono">
                            QAR {product.originalPrice.toFixed(2)}
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full border border-emerald-100">
                          Save QAR {(product.originalPrice - product.staffPrice).toFixed(2)}
                        </span>
                      </div>

                      {/* Quick Stock Controls (+ / -) */}
                      <div className="flex items-center justify-between bg-slate-50 px-2 py-1 rounded-xl border border-slate-200/80 text-[11px]">
                        <span className="text-slate-500 font-medium">Quick Stock:</span>
                        <div className="flex items-center gap-1 font-mono">
                          <button
                            onClick={() => handleQuickStockAdjust(product, -1)}
                            disabled={product.stock <= 0}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30"
                            title="Decrease 1"
                          >
                            -1
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjust(product, 1)}
                            className="w-5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700"
                            title="Add 1"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleQuickStockAdjust(product, 10)}
                            className="px-1.5 h-5 rounded bg-white hover:bg-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-[10px]"
                            title="Add 10 Cartons"
                          >
                            +10
                          </button>
                        </div>
                      </div>

                      {/* Actions: View in Store, Add to Cart Test, Edit */}
                      <div className="grid grid-cols-3 gap-1.5 pt-1">
                        {onViewInStore && (
                          <button
                            onClick={() => onViewInStore(product.id)}
                            className="py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                            title="View in Store Catalog & Order"
                          >
                            <Eye className="w-3 h-3" /> View
                          </button>
                        )}
                        <button
                          onClick={() => handleAddToCartTest(product)}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                          title="Add to Staff Cart for Testing"
                        >
                          <ShoppingBag className="w-3 h-3" /> Order
                        </button>
                        <button
                          onClick={() => {
                            setEditingProduct(product);
                            setIsProductModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      )}

      {/* TAB 4: PASSWORD & SYSTEM SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6 max-w-2xl">
          <div>
            <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-900" />
              Admin Password & Access Protection
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Change the password used to lock and unlock the ZAD Staff Sales Admin Hub.
            </p>
          </div>

          <form onSubmit={handlePasswordChangeSubmit} className="space-y-4 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Current Password Status
              </label>
              <div className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-mono text-slate-500 text-xs flex items-center justify-between">
                <span>••••••••••••</span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Secured & Protected
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Admin Password *
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password or PIN"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Confirm New Password *
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono"
                />
              </div>
            </div>

            {passwordError && (
              <p className="text-xs text-red-600 font-semibold">{passwordError}</p>
            )}

            {passwordChangeSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600" />
                Admin password updated and saved successfully!
              </div>
            )}

            <button
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs transition-colors shadow-xs"
            >
              Update Admin Password
            </button>
          </form>

          {/* Go-Live & Cloud Database Controls */}
          <div className="pt-4 border-t border-slate-200 space-y-4">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-xs text-slate-800">
                  Go-Live & Cloud Database Management
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  Free Firestore Cloud Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Prepare the store for real-world launch: start with a completely fresh item list or clear mock orders.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  Clean Fresh Catalog Start
                </div>
                <p className="text-[11px] text-slate-500">
                  Remove all demo FMCG items so you can start adding your company's actual items today.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear ALL products and start with a completely empty catalog for your real store items?')) {
                      if (onClearAllProducts) onClearAllProducts();
                    }
                  }}
                  className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-colors"
                >
                  Clear All Products ({products.length})
                </button>
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5 text-amber-600" />
                  Reset Order History
                </div>
                <p className="text-[11px] text-slate-500">
                  Clear all historical mock/test orders to start with 0 orders on launch day.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Are you sure you want to clear ALL orders for a clean go-live state?')) {
                      if (onClearAllOrders) onClearAllOrders();
                    }
                  }}
                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-lg transition-colors"
                >
                  Clear All Orders ({orders.length})
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset and reload default ZAD FMCG items?')) {
                    if (onResetDefaultProducts) onResetDefaultProducts();
                  }
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-full transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Restore Default FMCG Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODERN ADD / EDIT PRODUCT MODAL WITH LIVE PREVIEW & 1-CLICK PRESETS */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-200">
                  <Barcode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">
                    {products.some((p) => p.id === editingProduct.id)
                      ? 'Edit Staff Subsidized Item'
                      : 'Add New Staff Subsidized Item'}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Real-time preview & 1-click preset templates
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsProductModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick 1-Click FMCG Preset Templates Bar */}
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto text-xs">
              <span className="font-bold text-[11px] text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                1-Click Presets:
              </span>
              {FMCG_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-200 border border-slate-300 rounded-full text-[11px] font-medium text-slate-800 whitespace-nowrap transition-colors shadow-2xs"
                >
                  {preset.name.split('(')[0].trim()}
                </button>
              ))}
            </div>

            {/* Modal Body: Split Form & Live Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-12 overflow-y-auto flex-1">
              {/* Left Column: Form (7 cols) */}
              <div className="lg:col-span-7 p-6 space-y-4 text-xs border-r border-slate-200">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Name (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, name: e.target.value })
                    }
                    placeholder="e.g. Ferrero Rocher Box 24 pcs"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Name (Arabic)
                  </label>
                  <input
                    type="text"
                    value={editingProduct.nameAr || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, nameAr: e.target.value })
                    }
                    placeholder="الاسم بالعربية"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-arabic text-xs"
                  />
                </div>

                {/* Barcode & SKU with 1-Click Generator */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-semibold text-slate-700">
                        Barcode (EAN-13) *
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setEditingProduct({
                            ...editingProduct,
                            barcode: generateEAN13Barcode(),
                          })
                        }
                        className="text-[10px] text-slate-500 hover:text-slate-900 font-semibold underline flex items-center gap-0.5"
                      >
                        <Zap className="w-2.5 h-2.5 text-amber-500" /> New Code
                      </button>
                    </div>
                    <input
                      type="text"
                      required
                      value={editingProduct.barcode}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, barcode: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={editingProduct.sku}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, sku: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Pricing & Calculations */}
                <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Regular Retail Price (QAR) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editingProduct.originalPrice}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          originalPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-900 mb-1">
                      Staff Subsidized Price (QAR) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editingProduct.staffPrice}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          staffPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-white border border-slate-900 font-black text-slate-900 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none font-mono text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Stock (Cartons)
                    </label>
                    <input
                      type="number"
                      value={editingProduct.stock}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          stock: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Category</label>
                    <select
                      value={editingProduct.category}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, category: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs font-medium"
                    >
                      <option value="Beverages & Juices">Beverages & Juices</option>
                      <option value="Chocolates & Confectionery">Chocolates & Confectionery</option>
                      <option value="Coffee, Tea & Breakfast">Coffee, Tea & Breakfast</option>
                      <option value="Groceries & Pantry">Groceries & Pantry</option>
                      <option value="Biscuits & Snacks">Biscuits & Snacks</option>
                      <option value="Personal Care & Household">Personal Care & Household</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Packaging Unit</label>
                    <input
                      type="text"
                      value={editingProduct.unit}
                      onChange={(e) =>
                        setEditingProduct({ ...editingProduct, unit: e.target.value })
                      }
                      placeholder="e.g. Carton (12 pcs)"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                    />
                  </div>
                </div>

                {/* Single Product Image (Upload or URL) */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Product Image (1 Photo)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <img
                      src={editingProduct.imageUrl || CURATED_IMAGES[0].url}
                      alt="Preview"
                      className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-white shrink-0 shadow-2xs"
                    />

                    <div className="flex-1 w-full space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg transition-colors shadow-2xs"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload Photo
                        </button>
                        <span className="text-[11px] text-slate-500">or enter image web URL below:</span>
                      </div>

                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or direct image link"
                        value={editingProduct.imageUrl}
                        onChange={(e) =>
                          setEditingProduct({ ...editingProduct, imageUrl: e.target.value })
                        }
                        className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none text-xs"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingProduct.isStaffSpecial || false}
                      onChange={(e) =>
                        setEditingProduct({
                          ...editingProduct,
                          isStaffSpecial: e.target.checked,
                        })
                      }
                      className="accent-slate-900 rounded"
                    />
                    <span className="font-semibold text-slate-700">
                      Mark as Special Clearance / Subsidy Highlight
                    </span>
                  </label>
                </div>
              </div>

              {/* Right Column: Live Interactive Store Preview (5 cols) */}
              <div className="lg:col-span-5 p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-slate-700" />
                      Live Staff Store Preview
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      What Staff See
                    </span>
                  </div>

                  {/* Simulated Product Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <div className="relative h-44 bg-slate-100">
                      {editingProduct.imageUrl ? (
                        <img
                          src={editingProduct.imageUrl}
                          alt={editingProduct.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                          <ImageIcon className="w-8 h-8" />
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {editingProduct.originalPrice > editingProduct.staffPrice && (
                          <span className="bg-slate-900 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-xs">
                            {Math.round(
                              ((editingProduct.originalPrice - editingProduct.staffPrice) /
                                editingProduct.originalPrice) *
                                100
                            )}
                            % OFF
                          </span>
                        )}
                        {editingProduct.isStaffSpecial && (
                          <span className="bg-rose-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                            Special Clearance
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-2">
                      <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                        <span>{editingProduct.category}</span>
                        <span>{editingProduct.unit}</span>
                      </div>
                      <h4 className="font-bold text-slate-900 text-xs line-clamp-2">
                        {editingProduct.name || 'Product Title'}
                      </h4>
                      {editingProduct.nameAr && (
                        <div className="text-[11px] text-slate-500 font-arabic line-clamp-1">
                          {editingProduct.nameAr}
                        </div>
                      )}

                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <div>
                          <div className="text-base font-black text-slate-900 font-mono">
                            QAR {editingProduct.staffPrice.toFixed(2)}
                          </div>
                          <div className="text-xs text-slate-400 line-through font-mono">
                            QAR {editingProduct.originalPrice.toFixed(2)}
                          </div>
                        </div>

                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                          Save QAR {(editingProduct.originalPrice - editingProduct.staffPrice).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
                  <div className="flex justify-between">
                    <span>EAN Barcode:</span>
                    <span className="font-mono font-bold text-slate-800">{editingProduct.barcode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Initial Stock:</span>
                    <span className="font-semibold text-slate-800">{editingProduct.stock} Cartons</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold rounded-full text-xs transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveProduct(true)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold rounded-full text-xs transition-colors flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Save & View in Store
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveProduct(false)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs transition-all shadow-xs"
                >
                  Save Item
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Product Importer Modal */}
      <BulkProductModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onBulkAdd={(newProducts) => {
          if (onBulkAddProducts) {
            onBulkAddProducts(newProducts);
          } else {
            newProducts.forEach((p) => onAddProduct(p));
          }
          setBulkSuccessCount(newProducts.length);
          setTimeout(() => {
            setBulkSuccessCount(null);
          }, 6000);
        }}
      />

      {/* Oracle EBS / Excel Orders Export Modal */}
      <EBSExportModal
        isOpen={isEBSModalOpen}
        onClose={() => setIsEBSModalOpen(false)}
        orders={orders}
      />
    </div>
  );
};
