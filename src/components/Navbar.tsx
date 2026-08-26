import React from 'react';
import { Logo } from './Logo';
import { EmployeeProfile, CartItem } from '../types';
import { COMPANY_INFO } from '../data/mockData';
import { 
  ShoppingBag, 
  Truck, 
  ShieldCheck, 
  User, 
  MessageCircle, 
  Store,
  ChevronDown,
  Bell
} from 'lucide-react';

interface NavbarProps {
  activeView: 'store' | 'admin' | 'tracking';
  onSelectView: (view: 'store' | 'admin' | 'tracking') => void;
  onOpenCart: () => void;
  cart: CartItem[];
  employeeProfile: EmployeeProfile;
  onOpenProfileModal: () => void;
  pendingOrdersCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeView,
  onSelectView,
  onOpenCart,
  cart,
  employeeProfile,
  onOpenProfileModal,
  pendingOrdersCount = 0,
}) => {
  const totalCartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce(
    (acc, item) => acc + item.product.staffPrice * item.quantity,
    0
  );

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Top micro announcement bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-8 py-1.5 text-[11px] font-medium border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider">
              Staff Portal
            </span>
            <span className="hidden sm:inline text-slate-300">
              ZAD Marketing & Distribution • Employee Welfare & Direct Subsidies (30% - 60% Off)
            </span>
            <span className="sm:hidden text-slate-300">ZAD Staff Store</span>
          </div>

          <div className="flex items-center gap-4">
            <a
              href={`https://wa.me/${COMPANY_INFO.whatsappNumber.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp Helpline: {COMPANY_INFO.whatsappDisplay}</span>
            </a>
            <span className="text-slate-500 hidden md:inline">| Doha, Qatar</span>
          </div>
        </div>
      </div>

      {/* Main Header Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => onSelectView('store')}
            className="cursor-pointer flex items-center shrink-0"
          >
            <Logo size="md" />
          </div>

          {/* Navigation Links - Staff Store, Track Delivery, Admin Portal */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/80 p-1.5 rounded-full border border-slate-200">
            <button
              onClick={() => onSelectView('store')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeView === 'store'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Staff Store
            </button>

            <button
              onClick={() => onSelectView('tracking')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeView === 'tracking'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Track Delivery
            </button>

            <button
              onClick={() => onSelectView('admin')}
              className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeView === 'admin'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Admin Portal</span>
              {pendingOrdersCount > 0 && (
                <span className="flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] shadow-xs">
                  {pendingOrdersCount}
                </span>
              )}
            </button>
          </nav>

          {/* Right Action buttons */}
          <div className="flex items-center gap-3">
            {/* Employee profile badge */}
            <button
              onClick={onOpenProfileModal}
              className="flex items-center gap-3 p-1.5 sm:px-3 sm:py-1.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 transition-all text-left group"
            >
              <div className="w-8 h-8 rounded-full bg-slate-900 text-white font-bold text-xs flex items-center justify-center border-2 border-white shadow-xs">
                {employeeProfile.name ? employeeProfile.name.charAt(0).toUpperCase() : 'Z'}
              </div>
              <div className="hidden sm:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {employeeProfile.name}
                </div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">
                  {employeeProfile.department.split('&')[0]}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 hidden sm:block" />
            </button>

            {/* Cart Drawer Trigger Button */}
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-xs active:scale-98"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4" />
                {totalCartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 w-4 h-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center border border-white">
                    {totalCartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline font-mono">
                {totalCartCount > 0
                  ? `QAR ${cartSubtotal.toFixed(2)}`
                  : 'Cart'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile View Switcher - Store, Track Delivery, Admin Portal */}
        <div className="md:hidden grid grid-cols-3 gap-1.5 py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => onSelectView('store')}
            className={`font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 text-[11px] ${
              activeView === 'store'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            Store
          </button>
          <button
            onClick={() => onSelectView('tracking')}
            className={`font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 text-[11px] ${
              activeView === 'tracking'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            Track
          </button>
          <button
            onClick={() => onSelectView('admin')}
            className={`font-bold py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 text-[11px] relative ${
              activeView === 'admin'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Admin
            {pendingOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
