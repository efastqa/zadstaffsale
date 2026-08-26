import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  className?: string;
  lightMode?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-14',
    xl: 'h-20',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {!imgError ? (
        <img
          src="/image001.jpg"
          alt="ZAD Marketing & Distribution"
          className={`${sizeClasses[size]} w-auto object-contain rounded-lg border border-slate-200/80 shadow-xs`}
          onError={() => setImgError(true)}
        />
      ) : (
        /* High fidelity vector fallback */
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-xs">
            Z
          </div>
          {showSubtitle && (
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-slate-900 leading-tight">
                ZAD MARKETING & DISTRIBUTION
              </span>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest leading-tight">
                Official Staff Sales Portal
              </span>
            </div>
          )}
        </div>
      )}
      {showSubtitle && !imgError && (
        <div className="hidden sm:flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider">
              Staff Sales Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Internal Store
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
