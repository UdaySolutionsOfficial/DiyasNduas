import React from 'react';

export interface SkeletonLoaderProps {
  variant?: 'text' | 'card' | 'avatar' | 'image';
  className?: string;
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  variant = 'text',
  className = '',
  count = 1,
}) => {
  const base = 'animate-pulse bg-slate-200 dark:bg-slate-800 rounded-xl';

  const variantStyles = {
    text: 'h-4 w-full',
    card: 'h-48 w-full rounded-2xl',
    avatar: 'w-10 h-10 rounded-full',
    image: 'h-40 w-full rounded-xl',
  };

  return (
    <div className="space-y-2.5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${base} ${variantStyles[variant]} ${className}`} />
      ))}
    </div>
  );
};
