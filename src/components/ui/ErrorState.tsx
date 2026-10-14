import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryText?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Unable to load content',
  message = 'We encountered a temporary connection error. Please check your network or try refreshing.',
  onRetry,
  retryText = 'Try Again',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 my-4">
      <div className="p-3.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 mb-3">
        <AlertCircle className="w-7 h-7" />
      </div>
      <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">{title}</h4>
      {message && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm">{message}</p>}
      {onRetry && (
        <Button onClick={onRetry} variant="outline" size="sm" className="mt-4 border-rose-300 text-rose-700 hover:bg-rose-100">
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>{retryText}</span>
        </Button>
      )}
    </div>
  );
};
