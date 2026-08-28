import React, { useState, useMemo } from 'react';
import { Order, Department, OrderStatus } from '../types';
import { DEPARTMENTS } from '../data/mockData';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  X, 
  Filter, 
  Layers, 
  Package, 
  Users, 
  Building2, 
  FileText,
  Info,
  Calendar,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface EBSExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

type ExportFormat = 'ebs_item_lines' | 'bulk_item_summary' | 'dept_breakdown' | 'order_headers';

export const EBSExportModal: React.FC<EBSExportModalProps> = ({
  isOpen,
  onClose,
  orders,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('ebs_item_lines');
  const [selectedDept, setSelectedDept] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('active'); // 'all', 'active' (excludes cancelled), or specific
  const [copied, setCopied] = useState(false);

  // Filter orders based on user selection
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (selectedStatus === 'active' && order.status === 'cancelled') return false;
      if (selectedStatus !== 'all' && selectedStatus !== 'active' && order.status !== selectedStatus) return false;
      if (selectedDept !== 'all' && order.department !== selectedDept) return false;
      return true;
    });
  }, [orders, selectedDept, selectedStatus]);

  // 1. Flatten all individual item lines with complete employee & product details
  const flattenedItemLines = useMemo(() => {
    const lines: Array<{
      lineNo: number;
      orderNumber: string;
      orderDate: string;
      employeeId: string;
      employeeName: string;
      department: string;
      employeePhone: string;
      itemCode: string;
      barcode: string;
      itemDescription: string;
      unit: string;
      quantity: number;
      unitPrice: number;
      lineTotal: number;
      regularPrice: number;
      savings: number;
      deliveryMode: string;
      status: string;
    }> = [];

    let lineCounter = 1;
    filteredOrders.forEach((order) => {
      const orderDateStr = new Date(order.createdAt).toLocaleDateString('en-GB');
      order.items.forEach((item) => {
        lines.push({
          lineNo: lineCounter++,
          orderNumber: order.orderNumber,
          orderDate: orderDateStr,
          employeeId: order.employeeId || 'N/A',
          employeeName: order.employeeName,
          department: order.department,
          employeePhone: order.employeePhone || 'N/A',
          itemCode: item.sku || 'N/A',
          barcode: item.barcode || 'N/A',
          itemDescription: item.productName,
          unit: item.unit || 'pcs',
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          lineTotal: item.totalPrice,
          regularPrice: item.regularPrice || item.unitPrice,
          savings: Math.max(0, (item.regularPrice - item.unitPrice) * item.quantity),
          deliveryMode: order.deliveryMode.replace(/_/g, ' ').toUpperCase(),
          status: order.status.replace(/_/g, ' ').toUpperCase(),
        });
      });
    });

    return lines;
  }, [filteredOrders]);

  // 2. Consolidated summary grouped by Item Code (SKU) for Bulk Warehouse Picking / EBS Inventory Issue
  const aggregatedItems = useMemo(() => {
    const map = new Map<string, {
      itemCode: string;
      barcode: string;
      itemDescription: string;
      unit: string;
      totalQuantity: number;
      unitPrice: number;
      totalAmount: number;
      orderCount: number;
      departments: Set<string>;
    }>();

    filteredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const key = item.sku || item.productName;
        if (!map.has(key)) {
          map.set(key, {
            itemCode: item.sku || 'N/A',
            barcode: item.barcode || 'N/A',
            itemDescription: item.productName,
            unit: item.unit || 'pcs',
            totalQuantity: 0,
            unitPrice: item.unitPrice,
            totalAmount: 0,
            orderCount: 0,
            departments: new Set<string>(),
          });
        }
        const entry = map.get(key)!;
        entry.totalQuantity += item.quantity;
        entry.totalAmount += item.totalPrice;
        entry.orderCount += 1;
        entry.departments.add(order.department);
      });
    });

    return Array.from(map.values()).sort((a, b) => b.totalQuantity - a.totalQuantity);
  }, [filteredOrders]);

  // Statistics
  const totalUnits = useMemo(() => {
    return flattenedItemLines.reduce((sum, line) => sum + line.quantity, 0);
  }, [flattenedItemLines]);

  const totalValue = useMemo(() => {
    return flattenedItemLines.reduce((sum, line) => sum + line.lineTotal, 0);
  }, [flattenedItemLines]);

  // Generate CSV / TSV content based on format
  const generateExportData = (separator: ',' | '\t' = ',') => {
    const escape = (val: any) => {
      const str = String(val ?? '');
      if (separator === '\t') return str.replace(/\t|\n|\r/g, ' ');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    if (selectedFormat === 'ebs_item_lines') {
      const headers = [
        'Line #',
        'Order Number',
        'Order Date',
        'Employee ID',
        'Employee Name',
        'Department',
        'Phone',
        'Item Code (SKU)',
        'Barcode (EAN-13)',
        'Item Description',
        'UOM Unit',
        'Quantity Ordered',
        'Staff Unit Price (QAR)',
        'Line Total (QAR)',
        'Regular Retail Price (QAR)',
        'Subsidy Savings (QAR)',
        'Delivery Mode',
        'Order Status'
      ];

      const rows = flattenedItemLines.map((l) => [
        l.lineNo,
        l.orderNumber,
        l.orderDate,
        l.employeeId,
        l.employeeName,
        l.department,
        l.employeePhone,
        l.itemCode,
        l.barcode,
        l.itemDescription,
        l.unit,
        l.quantity,
        l.unitPrice.toFixed(2),
        l.lineTotal.toFixed(2),
        l.regularPrice.toFixed(2),
        l.savings.toFixed(2),
        l.deliveryMode,
        l.status
      ]);

      return [headers.map(escape).join(separator), ...rows.map((r) => r.map(escape).join(separator))].join('\n');
    }

    if (selectedFormat === 'bulk_item_summary') {
      const headers = [
        'Item Code (SKU)',
        'Barcode',
        'Item Description',
        'Unit / UOM',
        'Total Quantity Ordered',
        'Staff Unit Price (QAR)',
        'Total Subsidized Value (QAR)',
        'Distinct Orders Count',
        'Ordering Departments'
      ];

      const rows = aggregatedItems.map((item) => [
        item.itemCode,
        item.barcode,
        item.itemDescription,
        item.unit,
        item.totalQuantity,
        item.unitPrice.toFixed(2),
        item.totalAmount.toFixed(2),
        item.orderCount,
        Array.from(item.departments).join('; ')
      ]);

      return [headers.map(escape).join(separator), ...rows.map((r) => r.map(escape).join(separator))].join('\n');
    }

    if (selectedFormat === 'order_headers') {
      const headers = [
        'Order Number',
        'Order Date',
        'Employee ID',
        'Employee Name',
        'Department',
        'Phone',
        'Delivery Mode',
        'Total Items Count',
        'Subtotal (QAR)',
        'Subsidy Savings (QAR)',
        'Grand Total (QAR)',
        'Order Status',
        'Assigned Dispatcher'
      ];

      const rows = filteredOrders.map((o) => [
        o.orderNumber,
        new Date(o.createdAt).toLocaleDateString('en-GB'),
        o.employeeId || 'N/A',
        o.employeeName,
        o.department,
        o.employeePhone,
        o.deliveryMode.replace(/_/g, ' ').toUpperCase(),
        o.items.reduce((s, i) => s + i.quantity, 0),
        o.subtotal.toFixed(2),
        o.savingsTotal.toFixed(2),
        o.grandTotal.toFixed(2),
        o.status.replace(/_/g, ' ').toUpperCase(),
        o.assignedDispatcher || ''
      ]);

      return [headers.map(escape).join(separator), ...rows.map((r) => r.map(escape).join(separator))].join('\n');
    }

    return '';
  };

  // Download CSV with UTF-8 BOM so Microsoft Excel directly opens without encoding errors
  const handleDownloadCSV = () => {
    const csvData = generateExportData(',');
    const blob = new Blob(['\uFEFF' + csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filenamePrefix = selectedFormat === 'ebs_item_lines' 
      ? 'ZAD_EBS_Item_Lines' 
      : selectedFormat === 'bulk_item_summary'
      ? 'ZAD_EBS_Warehouse_Picking_Summary'
      : 'ZAD_Staff_Orders_Summary';

    link.href = url;
    link.download = `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy directly to clipboard as TSV (Tab Separated) for instantaneous pasting into Excel
  const handleCopyToClipboard = async () => {
    try {
      const tsvData = generateExportData('\t');
      await navigator.clipboard.writeText(tsvData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-5xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-[#002D62] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-800/50">
                  Oracle EBS & ERP Export Engine
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Export Employee Orders to Excel / EBS
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 flex-1 overflow-y-auto space-y-5 bg-slate-50/50">
          
          {/* Format Selection Cards */}
          <div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
              1. Choose Export Layout
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Option 1: EBS Item Lines (Default & Recommended) */}
              <button
                type="button"
                onClick={() => setSelectedFormat('ebs_item_lines')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'ebs_item_lines'
                    ? 'border-[#002D62] bg-blue-50/50 ring-2 ring-blue-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-blue-100 text-[#002D62]">
                    <Layers className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Recommended for EBS
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  Individual Item Lines (All Details)
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Every product ordered by each employee as a separate row with <strong>Item Code</strong>, <strong>Description</strong>, <strong>Qty</strong>, <strong>Badge #</strong>, and <strong>Employee Info</strong>.
                </p>
              </button>

              {/* Option 2: Warehouse Picking Summary */}
              <button
                type="button"
                onClick={() => setSelectedFormat('bulk_item_summary')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'bulk_item_summary'
                    ? 'border-[#002D62] bg-blue-50/50 ring-2 ring-blue-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                    <Package className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Inventory Summary
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  Consolidated Item Totals
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Aggregates total quantities per Item Code across all employees for warehouse picking and stock reduction.
                </p>
              </button>

              {/* Option 3: Order Headers Summary */}
              <button
                type="button"
                onClick={() => setSelectedFormat('order_headers')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  selectedFormat === 'order_headers'
                    ? 'border-[#002D62] bg-blue-50/50 ring-2 ring-blue-500/30 shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                    <FileText className="w-4 h-4" />
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">
                    Finance / HR
                  </span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">
                  Employee Order Headers
                </h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  1 row per employee order with Order #, Date, Employee Name, Dept, Total Item Count, and Grand Total QAR.
                </p>
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters:</span>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="active">Active Orders (Exclude Cancelled)</option>
                <option value="all">All Orders (Including Cancelled)</option>
                <option value="confirmed">Confirmed Only</option>
                <option value="pending_whatsapp">Pending WhatsApp Only</option>
                <option value="packing">In Packing Only</option>
                <option value="delivered">Delivered Only</option>
              </select>

              {/* Department Filter */}
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="all">All Departments ({DEPARTMENTS.length})</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-4 text-xs">
              <div className="text-slate-600">
                Orders: <strong className="text-slate-900">{filteredOrders.length}</strong>
              </div>
              <div className="text-slate-600">
                Total Rows: <strong className="text-slate-900">{selectedFormat === 'ebs_item_lines' ? flattenedItemLines.length : selectedFormat === 'bulk_item_summary' ? aggregatedItems.length : filteredOrders.length}</strong>
              </div>
              <div className="text-slate-600">
                Total Units: <strong className="text-slate-900">{totalUnits}</strong>
              </div>
              <div className="text-slate-600 font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                QAR {totalValue.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Live Data Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="px-4 py-2.5 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
                Live Excel Preview ({selectedFormat === 'ebs_item_lines' ? `${flattenedItemLines.length} Item Lines` : selectedFormat === 'bulk_item_summary' ? `${aggregatedItems.length} Products` : `${filteredOrders.length} Orders`})
              </span>
              <span className="text-[11px] text-slate-500">
                Showing first 5 preview rows
              </span>
            </div>

            <div className="overflow-x-auto max-h-56 scrollbar-thin">
              <table className="w-full text-left text-[11px] divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-700 font-bold sticky top-0">
                  {selectedFormat === 'ebs_item_lines' && (
                    <tr>
                      <th className="px-3 py-2">Line #</th>
                      <th className="px-3 py-2">Order #</th>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Employee Name</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2">Item Code (SKU)</th>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2 text-center">Qty</th>
                      <th className="px-3 py-2 text-right">Price (QAR)</th>
                      <th className="px-3 py-2 text-right">Line Total</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  )}
                  {selectedFormat === 'bulk_item_summary' && (
                    <tr>
                      <th className="px-3 py-2">Item Code (SKU)</th>
                      <th className="px-3 py-2">Barcode</th>
                      <th className="px-3 py-2">Item Description</th>
                      <th className="px-3 py-2">Unit</th>
                      <th className="px-3 py-2 text-center">Total Qty</th>
                      <th className="px-3 py-2 text-right">Unit Price</th>
                      <th className="px-3 py-2 text-right">Total QAR</th>
                      <th className="px-3 py-2 text-center">Orders Count</th>
                    </tr>
                  )}
                  {selectedFormat === 'order_headers' && (
                    <tr>
                      <th className="px-3 py-2">Order #</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2">Employee ID</th>
                      <th className="px-3 py-2">Employee Name</th>
                      <th className="px-3 py-2">Department</th>
                      <th className="px-3 py-2 text-center">Items</th>
                      <th className="px-3 py-2 text-right">Total (QAR)</th>
                      <th className="px-3 py-2">Status</th>
                    </tr>
                  )}
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {selectedFormat === 'ebs_item_lines' && (
                    flattenedItemLines.slice(0, 5).map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-1.5 font-mono text-slate-500">{line.lineNo}</td>
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{line.orderNumber}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{line.employeeId}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">{line.employeeName}</td>
                        <td className="px-3 py-1.5 text-slate-600 truncate max-w-[140px]">{line.department}</td>
                        <td className="px-3 py-1.5 font-mono font-bold text-blue-950 bg-blue-50/50">{line.itemCode}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-900 truncate max-w-[200px]">{line.itemDescription}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-slate-900">{line.quantity}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{line.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">{line.lineTotal.toFixed(2)}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {line.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}

                  {selectedFormat === 'bulk_item_summary' && (
                    aggregatedItems.slice(0, 5).map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-1.5 font-mono font-bold text-blue-950 bg-blue-50/50">{item.itemCode}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-500">{item.barcode}</td>
                        <td className="px-3 py-1.5 font-medium text-slate-900 truncate max-w-[240px]">{item.itemDescription}</td>
                        <td className="px-3 py-1.5 text-slate-600">{item.unit}</td>
                        <td className="px-3 py-1.5 text-center font-bold text-emerald-800">{item.totalQuantity}</td>
                        <td className="px-3 py-1.5 text-right font-mono">{item.unitPrice.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">{item.totalAmount.toFixed(2)}</td>
                        <td className="px-3 py-1.5 text-center">{item.orderCount}</td>
                      </tr>
                    ))
                  )}

                  {selectedFormat === 'order_headers' && (
                    filteredOrders.slice(0, 5).map((o, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="px-3 py-1.5 font-mono font-bold text-slate-900">{o.orderNumber}</td>
                        <td className="px-3 py-1.5 text-slate-500">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                        <td className="px-3 py-1.5 font-mono text-slate-600">{o.employeeId}</td>
                        <td className="px-3 py-1.5 font-semibold text-slate-900">{o.employeeName}</td>
                        <td className="px-3 py-1.5 text-slate-600 truncate max-w-[150px]">{o.department}</td>
                        <td className="px-3 py-1.5 text-center font-bold">{o.items.reduce((s, i) => s + i.quantity, 0)}</td>
                        <td className="px-3 py-1.5 text-right font-mono font-bold text-slate-900">{o.grandTotal.toFixed(2)}</td>
                        <td className="px-3 py-1.5">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700">
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Oracle EBS Step-by-Step Instructions Banner */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-[#002D62]">
              <Info className="w-4 h-4 text-blue-700" />
              <span>How to process this file in Oracle E-Business Suite (EBS):</span>
            </div>
            <ol className="text-[11px] text-slate-600 space-y-1 list-decimal list-inside pl-1 leading-relaxed">
              <li>Click <strong>&quot;Download Excel (.CSV)&quot;</strong> or <strong>&quot;Copy to Clipboard&quot;</strong>.</li>
              <li>The exported sheet contains matching EBS columns: <code>Item Code (SKU)</code>, <code>Item Description</code>, <code>Quantity</code>, and full <code>Employee &amp; Department details</code>.</li>
              <li>Open the file in <strong>Microsoft Excel</strong>, <strong>Oracle Web ADI</strong>, or import via <strong>EBS Order Import (OE_LINES_IFACE_ALL) / DataLoader / Internal Requisition Issue</strong>.</li>
            </ol>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            Exporting <strong className="text-slate-900">{filteredOrders.length}</strong> orders ({flattenedItemLines.length} item lines)
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            {/* Copy to Clipboard */}
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" /> Copied TSV to Clipboard!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-slate-500" /> Copy for Excel Paste
                </>
              )}
            </button>

            {/* Download CSV with UTF-8 BOM */}
            <button
              type="button"
              onClick={handleDownloadCSV}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-[#002D62] hover:bg-[#00224d] active:scale-95 text-white font-bold rounded-xl text-xs transition-all shadow-md"
            >
              <Download className="w-4 h-4" />
              <span>Download Excel (.CSV)</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
