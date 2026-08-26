import React, { useState, useRef } from 'react';
import { Product } from '../types';
import { CURATED_IMAGES, generateEAN13Barcode } from '../data/fmcgPresets';
import { 
  X, 
  Upload, 
  Plus, 
  Trash2, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Download,
  Layers
} from 'lucide-react';

export const FMCG_CATEGORIES = [
  'Beverages & Juices',
  'Chocolates & Confectionery',
  'Coffee, Tea & Breakfast',
  'Groceries & Pantry',
  'Biscuits & Snacks',
  'Personal Care & Household',
  'Dairy & Chilled Foods',
];

interface BulkProductRow {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  staffPrice: number;
  stock: number;
  imageUrl: string;
}

interface BulkProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBulkAdd: (newProducts: Product[]) => void;
}

export const BulkProductModal: React.FC<BulkProductModalProps> = ({
  isOpen,
  onClose,
  onBulkAdd,
}) => {
  const [activeMode, setActiveMode] = useState<'table' | 'csv'>('table');
  const [imagePickerRowId, setImagePickerRowId] = useState<string | null>(null);
  const [customImageUrlInput, setCustomImageUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileRef = useRef<HTMLInputElement>(null);

  // Initial template rows with Item code (SKU), Name, Category, Unit pcs, Staff Price, Stock Qty, Image
  const [rows, setRows] = useState<BulkProductRow[]>([
    {
      id: `bulk-${Date.now()}-1`,
      sku: 'ZAD-1001',
      name: 'San Pellegrino Sparkling Mineral Water',
      category: 'Beverages & Juices',
      unit: 'Carton (24 pcs)',
      staffPrice: 65,
      stock: 40,
      imageUrl: CURATED_IMAGES[0].url,
    },
    {
      id: `bulk-${Date.now()}-2`,
      sku: 'ZAD-1002',
      name: 'Nutella Hazelnut Cocoa Spread 750g',
      category: 'Chocolates & Confectionery',
      unit: 'Box (6 pcs)',
      staffPrice: 85,
      stock: 35,
      imageUrl: CURATED_IMAGES[4].url,
    },
    {
      id: `bulk-${Date.now()}-3`,
      sku: 'ZAD-1003',
      name: 'Barilla Spaghetti No. 5 500g',
      category: 'Groceries & Pantry',
      unit: 'Carton (24 pcs)',
      staffPrice: 75,
      stock: 50,
      imageUrl: CURATED_IMAGES[8].url,
    }
  ]);

  const [csvText, setCsvText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Add empty row to interactive table
  const handleAddRow = () => {
    const nextSkuNum = 1000 + rows.length + 1;
    const newRow: BulkProductRow = {
      id: `bulk-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      sku: `ZAD-${nextSkuNum}`,
      name: '',
      category: 'Beverages & Juices',
      unit: 'pcs',
      staffPrice: 25,
      stock: 20,
      imageUrl: CURATED_IMAGES[Math.floor(Math.random() * CURATED_IMAGES.length)].url,
    };
    setRows((prev) => [...prev, newRow]);
  };

  // Remove row
  const handleRemoveRow = (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update specific field in a row
  const handleUpdateRow = (id: string, field: keyof BulkProductRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          return { ...r, [field]: value };
        }
        return r;
      })
    );
  };

  // Handle Local Image File Upload for a row
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, rowId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          handleUpdateRow(rowId, 'imageUrl', reader.result);
          setImagePickerRowId(null);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // CSV Template download with ONLY requested 7 columns: Item Code, Name, Category, Unit pcs, Staff Price, Stock Qty, Image URL
  const handleDownloadCsvTemplate = () => {
    const headers = [
      'Item Code',
      'Name',
      'Category',
      'Unit pcs',
      'Staff Price (QAR)',
      'Stock Qty',
      'Image URL'
    ];

    const sampleRows = [
      [
        'ZAD-101',
        'Perrier Sparkling Water 330ml',
        'Beverages & Juices',
        'Carton (24 pcs)',
        '79.00',
        '45',
        'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80'
      ],
      [
        'ZAD-102',
        'Ferrero Rocher Box',
        'Chocolates & Confectionery',
        'Box (24 pcs)',
        '28.00',
        '60',
        'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80'
      ],
      [
        'ZAD-103',
        'Lavazza Espresso Italiano 250g',
        'Coffee, Tea & Breakfast',
        'Pack (6 pcs)',
        '45.00',
        '30',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80'
      ]
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...sampleRows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ZAD_Bulk_Products_Template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse CSV Text / File into Table Rows
  const handleParseCsv = (textToParse: string) => {
    try {
      setParseError(null);
      const lines = textToParse
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      if (lines.length <= 1) {
        setParseError('CSV must contain a header row and at least 1 product row.');
        return;
      }

      // Check if first line is header
      const dataLines = lines[0].toLowerCase().includes('name') || lines[0].toLowerCase().includes('code')
        ? lines.slice(1) 
        : lines;

      const parsedRows: BulkProductRow[] = dataLines.map((line, idx) => {
        const pattern = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        const matches: string[] = [];
        let match;
        while ((match = pattern.exec(line)) !== null) {
          let field = match[1] || '';
          if (field.startsWith('"') && field.endsWith('"')) {
            field = field.slice(1, -1).replace(/""/g, '"');
          }
          matches.push(field.trim());
          if (matches.length > 10) break;
        }

        const sku = matches[0] || `ZAD-${1000 + idx + 1}`;
        const name = matches[1] || `Product Item #${idx + 1}`;
        const category = matches[2] || 'Beverages & Juices';
        const unit = matches[3] || 'pcs';
        const staffPrice = parseFloat(matches[4]) || 25;
        const stock = parseInt(matches[5], 10) || 20;
        const imageUrl = matches[6] && matches[6].startsWith('http') 
          ? matches[6] 
          : CURATED_IMAGES[idx % CURATED_IMAGES.length].url;

        return {
          id: `bulk-${Date.now()}-${idx}`,
          sku,
          name,
          category,
          unit,
          staffPrice,
          stock,
          imageUrl,
        };
      });

      if (parsedRows.length === 0) {
        setParseError('No valid product rows could be extracted.');
        return;
      }

      setRows(parsedRows);
      setActiveMode('table');
    } catch (err: any) {
      setParseError(`Error parsing CSV: ${err.message || 'Check format and try again.'}`);
    }
  };

  // Upload CSV File
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          setCsvText(text);
          handleParseCsv(text);
        }
      };
      reader.readAsText(file);
    }
  };

  // Final Bulk Submit
  const handleFinalSubmit = () => {
    const validRows = rows.filter((r) => r.name.trim().length > 0);
    if (validRows.length === 0) {
      alert('Please enter at least one product with a valid name.');
      return;
    }

    const convertedProducts: Product[] = validRows.map((r, i) => {
      const staffPrice = Number(r.staffPrice) || 25;
      const originalPrice = Math.round(staffPrice * 1.6);
      const sku = r.sku.trim() || `ZAD-${Math.floor(1000 + Math.random() * 9000)}`;

      return {
        id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
        name: r.name.trim(),
        category: r.category || 'Beverages & Juices',
        unit: r.unit.trim() || 'pcs',
        brand: r.category || 'Staff Exclusive',
        description: `Staff discounted bulk item provided by ZAD Marketing & Distribution.`,
        originalPrice: originalPrice,
        staffPrice: staffPrice,
        stock: Number(r.stock) || 0,
        barcode: generateEAN13Barcode(),
        sku: sku,
        imageUrl: r.imageUrl || CURATED_IMAGES[0].url,
        isStaffSpecial: true,
      };
    });

    onBulkAdd(convertedProducts);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  Bulk Add Products
                </h2>
                <span className="bg-emerald-500 text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                  Fast Importer
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Add multiple items with Item Code, Name, Category, Unit pcs, Staff Price, Stock Qty, and Image.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector & Quick Tools Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-2xs">
            <button
              onClick={() => setActiveMode('table')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeMode === 'table'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Bulk Table ({rows.length} items)
            </button>
            <button
              onClick={() => setActiveMode('csv')}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeMode === 'csv'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV / Excel Paste
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadCsvTemplate}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              Download CSV Template
            </button>

            {activeMode === 'table' && (
              <button
                onClick={handleAddRow}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* MODE 1: Interactive Table & Mobile Cards */}
          {activeMode === 'table' && (
            <div className="space-y-4">
              
              {/* MOBILE STACKED CARDS (<md) */}
              <div className="block md:hidden space-y-3">
                {rows.map((row, index) => {
                  return (
                    <div
                      key={row.id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs"
                    >
                      {/* Top: Index, Image preview & Delete */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-mono font-bold text-xs flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div className="relative group">
                            <img
                              src={row.imageUrl}
                              alt={row.name}
                              className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-100 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setImagePickerRowId(row.id)}
                              className="absolute inset-0 bg-slate-900/60 rounded-xl text-white flex flex-col items-center justify-center text-[9px] font-bold p-1 text-center"
                            >
                              <ImageIcon className="w-3 h-3" />
                            </button>
                          </div>
                          <div>
                            <button
                              type="button"
                              onClick={() => setImagePickerRowId(row.id)}
                              className="text-[11px] text-emerald-600 font-semibold hover:underline"
                            >
                              Change Image
                            </button>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveRow(row.id)}
                          disabled={rows.length <= 1}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors disabled:opacity-30"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* 1. Item Code & 2. Name */}
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Item Code
                          </label>
                          <input
                            type="text"
                            placeholder="ZAD-101"
                            value={row.sku}
                            onChange={(e) => handleUpdateRow(row.id, 'sku', e.target.value)}
                            className="w-full px-2.5 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Name *
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. San Pellegrino Sparkling 750ml"
                            value={row.name}
                            onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 focus:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 3. Category & 4. Unit pcs */}
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Category
                          </label>
                          <select
                            value={row.category}
                            onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                          >
                            {FMCG_CATEGORIES.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Unit pcs
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Carton (24 pcs) or pcs"
                            value={row.unit}
                            onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                            className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 5. Staff Price & 6. Stock Qty */}
                      <div className="grid grid-cols-2 gap-2 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-200/60">
                        <div>
                          <label className="block text-[10px] font-bold text-emerald-800 mb-0.5">
                            Staff Price (QAR) *
                          </label>
                          <input
                            type="number"
                            step="0.5"
                            value={row.staffPrice}
                            onChange={(e) =>
                              handleUpdateRow(row.id, 'staffPrice', parseFloat(e.target.value) || 0)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-emerald-400 rounded-lg text-xs font-mono font-black text-emerald-800 focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 mb-0.5">
                            Stock Qty *
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={row.stock}
                            onChange={(e) =>
                              handleUpdateRow(row.id, 'stock', parseInt(e.target.value, 10) || 0)
                            }
                            className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-center focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* DESKTOP STREAMLINED TABLE (md+) */}
              <div className="hidden md:block bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-black tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="p-3 w-10 text-center">#</th>
                        <th className="p-3 w-20 text-center">Image</th>
                        <th className="p-3 w-28">Item Code</th>
                        <th className="p-3 min-w-[200px]">Name *</th>
                        <th className="p-3 w-44">Category</th>
                        <th className="p-3 w-32">Unit pcs</th>
                        <th className="p-3 w-32">Staff Price (QAR)</th>
                        <th className="p-3 w-24">Stock Qty</th>
                        <th className="p-3 w-12 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rows.map((row, index) => {
                        return (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            {/* Number */}
                            <td className="p-3 text-center font-bold text-slate-400 font-mono">
                              {index + 1}
                            </td>

                            {/* Image with selector */}
                            <td className="p-3 text-center">
                              <div className="relative group inline-block">
                                <img
                                  src={row.imageUrl}
                                  alt={row.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-slate-200 bg-slate-100 shadow-2xs mx-auto"
                                />
                                <button
                                  type="button"
                                  onClick={() => setImagePickerRowId(row.id)}
                                  className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 rounded-xl text-white flex flex-col items-center justify-center text-[9px] font-bold transition-opacity p-1 text-center"
                                >
                                  <ImageIcon className="w-3.5 h-3.5 mb-0.5" />
                                  Edit
                                </button>
                              </div>
                            </td>

                            {/* Item Code (SKU) */}
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Item Code"
                                value={row.sku}
                                onChange={(e) => handleUpdateRow(row.id, 'sku', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                              />
                            </td>

                            {/* Name */}
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="Product Name *"
                                value={row.name}
                                onChange={(e) => handleUpdateRow(row.id, 'name', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none"
                              />
                            </td>

                            {/* Category */}
                            <td className="p-3">
                              <select
                                value={row.category}
                                onChange={(e) => handleUpdateRow(row.id, 'category', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                              >
                                {FMCG_CATEGORIES.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {cat}
                                  </option>
                                ))}
                              </select>
                            </td>

                            {/* Unit pcs */}
                            <td className="p-3">
                              <input
                                type="text"
                                placeholder="e.g. Carton (24 pcs), pcs"
                                value={row.unit}
                                onChange={(e) => handleUpdateRow(row.id, 'unit', e.target.value)}
                                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:outline-none"
                              />
                            </td>

                            {/* Staff Price (QAR) */}
                            <td className="p-3">
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-emerald-700 font-mono font-bold">
                                  QAR
                                </span>
                                <input
                                  type="number"
                                  step="0.5"
                                  value={row.staffPrice}
                                  onChange={(e) =>
                                    handleUpdateRow(row.id, 'staffPrice', parseFloat(e.target.value) || 0)
                                  }
                                  className="w-full pl-10 pr-2.5 py-2 bg-emerald-50/60 border border-emerald-300 rounded-lg text-xs font-mono font-black text-emerald-800 focus:outline-none"
                                />
                              </div>
                            </td>

                            {/* Stock Qty */}
                            <td className="p-3">
                              <input
                                type="number"
                                min="0"
                                value={row.stock}
                                onChange={(e) =>
                                  handleUpdateRow(row.id, 'stock', parseInt(e.target.value, 10) || 0)
                                }
                                className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-900 text-center focus:outline-none"
                              />
                            </td>

                            {/* Remove Action */}
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveRow(row.id)}
                                disabled={rows.length <= 1}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Bottom Quick Row Adder */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-200 gap-2">
                <span className="text-xs text-slate-500 font-medium">
                  Total items ready to upload: <strong className="text-slate-900">{rows.length} items</strong>
                </span>
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 text-slate-900 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs"
                >
                  <Plus className="w-4 h-4 text-emerald-600" /> Add Another Product Row
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: CSV / Excel Paste */}
          {activeMode === 'csv' && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-xs text-slate-900">
                      Copy & Paste from Excel / Google Sheets or CSV File
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Columns format: <strong>Item Code, Name, Category, Unit pcs, Staff Price (QAR), Stock Qty, Image URL</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={csvFileRef}
                      accept=".csv,.txt"
                      onChange={handleCsvFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => csvFileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload CSV File
                    </button>
                  </div>
                </div>

                <textarea
                  rows={8}
                  placeholder={`ZAD-101,Perrier Sparkling Water 330ml,Beverages & Juices,Carton (24 pcs),79,45,https://images.unsplash.com/photo-1548839140-29a749e1bc4e?auto=format&fit=crop&w=600&q=80\nZAD-102,Ferrero Rocher Box 24 Pcs,Chocolates & Confectionery,Box (24 pcs),28,60,https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&w=600&q=80\nZAD-103,Lavazza Espresso Italiano 250g,Coffee, Tea & Breakfast,Pack (6 pcs),45,30,https://images.unsplash.com/photo-1559056199-641a0ac8b55e?auto=format&fit=crop&w=600&q=80`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="w-full p-3 font-mono text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />

                {parseError && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-200 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{parseError}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => handleParseCsv(csvText)}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  Parse & Convert to Interactive Table
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-slate-500">
            Clicking import will immediately publish these items to the staff store.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full text-xs transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleFinalSubmit}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-full text-xs transition-all shadow-md active:scale-98"
            >
              <CheckCircle2 className="w-4 h-4" />
              Import & Publish {rows.filter((r) => r.name.trim()).length} Products
            </button>
          </div>
        </div>
      </div>

      {/* Image Picker Modal Popup for a specific row */}
      {imagePickerRowId && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 max-w-xl w-full space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-emerald-600" />
                <h4 className="font-bold text-sm text-slate-900">
                  Select Product Photography or Upload Image
                </h4>
              </div>
              <button
                onClick={() => setImagePickerRowId(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Curated FMCG Images Grid */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-2">
                Curated Category Photos:
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1">
                {CURATED_IMAGES.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      handleUpdateRow(imagePickerRowId, 'imageUrl', img.url);
                      setImagePickerRowId(null);
                    }}
                    className="group flex flex-col items-center gap-1 p-1 rounded-xl border border-slate-200 hover:border-slate-900 hover:shadow-xs transition-all text-left bg-slate-50"
                  >
                    <img
                      src={img.url}
                      alt={img.label}
                      className="w-full h-16 object-cover rounded-lg group-hover:scale-102 transition-transform"
                    />
                    <span className="text-[9px] font-semibold text-slate-700 truncate w-full text-center">
                      {img.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom URL or Device Upload */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="text-[11px] font-bold text-slate-600 block">
                Or Use Custom Image URL / Device Photo:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="https://..."
                  value={customImageUrlInput}
                  onChange={(e) => setCustomImageUrlInput(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (customImageUrlInput.trim()) {
                      handleUpdateRow(imagePickerRowId, 'imageUrl', customImageUrlInput.trim());
                      setCustomImageUrlInput('');
                      setImagePickerRowId(null);
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Apply
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={(e) => handleImageFileUpload(e, imagePickerRowId)}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Photo from Device
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
