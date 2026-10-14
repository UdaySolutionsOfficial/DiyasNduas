import React from 'react';

export interface PillProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export const Pill: React.FC<PillProps> = ({
  children,
  active = false,
  onClick,
  icon,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer select-none active:scale-95 ${
        active
          ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/20'
          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
      } ${className}`}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
};
