import React from 'react';
import { COMPANY_INFO } from '../data/mockData';
import { 
  Sparkles, 
  MessageCircle, 
  Truck, 
  Tag, 
  ArrowDown,
  ShoppingBag,
  Gift
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
      <div className="sm:hidden relative overflow-hidden rounded-2xl bg-slate-900 text-white p-4 border border-slate-800 shadow-xs space-y-3">
        {/* Subtle background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-2.5 relative z-10">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/60 px-2 py-0.5 rounded-full">
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
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 active:bg-emerald-700 text-white font-bold text-xs shadow-xs"
              title="WhatsApp Helpline"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Help</span>
            </a>
            <button
              onClick={onOpenTracking}
              className="p-1.5 rounded-xl bg-white/10 active:bg-white/20 border border-white/15 text-slate-200 text-xs"
              title="Track Order"
            >
              <Truck className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile Corner Callout Card */}
        <div className="relative z-10 p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-850 to-slate-900 border border-emerald-500/30 text-center flex items-center justify-between gap-2">
          <div className="text-left min-w-0 flex-1">
            <div className="text-[10px] font-black text-amber-300 flex items-center gap-1">
              <Gift className="w-3 h-3 text-amber-300 shrink-0" />
              <span>Special offers exclusively for staff — don't miss out!</span>
            </div>
            <div className="text-[9px] text-emerald-300/90 font-arabic truncate mt-0.5">
              عروض وتخفيضات خاصة وحصرية للموظفين
            </div>
          </div>
          <div className="shrink-0 px-2 py-1 rounded-lg bg-amber-400/20 border border-amber-400/40 text-amber-300 font-black text-[10px] tracking-wide whitespace-nowrap">
            HAPPY SHOPPING 🎉
          </div>
        </div>
      </div>

      {/* DESKTOP & TABLET HERO (Full presentation with modern right-side corner badge) */}
      <div className="hidden sm:block relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-sm">
        {/* Subtle background glow effects */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* Left Column: Title & Main Actions */}
          <div className="space-y-4 flex-1">
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
                ZAD Marketing Staff Sales Portal
              </h1>
              <p className="text-sm sm:text-base text-slate-300 font-medium max-w-2xl font-arabic">
                زاد للتسويق والتوزيع • عروض وتخفيضات خاصة وحصرية لموظفي الشركة
              </p>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
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

          {/* Right Corner Modern Callout Card */}
          <div className="lg:w-80 shrink-0">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-850/90 to-slate-900/95 border border-emerald-400/30 p-5 shadow-lg backdrop-blur-md transition-all hover:border-emerald-400/50 group">
              {/* Top Accent Gradient Bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-amber-300 to-emerald-400" />
              
              {/* Subtle background spark circle */}
              <div className="absolute -right-8 -bottom-8 w-28 h-28 rounded-full bg-emerald-500/10 blur-xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />

              <div className="space-y-3 relative z-10 text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-300 text-[11px] font-extrabold uppercase tracking-wider shadow-2xs">
                  <Gift className="w-3.5 h-3.5 text-amber-300" />
                  <span>Exclusive Staff Privilege</span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm sm:text-base font-extrabold text-white leading-snug tracking-tight">
                    Special offers exclusively for staff — don't miss out!
                  </h3>
                  <p className="text-xs text-emerald-300 font-arabic font-medium">
                    عروض وتخفيضات خاصة وحصرية لموظفي زاد
                  </p>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span className="text-xs sm:text-sm font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 uppercase drop-shadow-xs">
                    HAPPY SHOPPING 🎉
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
