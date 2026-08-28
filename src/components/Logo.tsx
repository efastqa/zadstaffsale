import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  variant?: 'horizontal' | 'stacked';
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showSubtitle = true,
  variant = 'horizontal',
  className = '',
}) => {
  // Dimensions and text sizes
  const config = {
    sm: {
      emblemW: 54,
      emblemH: 32,
      arabicText: 'text-xs',
      englishText: 'text-[9px]',
      gap: 'gap-2.5',
    },
    md: {
      emblemW: 72,
      emblemH: 42,
      arabicText: 'text-sm',
      englishText: 'text-[11px]',
      gap: 'gap-3',
    },
    lg: {
      emblemW: 96,
      emblemH: 56,
      arabicText: 'text-lg',
      englishText: 'text-xs',
      gap: 'gap-3.5',
    },
    xl: {
      emblemW: 130,
      emblemH: 76,
      arabicText: 'text-2xl',
      englishText: 'text-sm',
      gap: 'gap-4',
    },
  }[size];

  // The official ZAD Blue Oval with orbiting swoosh and white serif text
  const Emblem = (
    <div
      className="relative shrink-0 flex items-center justify-center select-none"
      style={{ width: config.emblemW, height: config.emblemH }}
    >
      <svg
        viewBox="0 0 160 90"
        className="w-full h-full drop-shadow-xs"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer Orbit Swoosh Ring */}
        <ellipse
          cx="80"
          cy="45"
          rx="72"
          ry="38"
          stroke="#002D62"
          strokeWidth="6"
          strokeDasharray="220 80"
          transform="rotate(-8 80 45)"
        />
        <path
          d="M 12 55 C 8 25, 60 10, 115 12 C 145 14, 155 28, 152 42"
          stroke="#002D62"
          strokeWidth="3.5"
          strokeLinecap="round"
        />

        {/* Primary Deep Navy Oval */}
        <ellipse
          cx="80"
          cy="45"
          rx="60"
          ry="31"
          fill="#002D62"
        />

        {/* Subtle Oval Gloss Highlight */}
        <path
          d="M 30 38 C 45 23, 115 23, 130 38 C 115 28, 45 28, 30 38 Z"
          fill="rgba(255, 255, 255, 0.25)"
        />

        {/* Bold Serif "ZAD" Typography */}
        <text
          x="80"
          y="56"
          fill="#FFFFFF"
          fontFamily="'Times New Roman', 'Georgia', 'Liberation Serif', serif"
          fontSize="36"
          fontWeight="900"
          letterSpacing="1.5"
          textAnchor="middle"
        >
          ZAD
        </text>
      </svg>
    </div>
  );

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        {Emblem}
        <div className="mt-1.5 flex flex-col items-center">
          <span
            className={`font-black text-[#002D62] tracking-normal leading-tight font-['Tajawal',sans-serif] ${config.arabicText}`}
            dir="rtl"
          >
            زاد للتسويق والتوزيع
          </span>
          <span
            className={`font-black text-[#002D62] tracking-wider uppercase leading-tight font-sans ${config.englishText}`}
          >
            ZAD MARKETING &amp; DISTRIBUTION
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center ${config.gap} select-none ${className}`}>
      {/* Emblem Icon */}
      {Emblem}

      {/* Official Bilingual Company Branding */}
      <div className="flex flex-col justify-center">
        {/* Arabic Brand Header */}
        <span
          className={`font-black text-[#002D62] tracking-normal leading-snug font-['Tajawal',sans-serif] ${config.arabicText}`}
          dir="rtl"
        >
          زاد للتسويق والتوزيع
        </span>

        {/* English Brand Subtitle */}
        <span
          className={`font-extrabold text-[#002D62] tracking-wider uppercase leading-none font-sans ${config.englishText}`}
        >
          ZAD MARKETING &amp; DISTRIBUTION
        </span>

        {/* Optional Portal Badge */}
        {showSubtitle && (
          <div className="hidden lg:flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              Staff Sales Portal
            </span>
            <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Store
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

