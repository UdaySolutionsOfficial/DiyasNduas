import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Product } from '../../types/product';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { formatINR, formatDiscountPercentage } from '../../utils/formatters';
import { Sparkles, ShoppingBag, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useToast } from '../../contexts/ToastContext';

interface HorizontalProductShowcaseProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export const HorizontalProductShowcase: React.FC<HorizontalProductShowcaseProps> = ({
  products,
  onSelectProduct,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Continuous floating offset for sub-pixel smooth 60fps interpolation
  const [currentOffset, setCurrentOffset] = useState(0);
  const targetOffsetRef = useRef(0);
  const currentOffsetRef = useRef(0);

  // Pointer drag & tap interaction state
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const hasCapturedRef = useRef(false);
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const startTimeRef = useRef(0);
  const startTargetOffsetRef = useRef(0);
  const dragDistanceRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const velocityRef = useRef(0);
  const justDraggedRef = useRef(false);

  const [isHovered, setIsHovered] = useState(false);
  const [windowWidth, setWindowWidth] = useState(1200);

  const { addToCart } = useCart();
  const toast = useToast();

  const productCount = products?.length || 0;

  // Track window/screen width for responsive calculations
  useEffect(() => {
    const updateWidth = () => {
      setWindowWidth(window.innerWidth);
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Responsive geometry variables
  const isMobile = windowWidth < 640;
  const isTablet = windowWidth >= 640 && windowWidth < 1024;
  const isDesktopLarge = windowWidth >= 1440;

  // Exact uniform dimensions: cardWidth and cardHeight strictly defined so all cards match 100% in pixel height & width
  // Mobile: cardWidth 216px, cardHeight 340px, itemSpacing 252px (36px clean gap, zero overlap, professional enlarged size)
  // Tablet: cardWidth 250px, cardHeight 375px, itemSpacing 280px
  // Desktop: cardWidth 280px, cardHeight 405px, itemSpacing 300px
  const itemSpacing = isMobile ? 252 : isTablet ? 280 : 300;
  const cardWidth = isMobile ? 216 : isTablet ? 250 : 280;
  const cardHeight = isMobile ? 340 : isTablet ? 375 : 405;
  const visibleRange = isMobile ? 2 : isTablet ? 4 : isDesktopLarge ? 6 : 5;

  // Smooth 60fps physics & spring interpolation loop
  useEffect(() => {
    let animationFrameId: number;

    const animate = () => {
      // Auto-drift when idle (no drag, no hover)
      if (!isPointerDownRef.current && !isDraggingRef.current && !isHovered && productCount > 1) {
        targetOffsetRef.current += 0.0022;
      }

      // Smooth lerp towards target offset
      const diff = targetOffsetRef.current - currentOffsetRef.current;
      if (Math.abs(diff) > 0.0001) {
        currentOffsetRef.current += diff * 0.12;
        setCurrentOffset(currentOffsetRef.current);
      }

      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isHovered, productCount]);

  // Pointer Handlers: Intentionally DO NOT capture pointer immediately on down so clicks fire cleanly
  const handlePointerDown = (e: React.PointerEvent) => {
    if (productCount <= 1) return;
    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    hasCapturedRef.current = false;
    startXRef.current = e.clientX;
    startYRef.current = e.clientY;
    startTimeRef.current = performance.now();
    lastXRef.current = e.clientX;
    lastTimeRef.current = performance.now();
    startTargetOffsetRef.current = targetOffsetRef.current;
    dragDistanceRef.current = 0;
    velocityRef.current = 0;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;

    const currentX = e.clientX;
    const currentY = e.clientY;
    const totalDeltaX = currentX - startXRef.current;
    const totalDeltaY = currentY - startYRef.current;
    const absX = Math.abs(totalDeltaX);

    dragDistanceRef.current = absX;

    // Only initiate dragging mode and pointer capture after surpassing a deliberate threshold (6px)
    if (!isDraggingRef.current && absX > 6 && absX > Math.abs(totalDeltaY)) {
      isDraggingRef.current = true;
      if (!hasCapturedRef.current && containerRef.current) {
        try {
          containerRef.current.setPointerCapture(e.pointerId);
          hasCapturedRef.current = true;
        } catch {
          // Ignore if pointer capture unavailable
        }
      }
    }

    if (isDraggingRef.current) {
      const now = performance.now();
      const dt = Math.max(now - lastTimeRef.current, 1);
      const dx = currentX - lastXRef.current;

      velocityRef.current = dx / dt;
      lastXRef.current = currentX;
      lastTimeRef.current = now;

      // Update target continuous offset
      targetOffsetRef.current = startTargetOffsetRef.current - totalDeltaX / itemSpacing;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    if (hasCapturedRef.current && containerRef.current) {
      try {
        containerRef.current.releasePointerCapture(e.pointerId);
      } catch {
        // Ignore
      }
      hasCapturedRef.current = false;
    }

    if (isDraggingRef.current) {
      // Apply momentum glide if user swiped with velocity
      const momentum = -velocityRef.current * 0.24;
      targetOffsetRef.current += momentum;

      // Snap to nearest integer slot smoothly
      targetOffsetRef.current = Math.round(targetOffsetRef.current);

      // Prevent accidental click right after a drag
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 120);

      isDraggingRef.current = false;
    }
  };

  // Wheel / Trackpad horizontal scroll support
  const handleWheel = (e: React.WheelEvent) => {
    if (productCount <= 1) return;
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) > 4) {
      targetOffsetRef.current += (delta / itemSpacing) * 0.32;
    }
  };

  const handleNav = (direction: 'left' | 'right') => {
    const step = direction === 'left' ? -1 : 1;
    targetOffsetRef.current = Math.round(targetOffsetRef.current) + step;
  };

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.stopPropagation();
    addToCart(product, 1);
    toast.success('Added to Cart!', `"${product.name}" added to your shopping cart.`);
  };

  // Card Click / Tap handler (works seamlessly across desktop mice, trackpads & mobile screens)
  const handleCardClick = (product: Product) => {
    if (dragDistanceRef.current > 6 || justDraggedRef.current) return;
    onSelectProduct(product);
  };

  // Compute visible virtual slots in projected space (spanning full screen)
  const baseSlot = Math.round(currentOffset);
  const slots = useMemo(() => {
    if (productCount === 0) return [];
    const items = [];
    for (let s = baseSlot - visibleRange - 1; s <= baseSlot + visibleRange + 1; s++) {
      const wrappedIndex = ((s % productCount) + productCount) % productCount;
      items.push({ slotIndex: s, product: products[wrappedIndex] });
    }
    return items;
  }, [baseSlot, visibleRange, productCount, products]);

  if (!products || products.length === 0) return null;

  return (
    <section 
      className="space-y-4 py-4 relative z-10 select-none overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Section Header with Clean Title & Navigation Controls */}
      <div className="flex items-center justify-between px-2 sm:px-4 max-w-7xl mx-auto">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight bg-gradient-to-r from-brand-700 via-brand-600 to-amber-500 dark:from-brand-300 dark:via-brand-200 dark:to-amber-400 bg-clip-text text-transparent">
          Featured Festive Showcase
        </h2>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav('left')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-md text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            aria-label="Previous product"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleNav('right')}
            className="p-2.5 rounded-2xl bg-white dark:bg-slate-800 shadow-md text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all border border-slate-200/80 dark:border-slate-700/80 cursor-pointer"
            aria-label="Next product"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Full-Bleed 3D Cylindrical Ring Stage (Breaks out to full screen width) */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onWheel={handleWheel}
        className="relative left-1/2 -translate-x-1/2 w-screen max-w-[100vw] h-[410px] sm:h-[480px] flex items-center justify-center overflow-hidden touch-pan-y cursor-grab active:cursor-grabbing"
        style={{
          perspective: isMobile ? '880px' : '920px',
          perspectiveOrigin: '50% 50%',
        }}
      >
        {/* Ring Center Anchor with transform-style: preserve-3d */}
        <div
          className="relative w-0 h-0 flex items-center justify-center pointer-events-none"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {slots.map(({ slotIndex, product }) => {
            const delta = slotIndex - currentOffset;
            const absDelta = Math.abs(delta);

            // Filter out cards outside visible field
            if (absDelta > visibleRange + 0.8) return null;

            // 1. Projected horizontal position (even gaps, avoids bunching)
            const projectedX = delta * itemSpacing;

            // 2. Concave Inward Rotation: rich 3D lean on both mobile (up to ±34 deg) and desktop (up to ±44 deg)
            const rotateStep = isMobile ? 13 : 14.5;
            const maxRotate = isMobile ? 34 : 44;
            const rotateY = -Math.max(Math.min(delta * rotateStep, maxRotate), -maxRotate);

            // 3. Ring Depth: deep forward cylindrical curve on both mobile (+180px) and desktop (+270px)
            const depthFactor = isMobile ? 38 : 52;
            const maxDepth = isMobile ? 180 : 270;
            const translateZ = Math.min(Math.pow(absDelta, 1.32) * depthFactor, maxDepth);

            // 4. Proportional Scale: Center card is hero, neighbors smoothly stepped
            const isCenterCard = absDelta < 0.5;
            const scale = isCenterCard ? 1.04 : Math.max(0.88, 1 - absDelta * 0.035);

            // 5. Opacity: smooth peripheral fade
            const opacity = Math.max(0.2, 1 - Math.pow(absDelta / (visibleRange + 0.5), 2.2));
            const zIndex = Math.round(300 - absDelta * 12);

            const discount = formatDiscountPercentage(product.originalPrice, product.sellingPrice);
            const imageSrc = product.images?.[0] || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80';

            return (
              <div
                key={`slot-${slotIndex}-${product.id}`}
                onClick={() => handleCardClick(product)}
                className={`absolute rounded-3xl p-3.5 sm:p-4 backdrop-blur-2xl transition-shadow duration-300 pointer-events-auto group select-none cursor-pointer flex flex-col justify-between ${
                  isCenterCard
                    ? 'bg-white/95 dark:bg-slate-900/95 ring-2 ring-brand-500/90 dark:ring-brand-400 border border-white dark:border-brand-500/40 shadow-[0_25px_60px_-10px_rgba(12,137,235,0.4)] dark:shadow-[0_25px_60px_-10px_rgba(12,137,235,0.35)]'
                    : 'bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-xl hover:shadow-2xl'
                }`}
                style={{
                  width: `${cardWidth}px`,
                  height: `${cardHeight}px`,
                  left: `${-cardWidth / 2}px`,
                  top: `${-cardHeight / 2}px`,
                  transform: `translate3d(${projectedX}px, 0px, ${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                  transformStyle: 'preserve-3d',
                  zIndex,
                  opacity,
                  transition: isDraggingRef.current ? 'none' : 'box-shadow 0.3s ease, border-color 0.3s ease',
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                }}
              >
                {/* Fixed Image Container with Inner Vignette & Dynamic 3D Shading */}
                <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden bg-slate-950 flex-shrink-0 shadow-inner border border-slate-100 dark:border-slate-800">
                  <img
                    src={imageSrc}
                    alt={`${product.name} - Handcrafted Diya | Diyas N Duas`}
                    loading="lazy"
                    decoding="async"
                    width={280}
                    height={210}
                    draggable={false}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-85" />

                  {/* Dynamic 3D Curvature Shading Overlay */}
                  {!isCenterCard && (
                    <div 
                      className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                        delta < 0 
                          ? 'bg-gradient-to-r from-black/25 via-transparent to-transparent' 
                          : 'bg-gradient-to-l from-black/25 via-transparent to-transparent'
                      }`} 
                    />
                  )}

                  {/* Badge Tag */}
                  {product.badge && (
                    <div className="absolute top-2.5 left-2.5">
                      <Badge variant="brand" className="text-[10px] px-2 py-0.5 shadow-lg backdrop-blur-md bg-brand-500 text-white border-none font-black">
                        <Sparkles className="w-2.5 h-2.5 mr-1 text-amber-300" />
                        {product.badge}
                      </Badge>
                    </div>
                  )}

                  {/* Discount Tag */}
                  {discount > 0 && (
                    <div className="absolute top-2.5 right-2.5 bg-rose-500 text-white font-black text-[10px] px-2 py-0.5 rounded-xl shadow-md">
                      {discount}% OFF
                    </div>
                  )}

                  {/* Quick View Button */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="secondary"
                      className="rounded-full shadow-lg font-bold text-xs py-1 px-3 bg-white text-slate-900 cursor-pointer"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProduct(product);
                      }}
                    >
                      <Eye className="w-3.5 h-3.5 mr-1" />
                      Quick View
                    </Button>
                  </div>
                </div>

                {/* Product Meta & Details with flex-1 flex flex-col justify-between */}
                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div>
                    <span className="text-[10px] font-black text-brand-600 dark:text-brand-400 uppercase tracking-wider block">
                      {product.categoryName || 'Diyas'}
                    </span>
                    <h3 className="font-black text-sm sm:text-base text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-brand-600 transition-colors">
                      {product.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] sm:text-[11px] text-slate-400 line-through mr-1 font-medium">
                        {formatINR(product.originalPrice)}
                      </span>
                      <span className="text-base sm:text-lg font-black text-brand-600 dark:text-brand-400">
                        {formatINR(product.sellingPrice)}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="primary"
                      className="font-black text-xs btn-shine-sweep rounded-xl shadow-md cursor-pointer px-3 py-1.5"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => handleAddToCart(e, product)}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 mr-1" />
                      <span>Add</span>
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
