import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  ariaLabel,
  variant = 'ghost',
  size = 'md',
  className = '',
  disabled,
  ...props
}) => {
  const base = 'inline-flex items-center justify-center rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:pointer-events-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white shadow-sm focus:ring-brand-500',
    secondary: 'bg-brand-100 hover:bg-brand-200 text-brand-800 dark:bg-brand-900/60 dark:hover:bg-brand-900 dark:text-brand-100 focus:ring-brand-400',
    outline: 'border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 focus:ring-brand-500',
    ghost: 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:ring-slate-400',
    destructive: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 hover:bg-rose-100 focus:ring-rose-500',
  };

  const sizeStyles = {
    sm: 'w-8 h-8 p-1.5 text-xs',
    md: 'w-10 h-10 p-2 text-sm',
    lg: 'w-12 h-12 p-3 text-base',
  };

  return (
    <button
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`${base} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );
};
