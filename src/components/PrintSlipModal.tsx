import React from 'react';
import { Order, Department, Product } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { Logo } from './Logo';
import { X, Printer, CheckCircle, FileText, Truck } from 'lucide-react';

interface PrintSlipModalProps {
  isOpen: boolean;
  onClose: () => void;
  order?: Order | null;
  departmentBatch?: {
    department: Department;
    orders: Order[];
  } | null;
  products?: Product[];
}

export const PrintSlipModal: React.FC<PrintSlipModalProps> = ({
  isOpen,
  onClose,
  order,
  departmentBatch,
  products = [],
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  // Helper to extract clean Item Code (SKU / EBS item code)
  const getItemCode = (item: {
    sku?: string;
    barcode?: string;
    productId?: string;
    productName?: string;
  }) => {
    if (item.sku && item.sku.trim() !== '' && item.sku !== 'N/A') {
      return item.sku;
    }
    if (products && products.length > 0) {
      const match = products.find(
        (p) =>
          (item.productId && p.id === item.productId) ||
          (item.barcode && p.barcode && p.barcode === item.barcode) ||
          (item.productName && p.name && p.name.trim().toLowerCase() === item.productName.trim().toLowerCase())
      );
      if (match?.sku && match.sku.trim() !== '' && match.sku !== 'N/A') {
        return match.sku;
      }
    }
    if (item.barcode && item.barcode.trim() !== '' && item.barcode !== 'N/A') {
      return item.barcode;
    }
    return item.productId || 'N/A';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Modal Toolbar (hidden on print) */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-slate-300" />
            <h3 className="font-bold text-xs">
              {departmentBatch
                ? `Department Batch Manifest: ${departmentBatch.department}`
                : `Staff Delivery Slip: #${order?.orderNumber}`}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 rounded-full text-xs font-semibold transition-all shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" /> Print Document (Ctrl+P)
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div className="p-8 overflow-y-auto font-sans text-slate-800 bg-white" id="printable-area">
          {departmentBatch ? (
            /* DEPARTMENT CONSOLIDATED MANIFEST */
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Logo size="md" showSubtitle={false} />
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-bold rounded">
                    BATCH MANIFEST
                  </span>
                  <p className="text-xs text-slate-500 mt-1 font-mono">
                    Date: {new Date().toLocaleDateString('en-GB')}
                  </p>
                  <p className="text-xs text-slate-500">Warehouse: Industrial Area WH-1</p>
                </div>
              </div>

              {/* Department Overview */}
              <div className="bg-slate-100 p-4 rounded-lg flex justify-between items-center text-xs">
                <div>
                  <span className="text-slate-500 font-semibold">Target Department:</span>
                  <div className="text-base font-black text-slate-900">
                    {departmentBatch.department}
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Total Orders in Batch:</span>
                  <div className="text-base font-black text-blue-900">
                    {departmentBatch.orders.length} Staff Packages
                  </div>
                </div>
                <div>
                  <span className="text-slate-500 font-semibold">Batch Total Value:</span>
                  <div className="text-base font-black text-emerald-700">
                    QAR{' '}
                    {departmentBatch.orders
                      .reduce((sum, o) => sum + o.grandTotal, 0)
                      .toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Order breakdown table */}
              <table className="w-full text-xs text-left border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-200 text-slate-800 font-bold">
                    <th className="border border-slate-300 p-2">Order #</th>
                    <th className="border border-slate-300 p-2">Employee Name & ID</th>
                    <th className="border border-slate-300 p-2">Desk / Notes</th>
                    <th className="border border-slate-300 p-2">Items Summary (Item Code, Qty, Desc, Price)</th>
                    <th className="border border-slate-300 p-2 text-right">Total (QAR)</th>
                    <th className="border border-slate-300 p-2 text-center">Receiver Sign</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentBatch.orders.map((o) => (
                    <tr key={o.id} className="border-b border-slate-200">
                      <td className="border border-slate-300 p-2 font-mono font-bold">
                        #{o.orderNumber}
                      </td>
                      <td className="border border-slate-300 p-2">
                        <div className="font-bold">{o.employeeName}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {o.employeeId} • {o.employeePhone}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 text-[11px]">
                        {o.deliveryNotes || 'Main Dept Area'}
                      </td>
                      <td className="border border-slate-300 p-2 text-[11px]">
                        <div className="space-y-1">
                          {o.items.map((i, iIdx) => {
                            const code = getItemCode(i);
                            return (
                              <div key={iIdx} className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1 py-0.5 rounded text-[10px]">
                                  [{code}]
                                </span>
                                <span className="font-semibold text-slate-800">
                                  {i.quantity}x {i.productName}
                                </span>
                                <span className="font-mono text-slate-500 text-[10px]">
                                  @ QAR {i.unitPrice.toFixed(2)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="border border-slate-300 p-2 font-bold text-right font-mono">
                        QAR {o.grandTotal.toFixed(2)}
                      </td>
                      <td className="border border-slate-300 p-2 text-center">
                        <div className="w-24 h-6 border-b border-slate-400 mx-auto"></div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-8 text-xs border-t border-slate-300">
                <div>
                  <p className="font-bold">Prepared by (Warehouse Lead):</p>
                  <div className="mt-8 border-b border-slate-400"></div>
                </div>
                <div>
                  <p className="font-bold">Dispatched by (Fleet Driver):</p>
                  <div className="mt-8 border-b border-slate-400"></div>
                </div>
                <div>
                  <p className="font-bold">Received by (Dept Focal Point):</p>
                  <div className="mt-8 border-b border-slate-400"></div>
                </div>
              </div>
            </div>
          ) : order ? (
            /* INDIVIDUAL EMPLOYEE DELIVERY SLIP / INVOICE */
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <Logo size="md" showSubtitle={false} />
                </div>
                <div className="text-right">
                  <div className="text-lg font-black text-slate-900 font-mono">
                    #{order.orderNumber}
                  </div>
                  <p className="text-xs text-slate-500">
                    Date: {new Date(order.createdAt).toLocaleDateString('en-GB')}
                  </p>
                  <span className="inline-block mt-1 px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[11px] font-bold rounded">
                    STAFF INVOICE & DELIVERY PASS
                  </span>
                </div>
              </div>

              {/* Staff Details Grid */}
              <div className="grid grid-cols-2 gap-4 bg-slate-50 border border-slate-200 p-4 rounded-xl text-xs">
                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    EMPLOYEE BENEFICIARY
                  </span>
                  <div className="font-bold text-slate-900 text-sm mt-0.5">
                    {order.employeeName}
                  </div>
                  <div className="font-mono text-slate-600 mt-0.5">
                    Staff ID: {order.employeeId}
                  </div>
                  <div className="text-slate-600 mt-0.5">Phone: {order.employeePhone}</div>
                </div>

                <div>
                  <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                    DELIVERY ROUTE & DESTINATION
                  </span>
                  <div className="font-bold text-blue-900 text-sm mt-0.5">
                    {order.department}
                  </div>
                  <div className="text-slate-600 mt-0.5 capitalize">
                    Mode: {order.deliveryMode.replace(/_/g, ' ')}
                  </div>
                  <div className="text-slate-600 mt-0.5">
                    Location: {order.deliveryNotes || 'Standard Department Handover'}
                  </div>
                </div>
              </div>

              {/* Items Table for Oracle EBS Processing & Warehouse Slip */}
              <table className="w-full text-xs text-left border-collapse border border-slate-200 print:border-slate-300">
                <thead>
                  <tr className="bg-slate-900 text-white print:bg-slate-100 print:text-slate-900 font-bold border-b print:border-slate-300">
                    <th className="p-2.5 rounded-l print:rounded-none w-36">Product Item Code</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5 text-center w-16">Qty</th>
                    <th className="p-2.5 text-right w-28">Price</th>
                    <th className="p-2.5 text-right rounded-r print:rounded-none w-28">Total (QAR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 print:divide-slate-300">
                  {order.items.map((item, idx) => {
                    const itemCode = getItemCode(item);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-2.5 align-top">
                          <div className="font-mono font-bold text-slate-900 text-xs">
                            {itemCode}
                          </div>
                          {item.barcode && item.barcode !== itemCode && (
                            <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                              Barcode: {item.barcode}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 align-top">
                          <div className="font-bold text-slate-800 text-xs">{item.productName}</div>
                          <div className="text-[10px] text-slate-500 font-normal">
                            Unit: {item.unit || 'pcs'}
                          </div>
                        </td>
                        <td className="p-2.5 text-center font-black text-sm text-slate-900 font-mono align-top">
                          {item.quantity}
                        </td>
                        <td className="p-2.5 text-right align-top font-mono">
                          <div className="font-bold text-blue-900 print:text-black">
                            QAR {item.unitPrice.toFixed(2)}
                          </div>
                          {item.regularPrice > item.unitPrice && (
                            <div className="text-[10px] text-slate-400 line-through">
                              Reg: QAR {item.regularPrice.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 text-right font-extrabold text-slate-900 font-mono align-top">
                          QAR {item.totalPrice.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Financial Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-72 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Retail Market Value:</span>
                    <span className="line-through font-mono">
                      QAR {(order.subtotal + order.savingsTotal).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Staff Welfare Subsidy:</span>
                    <span className="font-mono">- QAR {order.savingsTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Internal Logistics Delivery:</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="flex justify-between text-slate-900 font-black text-sm border-t border-slate-300 pt-1.5">
                    <span>Grand Total Payable:</span>
                    <span className="text-blue-900 font-mono">
                      QAR {order.grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Signatures & Barcode footer */}
              <div className="border-t border-slate-200 pt-6 flex justify-between items-center text-xs">
                <div>
                  <div className="font-mono text-slate-500 tracking-widest text-[10px]">
                    *{order.orderNumber}*
                  </div>
                  <div className="h-6 w-48 bg-slate-200 rounded flex items-center justify-center font-mono text-[10px] text-slate-600">
                    |||||| | |||| || ||| || |||
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-slate-500">Employee Acknowledgment Signature</p>
                  <div className="w-48 h-8 border-b border-slate-400 mt-2 ml-auto"></div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
