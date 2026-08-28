import React, { useState, useMemo } from 'react';
import { Order, Product, Department } from '../types';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Building2, 
  Package, 
  Sparkles, 
  ArrowUpRight, 
  Calendar, 
  BarChart3, 
  PieChart, 
  Award, 
  CheckCircle2, 
  Clock, 
  Users, 
  Layers, 
  ChevronRight,
  Filter,
  ArrowDownRight,
  ArrowUpDown,
  Tag,
  Percent,
  FileSpreadsheet,
  Download
} from 'lucide-react';

interface AdminSummaryDashboardProps {
  orders: Order[];
  products: Product[];
  onSelectDepartment?: (dept: Department) => void;
  onNavigateTab?: (tab: 'orders' | 'delivery_matrix' | 'products') => void;
  onOpenEBSExport?: () => void;
}

type TimeframeOption = 'all' | 'this_month' | 'last_month' | 'last_30_days';

export const AdminSummaryDashboard: React.FC<AdminSummaryDashboardProps> = ({
  orders,
  products,
  onSelectDepartment,
  onNavigateTab,
  onOpenEBSExport
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('all');
  const [deptSortBy, setDeptSortBy] = useState<'revenue' | 'orders'>('revenue');
  const [productSortBy, setProductSortBy] = useState<'units' | 'revenue'>('units');

  // Filter orders by timeframe
  const filteredOrders = useMemo(() => {
    const now = new Date('2026-08-26T00:00:00Z'); // normalized reference
    return orders.filter((order) => {
      if (order.status === 'cancelled') return false;
      const orderDate = new Date(order.createdAt);

      if (timeframe === 'this_month') {
        return (
          orderDate.getUTCFullYear() === 2026 && orderDate.getUTCMonth() === 7 // August is index 7
        );
      }
      if (timeframe === 'last_month') {
        return (
          orderDate.getUTCFullYear() === 2026 && orderDate.getUTCMonth() === 6 // July is index 6
        );
      }
      if (timeframe === 'last_30_days') {
        const diffTime = Math.abs(now.getTime() - orderDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      return true;
    });
  }, [orders, timeframe]);

  // Overall Totals
  const totalSalesRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [filteredOrders]);

  const totalSavingsSubsidized = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + o.savingsTotal, 0);
  }, [filteredOrders]);

  const totalRetailValue = totalSalesRevenue + totalSavingsSubsidized;

  const totalUnitsSold = useMemo(() => {
    return filteredOrders.reduce((total, o) => {
      return total + o.items.reduce((s, i) => s + i.quantity, 0);
    }, 0);
  }, [filteredOrders]);

  const averageOrderValue = filteredOrders.length > 0 ? totalSalesRevenue / filteredOrders.length : 0;

  // Monthly Sales Volume Aggregation
  const monthlySalesData = useMemo(() => {
    const monthsMap: Record<
      string,
      {
        monthLabel: string;
        year: number;
        monthIndex: number;
        revenue: number;
        savings: number;
        orderCount: number;
        units: number;
      }
    > = {};

    orders.forEach((order) => {
      if (order.status === 'cancelled') return;
      const d = new Date(order.createdAt);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
      const monthLabel = `${monthNames[d.getUTCMonth()]} ${d.getUTCFullYear()}`;

      if (!monthsMap[key]) {
        monthsMap[key] = {
          monthLabel,
          year: d.getUTCFullYear(),
          monthIndex: d.getUTCMonth(),
          revenue: 0,
          savings: 0,
          orderCount: 0,
          units: 0
        };
      }

      monthsMap[key].revenue += order.grandTotal;
      monthsMap[key].savings += order.savingsTotal;
      monthsMap[key].orderCount += 1;
      monthsMap[key].units += order.items.reduce((s, i) => s + i.quantity, 0);
    });

    return Object.entries(monthsMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([_, val]) => val);
  }, [orders]);

  // Max monthly revenue for comparative progress bar sizing
  const maxMonthlyRevenue = useMemo(() => {
    return Math.max(...monthlySalesData.map((m) => m.revenue), 1);
  }, [monthlySalesData]);

  // Department Performance Aggregation
  const departmentPerformance = useMemo(() => {
    const deptMap: Record<
      string,
      {
        department: Department;
        orderCount: number;
        revenue: number;
        savings: number;
        units: number;
        uniqueEmployees: Set<string>;
        topItemCount: Record<string, number>;
      }
    > = {};

    filteredOrders.forEach((order) => {
      const dept = order.department;
      if (!deptMap[dept]) {
        deptMap[dept] = {
          department: dept,
          orderCount: 0,
          revenue: 0,
          savings: 0,
          units: 0,
          uniqueEmployees: new Set(),
          topItemCount: {}
        };
      }

      deptMap[dept].orderCount += 1;
      deptMap[dept].revenue += order.grandTotal;
      deptMap[dept].savings += order.savingsTotal;
      deptMap[dept].uniqueEmployees.add(order.employeeId || order.employeeName);

      order.items.forEach((item) => {
        deptMap[dept].units += item.quantity;
        deptMap[dept].topItemCount[item.productName] =
          (deptMap[dept].topItemCount[item.productName] || 0) + item.quantity;
      });
    });

    const list = Object.values(deptMap).map((d) => {
      // Find top item in department
      let topItem = 'None';
      let topQty = 0;
      Object.entries(d.topItemCount).forEach(([name, qty]) => {
        if (qty > topQty) {
          topQty = qty;
          topItem = name;
        }
      });

      return {
        department: d.department,
        orderCount: d.orderCount,
        revenue: d.revenue,
        savings: d.savings,
        units: d.units,
        employeeCount: d.uniqueEmployees.size,
        avgOrderValue: d.orderCount > 0 ? d.revenue / d.orderCount : 0,
        shareOfOrders: filteredOrders.length > 0 ? (d.orderCount / filteredOrders.length) * 100 : 0,
        topItem
      };
    });

    return list.sort((a, b) => {
      if (deptSortBy === 'revenue') return b.revenue - a.revenue;
      return b.orderCount - a.orderCount;
    });
  }, [filteredOrders, deptSortBy]);

  // Max department metric for visual relative bar calculation
  const maxDeptMetric = useMemo(() => {
    if (departmentPerformance.length === 0) return 1;
    return Math.max(
      ...departmentPerformance.map((d) => (deptSortBy === 'revenue' ? d.revenue : d.orderCount)),
      1
    );
  }, [departmentPerformance, deptSortBy]);

  // Product Sales & Most-Ordered Products Aggregation
  const productPerformance = useMemo(() => {
    const prodMap: Record<
      string,
      {
        productId: string;
        productName: string;
        sku: string;
        barcode: string;
        unit: string;
        imageUrl?: string;
        unitsSold: number;
        totalRevenue: number;
        orderCount: number;
      }
    > = {};

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const id = item.productId || item.sku || item.productName;
        if (!prodMap[id]) {
          prodMap[id] = {
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            barcode: item.barcode,
            unit: item.unit,
            imageUrl: item.imageUrl,
            unitsSold: 0,
            totalRevenue: 0,
            orderCount: 0
          };
        }
        prodMap[id].unitsSold += item.quantity;
        prodMap[id].totalRevenue += item.unitPrice * item.quantity;
        prodMap[id].orderCount += 1;
      });
    });

    const list = Object.values(prodMap).map((p) => {
      const matchedCatalogProduct = products.find(
        (cp) => cp.id === p.productId || cp.sku === p.sku || cp.name === p.productName
      );

      return {
        ...p,
        category: matchedCatalogProduct?.category || 'General',
        brand: matchedCatalogProduct?.brand || 'Staff Special',
        currentStock: matchedCatalogProduct ? matchedCatalogProduct.stock : 0,
        originalPrice: matchedCatalogProduct?.originalPrice || p.totalRevenue / (p.unitsSold || 1),
        staffPrice: matchedCatalogProduct?.staffPrice || p.totalRevenue / (p.unitsSold || 1),
        imageUrl: matchedCatalogProduct?.imageUrl || p.imageUrl
      };
    });

    return list.sort((a, b) => {
      if (productSortBy === 'units') return b.unitsSold - a.unitsSold;
      return b.totalRevenue - a.totalRevenue;
    });
  }, [filteredOrders, products, productSortBy]);

  const maxProductMetric = useMemo(() => {
    if (productPerformance.length === 0) return 1;
    return Math.max(
      ...productPerformance.map((p) => (productSortBy === 'units' ? p.unitsSold : p.totalRevenue)),
      1
    );
  }, [productPerformance, productSortBy]);

  // Category Breakdown Aggregation
  const categorySales = useMemo(() => {
    const catMap: Record<string, { category: string; revenue: number; units: number }> = {};
    productPerformance.forEach((p) => {
      const cat = p.category || 'Other';
      if (!catMap[cat]) {
        catMap[cat] = { category: cat, revenue: 0, units: 0 };
      }
      catMap[cat].revenue += p.totalRevenue;
      catMap[cat].units += p.unitsSold;
    });
    return Object.values(catMap).sort((a, b) => b.revenue - a.revenue);
  }, [productPerformance]);

  return (
    <div className="space-y-6">
      {/* Controls & Filter Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-sm relative overflow-hidden">
        {/* Subtle background decoration */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute right-1/3 -top-10 w-36 h-36 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold tracking-wide uppercase border border-emerald-500/30">
              <BarChart3 className="w-3.5 h-3.5" />
              Executive Sales & Fulfillment Intelligence
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Staff Store Performance Dashboard
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              Track real-time subsidized sales volume, top department demand, and best-selling inventory velocity.
            </p>
          </div>

          {/* Timeframe Selector */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700/80 p-1.5 rounded-2xl shrink-0 self-start md:self-auto">
            <Calendar className="w-4 h-4 text-slate-400 ml-2" />
            <button
              onClick={() => setTimeframe('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimeframe('this_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'this_month'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Aug 2026
            </button>
            <button
              onClick={() => setTimeframe('last_month')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'last_month'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Jul 2026
            </button>
            <button
              onClick={() => setTimeframe('last_30_days')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                timeframe === 'last_30_days'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              Last 30D
            </button>
          </div>
        </div>

        {/* 4 Core Summary Metric Tiles */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Staff Net Revenue</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              QAR {totalSalesRevenue.toFixed(2)}
            </div>
            <div className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" />
              <span>{filteredOrders.length} orders placed</span>
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Subsidies Provided</span>
              <TrendingUp className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-300 font-mono">
              QAR {totalSavingsSubsidized.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              Retail val: QAR {totalRetailValue.toFixed(2)}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Units Dispatched</span>
              <Package className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              {totalUnitsSold} Units
            </div>
            <div className="text-[11px] text-slate-400">
              Across {productPerformance.length} SKU items
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-1">
            <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
              <span>Avg Basket Size</span>
              <ShoppingBag className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono">
              QAR {averageOrderValue.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400">
              ~{(totalUnitsSold / (filteredOrders.length || 1)).toFixed(1)} items / order
            </div>
          </div>
        </div>
      </div>

      {/* ERP / ORACLE EBS EXPORT ACTION BANNER */}
      {onOpenEBSExport && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-sm border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-6 h-6 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 bg-blue-500/30 text-blue-200 border border-blue-400/30 rounded-md">
                  Finance & Logistics ERP
                </span>
                <span className="text-xs text-blue-300">
                  {orders.length} orders ({orders.reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity, 0), 0)} items)
                </span>
              </div>
              <h3 className="text-base font-extrabold text-white mt-1">
                Collect & Export Employee Orders for Oracle EBS / Excel
              </h3>
              <p className="text-xs text-blue-200/80 max-w-xl mt-0.5">
                Generate clean, formatted spreadsheets with <strong>Item Code (SKU)</strong>, <strong>Description</strong>, <strong>Quantity</strong>, Subsidized Rates, and <strong>Employee Details (ID, Name, Dept)</strong> ready for batch PO/SO processing.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={onOpenEBSExport}
              className="w-full md:w-auto px-5 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-black text-xs rounded-full transition-all shadow-md flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Open EBS Export Engine</span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 1: MONTHLY SALES VOLUME & TRENDS */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-600" />
              Total Monthly Sales Volume Breakdown
            </h3>
            <p className="text-xs text-slate-500">
              Historical monthly revenue, volume progression, and employee benefit distributions.
            </p>
          </div>
          <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start">
            {monthlySalesData.length} Billing Months Recorded
          </div>
        </div>

        {/* Monthly Comparison Grid & Visual Bars */}
        <div className="space-y-4">
          {monthlySalesData.map((month) => {
            const barPercentage = Math.round((month.revenue / maxMonthlyRevenue) * 100);
            const totalMonthlyRetail = month.revenue + month.savings;
            const savingsPercent = Math.round((month.savings / (totalMonthlyRetail || 1)) * 100);

            return (
              <div
                key={month.monthLabel}
                className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5 space-y-3 hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-900 shadow-2xs">
                      📅
                    </div>
                    <div>
                      <div className="font-black text-slate-900 text-sm sm:text-base">
                        {month.monthLabel}
                      </div>
                      <div className="text-xs text-slate-500 flex items-center gap-2">
                        <span>{month.orderCount} Staff Orders</span>
                        <span>•</span>
                        <span>{month.units} Total Items</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline sm:text-right gap-3 sm:gap-4">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase font-bold">Staff Revenue</div>
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        QAR {month.revenue.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-600 uppercase font-bold">Staff Savings</div>
                      <div className="text-base sm:text-lg font-black text-emerald-600 font-mono">
                        QAR {month.savings.toFixed(2)} ({savingsPercent}%)
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Visual Bar */}
                <div className="space-y-1">
                  <div className="w-full bg-slate-200 rounded-full h-3.5 overflow-hidden flex">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${barPercentage}%` }}
                      title={`Revenue: QAR ${month.revenue.toFixed(2)}`}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-400 font-medium pt-0.5">
                    <span>QAR 0.00</span>
                    <span>QAR {(maxMonthlyRevenue / 2).toFixed(0)}</span>
                    <span>Peak Month: QAR {maxMonthlyRevenue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2 & 3: TWO COLUMNS FOR DEPARTMENTS & BEST-SELLING PRODUCTS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT: TOP PERFORMING DEPARTMENTS (7 cols on lg) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Top-Performing Departments
                </h3>
                <p className="text-xs text-slate-500">
                  Ranking departments by total order volume and employee subsidy engagement.
                </p>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  onClick={() => setDeptSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    deptSortBy === 'revenue' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Spend (QAR)
                </button>
                <button
                  onClick={() => setDeptSortBy('orders')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    deptSortBy === 'orders' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Orders
                </button>
              </div>
            </div>

            {/* Department Leaderboard List */}
            <div className="space-y-3">
              {departmentPerformance.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No department order records found for this period.
                </div>
              ) : (
                departmentPerformance.map((dept, index) => {
                  const currentVal = deptSortBy === 'revenue' ? dept.revenue : dept.orderCount;
                  const barWidth = Math.round((currentVal / maxDeptMetric) * 100);

                  return (
                    <div
                      key={dept.department}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                              index === 0
                                ? 'bg-amber-400 text-slate-950 shadow-2xs'
                                : index === 1
                                ? 'bg-slate-300 text-slate-800'
                                : index === 2
                                ? 'bg-amber-700/80 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {index + 1}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {dept.department}
                            </span>
                            <span className="text-[10px] text-slate-500">
                              {dept.employeeCount} active buyers • {dept.units} units
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="font-black text-xs text-slate-900 font-mono">
                            QAR {dept.revenue.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {dept.orderCount} {dept.orderCount === 1 ? 'order' : 'orders'} ({dept.shareOfOrders.toFixed(0)}%)
                          </div>
                        </div>
                      </div>

                      {/* Bar Indicator */}
                      <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span className="truncate max-w-[200px]">
                          <strong>Top item:</strong> {dept.topItem}
                        </span>
                        <span className="text-emerald-600 font-semibold shrink-0">
                          Saved QAR {dept.savings.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('delivery_matrix')}
              className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              Open Department Delivery Matrix <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* RIGHT: MOST-ORDERED PRODUCTS (BEST SELLERS) (6 cols on lg) */}
        <div className="lg:col-span-6 bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Most-Ordered Products
                </h3>
                <p className="text-xs text-slate-500">
                  Staff favorite products ranked by units sold and consumer demand.
                </p>
              </div>

              {/* Sort Toggle */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold shrink-0">
                <button
                  onClick={() => setProductSortBy('units')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    productSortBy === 'units' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Units Sold
                </button>
                <button
                  onClick={() => setProductSortBy('revenue')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    productSortBy === 'revenue' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Revenue
                </button>
              </div>
            </div>

            {/* Product Rankings List */}
            <div className="space-y-3">
              {productPerformance.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No product sales data recorded yet.
                </div>
              ) : (
                productPerformance.slice(0, 5).map((prod, index) => {
                  const currentVal = productSortBy === 'units' ? prod.unitsSold : prod.totalRevenue;
                  const barWidth = Math.round((currentVal / maxProductMetric) * 100);

                  return (
                    <div
                      key={prod.productId || prod.sku || index}
                      className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 hover:border-slate-300 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                            index === 0
                              ? 'bg-amber-400 text-slate-950 shadow-2xs'
                              : index === 1
                              ? 'bg-slate-300 text-slate-800'
                              : index === 2
                              ? 'bg-amber-700/80 text-white'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {index + 1}
                        </div>

                        {/* Product Image */}
                        {prod.imageUrl && (
                          <img
                            src={prod.imageUrl}
                            alt={prod.productName}
                            className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-white shrink-0"
                          />
                        )}

                        {/* Name & Details */}
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-xs text-slate-900 truncate">
                            {prod.productName}
                          </div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span className="font-mono text-slate-400">{prod.sku}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-semibold">{prod.category}</span>
                          </div>
                        </div>

                        {/* Volume & Revenue */}
                        <div className="text-right shrink-0">
                          <div className="font-black text-xs text-slate-900 font-mono">
                            {prod.unitsSold} units
                          </div>
                          <div className="text-[10px] text-emerald-600 font-semibold">
                            QAR {prod.totalRevenue.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Bar Indicator */}
                      <div className="w-full bg-slate-200/90 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${barWidth}%` }}
                        ></div>
                      </div>

                      {/* Stock & Pricing status */}
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                        <span>
                          Current Inventory:{' '}
                          <strong
                            className={
                              prod.currentStock > 10
                                ? 'text-slate-800 font-mono'
                                : 'text-rose-600 font-mono'
                            }
                          >
                            {prod.currentStock} in stock
                          </strong>
                        </span>
                        <span className="text-slate-600 font-mono">
                          Staff Price: QAR {prod.staffPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('products')}
              className="w-full py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              Manage Catalog & Inventory Stock <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 4: FMCG CATEGORY SALES DISTRIBUTION */}
      {categorySales.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <PieChart className="w-5 h-5 text-emerald-600" />
                Sales Distribution by FMCG Product Category
              </h3>
              <p className="text-xs text-slate-500">
                Breakdown of employee purchases across categories.
              </p>
            </div>
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
              {categorySales.length} Active Categories
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categorySales.map((cat) => {
              const share = totalSalesRevenue > 0 ? (cat.revenue / totalSalesRevenue) * 100 : 0;

              return (
                <div
                  key={cat.category}
                  className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 hover:border-slate-300 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {cat.category}
                    </span>
                    <span className="text-[11px] font-black text-emerald-600 font-mono">
                      {share.toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-sm font-black text-slate-900 font-mono">
                      QAR {cat.revenue.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {cat.units} units
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full"
                      style={{ width: `${share}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
