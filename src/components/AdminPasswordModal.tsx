import React, { useState } from 'react';
import { Lock, KeyRound, Eye, EyeOff, ShieldCheck, X, ArrowRight, Sparkles, Check } from 'lucide-react';
import { getStoredAdminPassword, saveStoredAdminAuth } from '../utils/storage';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  if (!isOpen) return null;

  const currentSavedPassword = getStoredAdminPassword();

  const handleVerify = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);

    if (!password.trim()) {
      setError('Please enter the Admin security password or PIN.');
      triggerShake();
      return;
    }

    if (password.trim() === currentSavedPassword) {
      saveStoredAdminAuth(true, rememberMe);
      setError(null);
      setPassword('');
      onSuccess();
    } else {
      setError('Incorrect admin password. Please check and try again.');
      triggerShake();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in">
      <div
        className={`bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-transform ${
          shake ? 'animate-bounce' : ''
        }`}
      >
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-slate-100 shadow-inner">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/15 text-slate-200 rounded-full uppercase tracking-wider">
                  Admin Authorization
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-0.5">
                Staff Sales Admin Hub
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Authorized ZAD logistics, dispatch & pricing personnel only.
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleVerify} className="p-6 space-y-4 text-xs">
          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">
              Admin Passcode / Password
            </label>

            <div className="relative">
              <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter admin security password"
                className="w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-slate-900 focus:bg-white focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <p className="text-[11px] text-red-600 font-medium mt-1.5 animate-in fade-in">
                {error}
              </p>
            )}
          </div>

          {/* Quick PIN Keypad buttons for touch devices */}
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              Quick Numeric Input
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  onClick={() => setPassword((prev) => prev + digit)}
                  className="py-2 bg-white hover:bg-slate-200 border border-slate-200/80 rounded-lg font-bold text-slate-800 text-xs shadow-2xs active:scale-95 transition-all"
                >
                  {digit}
                </button>
              ))}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPassword('')}
                className="text-[10px] font-semibold text-slate-500 hover:text-red-600 px-2 py-0.5"
              >
                Clear
              </button>
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-slate-300 accent-slate-900"
            />
            <span className="text-[11px] text-slate-600 font-medium">
              Keep admin session active on this browser
            </span>
          </label>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-full transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
            >
              Unlock Admin Hub <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
