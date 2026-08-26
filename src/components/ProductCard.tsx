import React, { useState } from 'react';
import { Product } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { createSingleProductWhatsAppLink } from '../utils/whatsapp';
import { playAddToCartSound } from '../utils/audio';
import { 
  Plus, 
  Minus, 
  MessageCircle, 
  Barcode, 
  Check, 
  Sparkles, 
  ExternalLink
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  employeeName?: string;
  employeeId?: string;
  department?: string;
  onOpenBarcodeDetails?: (product: Product) => void;
  isHighlighted?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  employeeName,
  employeeId,
  department,
  onOpenBarcodeDetails,
  isHighlighted = false,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const discountPercent = Math.round(
    ((product.originalPrice - product.staffPrice) / product.originalPrice) * 100
  );

  const handleAdd = () => {
    onAddToCart(product, quantity);
    playAddToCartSound();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  return (
    <div 
      id={`product-${product.id}`}
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
        isHighlighted
          ? 'ring-4 ring-emerald-500/50 border-emerald-500 shadow-xl scale-[1.02] animate-pulse'
          : 'border-slate-200 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Product Image & Badges */}
      <div className="relative overflow-hidden bg-slate-50 aspect-square">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {isHighlighted && (
            <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-white" />
              NEWLY UPDATED
            </span>
          )}

          <span className="bg-slate-900 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-xs tracking-wider flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-emerald-400" />
            {discountPercent}% OFF
          </span>

          {product.isStaffSpecial && (
            <span className="bg-white/95 text-slate-800 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-slate-200 shadow-xs">
              Staff Clearance
            </span>
          )}
        </div>

        {/* Barcode Tag Button */}
        <button
          onClick={() => onOpenBarcodeDetails?.(product)}
          className="absolute bottom-3 right-3 bg-white text-slate-800 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors flex items-center gap-1.5"
          title="Click to view Barcode"
        >
          <Barcode className="w-3.5 h-3.5 text-slate-700" />
          <span>{product.barcode.slice(-6)}</span>
        </button>
      </div>

      {/* Product Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium mb-1">
            <span className="uppercase tracking-wider font-semibold text-slate-400">{product.brand}</span>
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-[10px] font-bold border border-emerald-100">
              {product.stock} left
            </span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>

          {product.nameAr && (
            <p className="text-xs text-slate-500 font-arabic mt-0.5 line-clamp-1">
              {product.nameAr}
            </p>
          )}

          <div className="text-[11px] text-slate-500 mt-1">
            Unit: <strong className="text-slate-700">{product.unit}</strong>
          </div>
        </div>

        {/* Pricing Block */}
        <div>
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-3 space-y-1">
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                  Staff Subsidized
                </span>
                <div className="text-lg font-black text-slate-900">
                  QAR {product.staffPrice.toFixed(2)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block line-through">
                  Retail QAR {product.originalPrice.toFixed(2)}
                </span>
                <span className="text-[11px] font-bold text-emerald-600">
                  Save QAR {(product.originalPrice - product.staffPrice).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Quantity Controls & Add to Cart */}
          <div className="flex items-center gap-2 mt-3">
            <div className="flex items-center border border-slate-200 rounded-full bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-slate-700 transition-colors"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 text-center text-xs font-bold text-slate-800">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-white text-slate-700 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-full text-xs font-semibold transition-all shadow-xs ${
                justAdded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Added!
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" /> Add to Order
                </>
              )}
            </button>
          </div>

          {/* Quick WhatsApp 1-Click Order Link */}
          <a
            href={createSingleProductWhatsAppLink(
              product,
              employeeName,
              employeeId,
              department
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-full text-[11px] font-semibold transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
            1-Click WhatsApp Order ({COMPANY_INFO.whatsappDisplay})
            <ExternalLink className="w-3 h-3 opacity-60" />
          </a>
        </div>
      </div>
    </div>
  );
};
