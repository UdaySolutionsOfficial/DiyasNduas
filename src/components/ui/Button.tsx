import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'inline-flex flex-row items-center justify-center whitespace-nowrap font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none select-none touch-callout-none cursor-pointer';

  const variantStyles = {
    primary: 'bg-brand-500 hover:bg-brand-600 active:bg-brand-700 text-white shadow-md shadow-brand-500/20 focus:ring-brand-500 border border-transparent',
    secondary: 'bg-brand-100 hover:bg-brand-200 active:bg-brand-300 text-brand-800 dark:bg-brand-900/60 dark:hover:bg-brand-900 dark:text-brand-100 focus:ring-brand-400 border border-brand-200/50 dark:border-brand-800/50',
    outline: 'border-2 border-brand-500 text-brand-600 hover:bg-brand-50 active:bg-brand-100 dark:text-brand-400 dark:hover:bg-brand-950/40 focus:ring-brand-500',
    ghost: 'text-slate-700 hover:bg-slate-100 active:bg-slate-200 dark:text-slate-200 dark:hover:bg-slate-800/60 focus:ring-slate-400 border border-transparent',
    destructive: 'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-md shadow-rose-600/20 focus:ring-rose-500 border border-transparent',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3.5 text-base font-semibold gap-2.5',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <LoadingSpinner size="sm" className="text-current" />
      ) : (
        leftIcon
      )}
      <span className="inline-flex items-center gap-1.5">{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
};
