import React from 'react';
import { Product } from '../types';
import { X, Barcode, Copy, Check, MessageCircle, ShoppingBag } from 'lucide-react';
import { createSingleProductWhatsAppLink } from '../utils/whatsapp';

interface BarcodeModalViewProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity?: number) => void;
  employeeName?: string;
  employeeId?: string;
  department?: string;
}

export const BarcodeModalView: React.FC<BarcodeModalViewProps> = ({
  product,
  onClose,
  onAddToCart,
  employeeName,
  employeeId,
  department,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!product) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(product.barcode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col text-center">
        <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
          <span className="text-xs font-semibold flex items-center gap-1.5">
            <Barcode className="w-4 h-4 text-slate-300" />
            ZAD Warehouse Barcode Pass
          </span>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-24 h-24 object-cover mx-auto rounded-2xl border border-slate-200 shadow-xs"
          />

          <div>
            <h4 className="font-bold text-slate-900 text-sm">{product.name}</h4>
            <div className="text-xs text-slate-500 mt-0.5">{product.unit}</div>
          </div>

          {/* Large Simulated Barcode visual */}
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-2">
            <div className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
              SCAN AT WAREHOUSE COUNTER
            </div>
            
            {/* Vector barcode lines representation */}
            <div className="flex items-center justify-center h-16 gap-1 bg-white p-2 rounded-xl border border-slate-200">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className={`bg-slate-900 h-full ${
                    i % 3 === 0 ? 'w-1.5' : i % 5 === 0 ? 'w-1' : 'w-0.5'
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="font-mono text-base font-black tracking-widest text-slate-900">
                {product.barcode}
              </span>
              <button
                onClick={handleCopy}
                className="p-1 text-slate-500 hover:text-slate-900 rounded transition-colors"
                title="Copy Barcode"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center bg-slate-50 border border-slate-200 p-3 rounded-xl text-xs text-slate-800">
            <span className="font-medium text-slate-500">Staff Subsidized Price:</span>
            <strong className="text-base font-black text-slate-900">QAR {product.staffPrice.toFixed(2)}</strong>
          </div>

          <div className="space-y-2 pt-1">
            <button
              onClick={() => {
                onAddToCart(product, 1);
                onClose();
              }}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <ShoppingBag className="w-4 h-4" /> Add to Staff Cart
            </button>

            <a
              href={createSingleProductWhatsAppLink(
                product,
                employeeName,
                employeeId,
                department
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-full text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp Order Item
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
