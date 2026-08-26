import React from 'react';
import { COMPANY_INFO } from '../data/mockData';
import { 
  Sparkles, 
  MessageCircle, 
  Building2, 
  ShieldCheck, 
  Truck, 
  Percent, 
  CheckCircle,
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

  return (
    <div className="space-y-4">
      {/* Hero Visual Card */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xs">
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-slate-800/40 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-950/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-slate-200 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Exclusive ZAD Employee Clearance & Welfare Store</span>
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
              href={`https://wa.me/${COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                'Hi ZAD Staff Sales Support, I would like to check current internal employee stock and discounts.'
              )}`}
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

      {/* Trust & Guarantee Micro-Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <MessageCircle className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Direct WhatsApp Orders</h4>
            <p className="text-[11px] text-slate-500">
              One-click checkout to {COMPANY_INFO.whatsappDisplay}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <Tag className="w-5 h-5 text-blue-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Guaranteed Staff Subsidy</h4>
            <p className="text-[11px] text-slate-500">
              30% to 60% below standard Qatar retail rates
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-800">
            <Building2 className="w-5 h-5 text-slate-800" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Department Dispatch</h4>
            <p className="text-[11px] text-slate-500">
              Batched internal logistics to your department
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
