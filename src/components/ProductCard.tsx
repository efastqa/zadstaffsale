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
  ExternalLink,
  Ban
} from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product, quantity: number) => void;
  employeeName?: string;
  employeeId?: string;
  department?: string;
  onOpenBarcodeDetails?: (product: Product) => void;
  isHighlighted?: boolean;
  viewMode?: 'grid' | 'list' | 'large';
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  employeeName,
  employeeId,
  department,
  onOpenBarcodeDetails,
  isHighlighted = false,
  viewMode = 'grid',
}) => {
  const isSoldOut = !product.stock || product.stock <= 0;
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    if (isSoldOut) return;
    onAddToCart(product, quantity);
    playAddToCartSound();
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1200);
  };

  // ----------------------------------------------------
  // LIST / COMPACT HORIZONTAL ROW VIEW (SUPER EASY ORDERING ON PHONES)
  // ----------------------------------------------------
  if (viewMode === 'list') {
    return (
      <div 
        id={`product-${product.id}`}
        className={`bg-white rounded-2xl border transition-all p-3 sm:p-4 flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between group ${
          isSoldOut
            ? 'border-slate-200 bg-slate-50/50 opacity-80'
            : isHighlighted
            ? 'ring-4 ring-emerald-500/50 border-emerald-500 shadow-lg scale-[1.01] animate-pulse'
            : 'border-slate-200 shadow-xs hover:border-slate-300 hover:shadow-sm'
        }`}
      >
        {/* Left: Thumbnail & Badges */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-slate-50 rounded-xl border border-slate-100 overflow-hidden shrink-0 flex items-center justify-center p-1">
            <img
              src={product.imageUrl}
              alt={product.name}
              className={`w-full h-full object-contain transition-transform duration-300 ${
                isSoldOut ? 'grayscale opacity-60' : 'group-hover:scale-105'
              }`}
              loading="lazy"
            />
            {isSoldOut && (
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[0.5px] flex items-center justify-center p-1">
                <span className="bg-rose-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm tracking-wider flex items-center gap-0.5">
                  <Ban className="w-2.5 h-2.5" /> Sold Out
                </span>
              </div>
            )}
          </div>

          {/* Details */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
              <span className="uppercase tracking-wider font-semibold text-slate-500 truncate">{product.brand}</span>
              <span>•</span>
              {isSoldOut ? (
                <span className="text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-bold">
                  Sold Out • نفدت الكمية
                </span>
              ) : (
                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                  {product.stock} in stock
                </span>
              )}
            </div>

            <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-tight mt-0.5 line-clamp-2">
              {product.name}
            </h3>

            {product.nameAr && (
              <p className="text-[11px] text-slate-500 font-arabic line-clamp-1">
                {product.nameAr}
              </p>
            )}

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] text-slate-500">
                Unit: <strong className="text-slate-700">{product.unit}</strong>
              </span>
              {product.barcode && (
                <button
                  type="button"
                  onClick={() => onOpenBarcodeDetails?.(product)}
                  className="text-[10px] font-mono text-slate-500 hover:text-slate-900 flex items-center gap-1 bg-slate-100 px-1.5 py-0.5 rounded"
                >
                  <Barcode className="w-3 h-3" />
                  {product.barcode.slice(-6)}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: Pricing & Order Action */}
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
          {/* Price Block - Staff Price Only */}
          <div className="text-left sm:text-right">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Staff Price</div>
            <div className="text-base sm:text-lg font-black text-slate-900 whitespace-nowrap">
              QAR {product.staffPrice.toFixed(2)}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-1.5">
            {isSoldOut ? (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled
                  className="h-8 sm:h-9 px-4 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed flex items-center gap-1"
                >
                  <Ban className="w-3.5 h-3.5" />
                  Sold Out
                </button>
              </div>
            ) : (
              <>
                {/* Quantity */}
                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 active:bg-slate-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-6 text-center text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-7 h-7 flex items-center justify-center rounded hover:bg-white text-slate-700 active:bg-slate-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Add to Cart */}
                <button
                  type="button"
                  onClick={handleAdd}
                  className={`h-8 sm:h-9 px-3 sm:px-4 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-2xs ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 active:scale-95 text-white'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Added!
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" /> Add
                    </>
                  )}
                </button>

                {/* Quick WhatsApp */}
                <a
                  href={createSingleProductWhatsAppLink(
                    product,
                    employeeName,
                    employeeId,
                    department
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="h-8 sm:h-9 w-8 sm:w-9 flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl transition-colors shrink-0"
                  title="1-Click WhatsApp Order"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-600" />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // GRID / COMPACT 2-COLUMN VIEW & LARGE GRID VIEW
  // ----------------------------------------------------
  const isLarge = viewMode === 'large';

  return (
    <div 
      id={`product-${product.id}`}
      className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden group ${
        isSoldOut
          ? 'border-slate-200 bg-slate-50/40 opacity-85'
          : isHighlighted
          ? 'ring-4 ring-emerald-500/50 border-emerald-500 shadow-xl scale-[1.02] animate-pulse'
          : 'border-slate-200 shadow-xs hover:shadow-md'
      }`}
    >
      {/* Product Image Container */}
      <div className={`relative overflow-hidden bg-slate-50 flex items-center justify-center p-2.5 ${
        isLarge ? 'aspect-square sm:aspect-4/3' : 'h-36 sm:h-44 md:h-48'
      }`}>
        <img
          src={product.imageUrl}
          alt={product.name}
          className={`w-full h-full object-contain transition-transform duration-300 ${
            isSoldOut ? 'grayscale opacity-50' : 'group-hover:scale-105'
          }`}
          loading="lazy"
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isSoldOut ? (
            <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full shadow-md tracking-wider flex items-center gap-1">
              <Ban className="w-3 h-3 text-white" />
              Sold Out
            </span>
          ) : (
            <>
              {isHighlighted && (
                <span className="bg-emerald-600 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-white" />
                  NEW
                </span>
              )}

              {product.isStaffSpecial && (
                <span className="bg-white/95 text-slate-800 text-[9px] font-semibold px-1.5 py-0.5 rounded-full border border-slate-200 shadow-xs">
                  Clearance
                </span>
              )}
            </>
          )}
        </div>

        {/* Barcode Tag Button */}
        {product.barcode && (
          <button
            onClick={() => onOpenBarcodeDetails?.(product)}
            className="absolute bottom-2 right-2 bg-white/90 backdrop-blur-xs text-slate-700 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-md border border-slate-200 shadow-2xs hover:bg-white transition-colors flex items-center gap-1"
            title="Click to view Barcode"
          >
            <Barcode className="w-3 h-3 text-slate-600" />
            <span>{product.barcode.slice(-5)}</span>
          </button>
        )}
      </div>

      {/* Product Body */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium mb-0.5">
            <span className="uppercase tracking-wider font-semibold text-slate-500 truncate max-w-[65%]">
              {product.brand}
            </span>
            {isSoldOut ? (
              <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold border border-rose-200 shrink-0">
                Sold Out
              </span>
            ) : (
              <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold border border-emerald-100 shrink-0">
                {product.stock} left
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2">
            {product.name}
          </h3>

          {product.nameAr && (
            <p className="text-[11px] text-slate-500 font-arabic mt-0.5 line-clamp-1">
              {product.nameAr}
            </p>
          )}

          <div className="text-[10px] sm:text-[11px] text-slate-500 mt-1 truncate">
            Unit: <strong className="text-slate-700">{product.unit}</strong>
          </div>
        </div>

        {/* Pricing Block - Staff Price Only */}
        <div>
          <div className="bg-slate-50 border border-slate-200/70 rounded-xl p-2 sm:p-2.5 flex items-center justify-between">
            <div>
              <span className="text-[9px] text-slate-400 uppercase font-bold tracking-wider block">
                Staff Price
              </span>
              <div className="text-sm sm:text-base font-black text-slate-900">
                QAR {product.staffPrice.toFixed(2)}
              </div>
            </div>
            <span className="text-[10px] font-medium text-slate-500 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded-md shadow-2xs">
              /{product.unit}
            </span>
          </div>

          {/* Quantity Controls & Add to Cart */}
          {isSoldOut ? (
            <div className="mt-2.5 space-y-1.5">
              <button
                type="button"
                disabled
                className="w-full flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-bold bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Sold Out • نفدت الكمية</span>
              </button>
            </div>
          ) : (
            <div className="mt-2.5">
              <div className="flex items-center gap-1.5">
                <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50 p-0.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-700 active:bg-slate-200 transition-colors"
                    aria-label="Decrease quantity"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <span className="w-5 text-center text-xs font-bold text-slate-800">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-white text-slate-700 active:bg-slate-200 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all shadow-2xs active:scale-95 ${
                    justAdded
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {justAdded ? (
                    <>
                      <Check className="w-3 h-3" /> Added!
                    </>
                  ) : (
                    <>
                      <Plus className="w-3 h-3" /> Add
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
                className="w-full mt-1.5 flex items-center justify-center gap-1 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] sm:text-[11px] font-semibold transition-colors"
              >
                <MessageCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                <span className="truncate">WhatsApp Order</span>
                <ExternalLink className="w-2.5 h-2.5 opacity-60 shrink-0" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
