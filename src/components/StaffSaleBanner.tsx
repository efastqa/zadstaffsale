import React from 'react';
import { COMPANY_INFO } from '../data/mockData';
import { 
  Sparkles, 
  MessageCircle, 
  Truck, 
  Tag, 
  ArrowDown 
} from 'lucide-react';

interface StaffSaleBannerProps {
  onOpenTracking: () => void;
  onScrollToCatalog?: () => void;
}

export const StaffSaleBanner: React.FC<StaffSaleBannerProps> = ({
  onOpenTracking,
  onScrollToCatalog,
}) => {
  const handleScroll = () => {
    if (onScrollToCatalog) {
      onScrollToCatalog();
    } else {
      const catalogEl = document.getElementById('staff-catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const whatsappHref = `https://wa.me/${COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
    'Hi ZAD Staff Sales Support, I would like to check current internal employee stock and discounts.'
  )}`;

  return (
    <div className="space-y-2 sm:space-y-4">
      {/* MOBILE COMPACT HERO (Space-saving for fast ordering on phones) */}
      <div className="sm:hidden relative overflow-hidden rounded-2xl bg-slate-900 text-white p-3.5 border border-slate-800 shadow-xs">
        <div className="flex items-center justify-between gap-2.5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-1.5 py-0.2 rounded-md">
                <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
                Staff Subsidies Active
              </span>
            </div>
            <h1 className="text-sm font-extrabold text-white leading-tight tracking-tight">
              ZAD Staff Sales Portal
            </h1>
            <p className="text-[10px] text-slate-300 font-arabic truncate mt-0.5">
              زاد للتسويق والتوزيع • عروض خاصة لموظفي الشركة
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              title="WhatsApp Helpline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Helpline</span>
            </a>
            <button
              onClick={onOpenTracking}
              className="p-1.5 rounded-lg bg-white/10 active:bg-white/20 border border-white/15 text-slate-200 text-xs"
              title="Track Order"
            >
              <Truck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* DESKTOP HERO (Full presentation) */}
      <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xs">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-950/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Exclusive ZAD Employee Clearance & Welfare Store</span>
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
              <span>One-Time Order Quota: Max QAR 200 / Employee</span>
            </span>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              ZAD Marketing Staff Sales Portal
            </h1>
            <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl font-arabic">
              زاد للتسويق والتوزيع • عروض وتخفيضات خاصة وحصرية لموظفي الشركة
            </p>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
            Order directly via official WhatsApp to <strong className="text-white font-bold">{COMPANY_INFO.whatsappDisplay}</strong>. 
            Subsidized clearance FMCG items delivered directly to your <strong className="text-emerald-400">Department Hub</strong> or warehouse pickup counter.
          </p>

          <div className="flex flex-wrap items-center gap-2.5 pt-2">
            <button
              onClick={handleScroll}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 font-semibold text-xs sm:text-sm hover:bg-slate-100 transition-all shadow-xs active:scale-98"
            >
              <Tag className="w-4 h-4 text-slate-900" />
              Browse Subsidized Catalog
              <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs active:scale-98"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Helpline
            </a>

            <button
              onClick={onOpenTracking}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-slate-200 hover:text-white font-semibold text-xs transition-all"
            >
              <Truck className="w-4 h-4 text-slate-300" />
              Track Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
