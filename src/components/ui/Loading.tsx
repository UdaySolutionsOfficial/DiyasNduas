import React from 'react';
import { Sparkles } from 'lucide-react';

export interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export const Loading: React.FC<LoadingProps> = ({
  message = 'Loading Diyas N Duas...',
  fullScreen = false,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="relative flex items-center justify-center">
        <div className="w-12 h-12 rounded-full border-4 border-brand-200 border-t-brand-500 animate-spin" />
        <Sparkles className="w-5 h-5 text-brand-500 absolute animate-pulse" />
      </div>
      {message && <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-400">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50/80 dark:bg-slate-950/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};
