import React, { forwardRef } from 'react';
import { Check } from 'lucide-react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({
  label,
  checked,
  onChange,
  className = '',
  id,
  disabled,
  ...props
}, ref) => {
  const checkboxId = id || `chk_${Math.random().toString(36).substr(2, 6)}`;

  return (
    <label htmlFor={checkboxId} className={`inline-flex items-center gap-2.5 cursor-pointer select-none ${disabled ? 'opacity-50 pointer-events-none' : ''} ${className}`}>
      <div className="relative flex items-center justify-center">
        <input
          id={checkboxId}
          ref={ref}
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer sr-only"
          {...props}
        />
        <div className="w-5 h-5 rounded-md border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 transition-all peer-checked:bg-brand-500 peer-checked:border-brand-500 peer-focus:ring-2 peer-focus:ring-brand-500/20" />
        <Check className="w-3.5 h-3.5 text-white absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none stroke-[3]" />
      </div>
      {label && <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>}
    </label>
  );
});

Checkbox.displayName = 'Checkbox';
