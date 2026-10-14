import React from 'react';

export interface DividerProps {
  label?: string;
  orientation?: 'horizontal' | 'vertical';
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  label,
  orientation = 'horizontal',
  className = '',
}) => {
  if (orientation === 'vertical') {
    return <div className={`w-px h-full bg-slate-200 dark:bg-slate-800 ${className}`} />;
  }

  if (label) {
    return (
      <div className={`relative flex items-center py-2 ${className}`}>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
        <span className="flex-shrink mx-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
          {label}
        </span>
        <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  return <div className={`w-full border-t border-slate-200 dark:border-slate-800 my-4 ${className}`} />;
};
