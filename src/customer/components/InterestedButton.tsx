import React from 'react';
import { MessageCircle } from 'lucide-react';
import { Product } from '../../types/product';
import { openWhatsAppProductInterest } from '../../utils/whatsapp';
import { settingsService } from '../../services/settings.service';

export interface InterestedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  product: Product;
  label?: string;
}

export const InterestedButton: React.FC<InterestedButtonProps> = ({
  product,
  label = "I'm Interested",
  className = '',
  onClick,
  onPointerDown,
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onClick) {
      onClick(e);
    }
    const settings = settingsService.getCachedSettings();
    openWhatsAppProductInterest(product, settings?.whatsappNumber, settings?.storeName);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      onPointerDown={onPointerDown}
      className={`relative inline-flex items-center justify-center gap-1 sm:gap-1.5 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs transition-all duration-200 cursor-pointer select-none active:scale-[0.98] ${className}`}
      title={`Express interest in "${product.name}" via WhatsApp`}
      aria-label={`I'm interested in ${product.name} (WhatsApp inquiry)`}
      {...props}
    >
      <MessageCircle className="w-3.5 h-3.5 flex-shrink-0 fill-current text-white" />
      <span className="whitespace-nowrap truncate">{label}</span>
    </button>
  );
};
