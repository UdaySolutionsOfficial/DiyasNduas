import React from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Product } from '../../types/product';
import { formatINR } from '../../utils/formatters';
import { Sparkles, ArrowRight } from 'lucide-react';

export interface StockIssueItem {
  product: Product;
  requestedQuantity: number;
  availableStock: number;
}

export interface InsufficientStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockIssues: StockIssueItem[];
  onAdjustStock: () => void;
  onReviewCart?: () => void;
  actionText?: string;
}

export const InsufficientStockModal: React.FC<InsufficientStockModalProps> = ({
  isOpen,
  onClose,
  stockIssues,
  onAdjustStock,
  onReviewCart,
  actionText = 'Adjust to Available Stock & Continue',
}) => {
  if (!isOpen || stockIssues.length === 0) return null;

  const totalIssueCount = stockIssues.length;
  const isSingleItem = totalIssueCount === 1;
  const firstIssue = stockIssues[0];

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="max-w-md">
      <div className="space-y-5 text-center animate-scale-in">
        {/* Animated Festive SVG Vector Illustration */}
        <div className="mx-auto w-24 h-24 relative flex items-center justify-center">
          {/* Pulsing Ambient Glow */}
          <div className="absolute inset-0 rounded-full bg-amber-500/20 dark:bg-amber-400/20 animate-ping opacity-50" />
          <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-amber-500/30 via-rose-500/20 to-amber-400/30 blur-md" />

          {/* SVG Vector Artwork */}
          <svg
            className="w-20 h-20 relative z-10 drop-shadow-md"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Soft Shadow Base */}
            <ellipse cx="50" cy="88" rx="36" ry="7" fill="currentColor" className="text-slate-900/10 dark:text-slate-950/40" />

            {/* Handcrafted Terracotta Box Body */}
            <path
              d="M22 42 L50 28 L78 42 L50 56 Z"
              fill="url(#boxLidGradient)"
              stroke="#D97706"
              strokeWidth="1.5"
            />
            <path
              d="M22 42 L50 56 L50 82 L22 68 Z"
              fill="url(#boxLeftGradient)"
              stroke="#B45309"
              strokeWidth="1.5"
            />
            <path
              d="M78 42 L50 56 L50 82 L78 68 Z"
              fill="url(#boxRightGradient)"
              stroke="#92400E"
              strokeWidth="1.5"
            />

            {/* Festive Golden Ribbon */}
            <path d="M50 28 L50 56" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M36 35 L64 49" stroke="#FDE047" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M50 56 L50 82" stroke="#FACC15" strokeWidth="2.5" strokeLinecap="round" />

            {/* Glowing Golden Diya on Top of Package */}
            <ellipse cx="50" cy="30" rx="9" ry="4" fill="#EA580C" />
            <path d="M41 30 Q50 37 59 30 Q50 34 41 30 Z" fill="#C2410C" />
            {/* Sacred Radiant Flame */}
            <path
              d="M50 16 C53 21 54 24 50 27 C46 24 47 21 50 16 Z"
              fill="url(#sacredFlameGrad)"
              className="animate-pulse"
            />
            <circle cx="50" cy="22" r="2" fill="#FEF08A" />

            {/* Amber Alert Badge floating top-right */}
            <g className="animate-bounce" style={{ transformOrigin: '78px 24px' }}>
              <circle cx="78" cy="24" r="13" fill="#EF4444" stroke="#FFFFFF" strokeWidth="2" />
              <path d="M78 18 L78 24" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="78" cy="28.5" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Sparkle Stars */}
            <path d="M20 22 L22 26 L26 28 L22 30 L20 34 L18 30 L14 28 L18 26 Z" fill="#F59E0B" opacity="0.85" />
            <path d="M82 60 L83.5 62.5 L86 63.5 L83.5 64.5 L82 67 L80.5 64.5 L78 63.5 L80.5 62.5 Z" fill="#FBBF24" opacity="0.75" />

            {/* Gradients */}
            <defs>
              <linearGradient id="boxLidGradient" x1="22" y1="28" x2="78" y2="56" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="boxLeftGradient" x1="22" y1="42" x2="50" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#D97706" />
                <stop offset="1" stopColor="#92400E" />
              </linearGradient>
              <linearGradient id="boxRightGradient" x1="50" y1="56" x2="78" y2="82" gradientUnits="userSpaceOnUse">
                <stop stopColor="#B45309" />
                <stop offset="1" stopColor="#78350F" />
              </linearGradient>
              <linearGradient id="sacredFlameGrad" x1="50" y1="16" x2="50" y2="27" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FEF08A" />
                <stop offset="0.4" stopColor="#F59E0B" />
                <stop offset="1" stopColor="#DC2626" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Modal Headline & Narrative */}
        <div className="space-y-1.5 px-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            {isSingleItem && firstIssue.availableStock > 0
              ? `Only ${firstIssue.availableStock} Left in Stock!`
              : 'Limited Handcrafted Stock'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            Our traditional clay diyas are handcrafted in limited festive batches. The quantity requested exceeds our currently available stock.
          </p>
        </div>

        {/* Affected Item(s) Breakdown Card */}
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {stockIssues.map(({ product, requestedQuantity, availableStock }) => (
            <div
              key={product.id}
              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/60 text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={product.images?.[0] || '/logo.png'}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl object-cover bg-amber-100 dark:bg-slate-800 border border-amber-300/40 flex-shrink-0"
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                    {product.name}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold mt-0.5">
                    {formatINR(product.sellingPrice)} each
                  </p>
                </div>
              </div>

              {/* Quantity Adjustment Pill */}
              <div className="flex-shrink-0 text-right">
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className="line-through text-rose-500 font-semibold">{requestedQuantity}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                  <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 font-black">
                    {availableStock} Available
                  </span>
                </div>
                {availableStock <= 0 ? (
                  <span className="text-[10px] font-bold text-rose-600 block mt-0.5">Out of Stock</span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mt-0.5">
                    Ready to Ship
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Action Controls */}
        <div className="pt-2 space-y-2">
          <Button
            onClick={onAdjustStock}
            variant="primary"
            size="lg"
            className="w-full font-black bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white border-none shadow-lg shadow-amber-500/30 rounded-2xl flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>{actionText}</span>
          </Button>

          {onReviewCart ? (
            <Button
              onClick={onReviewCart}
              variant="ghost"
              size="md"
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <span>Return to Cart</span>
            </Button>
          ) : (
            <Button
              onClick={onClose}
              variant="ghost"
              size="md"
              className="w-full text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <span>Keep Items as Is</span>
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
