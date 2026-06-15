import React from 'react';

const BrandLogo = ({ compact = false, tone = 'light', size = 'md', showText = true }) => {
  const isDark = tone === 'dark';
  const sizeClass = size === 'sm'
    ? 'max-w-[100px] w-full h-auto'
    : size === 'lg'
      ? 'max-w-[180px] w-full h-auto'
      : size === 'xl'
        ? 'max-w-[220px] w-full h-auto'
        : size === 'xxl'
          ? 'max-w-[300px] w-full h-auto'
          : size === 'hero'
            ? 'max-w-[400px] w-full h-auto'
            : 'max-w-[160px] w-full h-auto'; // md size

  const fitClass = 'object-contain object-center';
  const wordmarkClass = isDark ? 'text-white' : 'text-[#0b3b4f]';
  const subtitleClass = isDark ? 'text-emerald-100' : 'text-slate-500';
  const logoClass = isDark ? 'drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]' : 'drop-shadow-[0_6px_14px_rgba(15,23,42,0.08)]';

  return (
    <div className={`flex ${compact ? 'items-center gap-2' : 'flex-col items-center justify-center gap-2 select-none text-center w-full max-w-none'}`}>
      <img
        src="/MedicareLogo.png"
        alt="MediCare logo"
        className={`${sizeClass} ${fitClass} ${logoClass}`}
      />
    </div>
  );
};

export default BrandLogo;
