import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glass?: boolean;
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  glass = false,
  hoverEffect = false,
  className = '',
  ...props
}) => {
  const base = 'rounded-2xl p-5 border transition-all duration-300';
  const glassStyle = glass
    ? 'glass-card'
    : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-sm';
  const hoverStyle = hoverEffect
    ? 'hover:shadow-glass-hover hover:-translate-y-0.5'
    : '';

  return (
    <div className={`${base} ${glassStyle} ${hoverStyle} ${className}`} {...props}>
      {children}
    </div>
  );
};
