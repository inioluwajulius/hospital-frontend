import React from 'react';

const BrandLogo = ({ compact = false, tone = 'light', size = 'md', showText = true }) => {
  const isDark = tone === 'dark';
  const sizeClass = size === 'sm'
    ? 'w-12 h-12'
    : size === 'lg'
      ? 'w-20 h-20'
      : size === 'xl'
        ? 'w-[150px] h-[150px]'
        : size === 'xxl'
          ? 'w-[240px] h-[240px]'
          : size === 'hero'
            ? 'w-[340px] h-[210px]'
            : 'w-16 h-16';
  const fitClass = size === 'hero' ? 'object-contain object-center' : 'object-contain';
  const wordmarkClass = isDark ? 'text-white' : 'text-[#0b3b4f]';
  const subtitleClass = isDark ? 'text-teal-100' : 'text-slate-500';
  const logoClass = isDark ? 'drop-shadow-[0_6px_14px_rgba(0,0,0,0.18)]' : 'drop-shadow-[0_6px_14px_rgba(15,23,42,0.08)]';

  return (
    <div className={`flex ${compact ? 'items-center gap-2' : 'flex-col items-center justify-center gap-5 select-none text-center w-full max-w-none'}`}>
      <img
        src="/MedicareLogo.png"
        alt="MediCare logo"
        className={`${sizeClass} ${fitClass} ${logoClass}`}
      />

      {!compact && showText && (
        <div className="leading-none w-full">
          <div className={`text-[2.55rem] font-semibold tracking-[-0.05em] ${wordmarkClass}`}>MediCare</div>
          <p className={`mt-2 text-[0.74rem] font-medium tracking-[0.18em] uppercase ${subtitleClass}`}>
            Hospital Management System
          </p>
        </div>
      )}
    </div>
  );
};

export default BrandLogo;
