import React from 'react';
import { SearchInput } from '../../components/ui/SearchInput';

export interface ProductSearchProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  resultCount?: number;
}

export const ProductSearch: React.FC<ProductSearchProps> = ({
  searchTerm,
  onSearchChange,
  resultCount,
}) => {
  return (
    <div className="space-y-2">
      <SearchInput
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        onClear={() => onSearchChange('')}
        placeholder="Search handcrafted diyas, brass lamps, sacred essentials..."
      />

      {Boolean(searchTerm) && (
        <div className="flex items-center justify-between text-xs text-slate-500 px-1">
          <span>
            Showing results for <strong className="text-slate-900 dark:text-slate-100">"{searchTerm}"</strong>
          </span>
          {resultCount !== undefined && (
            <span className="font-semibold text-brand-600 dark:text-brand-400">
              {resultCount} {resultCount === 1 ? 'item' : 'items'}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
