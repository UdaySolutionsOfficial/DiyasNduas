import React, { useEffect, useState, useRef } from 'react';
import { Banner } from '../../types/banner';
import { bannersService } from '../../services/banners.service';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Link } from 'react-router-dom';

export const BannerCarousel: React.FC = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const active = await bannersService.getActiveBanners();
        setBanners(active);
      } catch (err) {
        console.warn('[BannerCarousel]', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBanners();
  }, []);

  const nextSlide = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    if (banners.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  // Auto-play timer
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length, isPaused]);

  if (loading) {
    return (
      <div className="w-full h-48 sm:h-64 md:h-72 rounded-3xl animate-pulse bg-slate-200 dark:bg-slate-800 my-4" />
    );
  }

  // REQUIREMENT 9: Graceful No-Banner State Collapse
  if (!banners || banners.length === 0) {
    return null;
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;

    if (diff > 50) {
      // Swipe left
      nextSlide();
    } else if (diff < -50) {
      // Swipe right
      prevSlide();
    }
    touchStartX.current = null;
  };

  return (
    <div
      className="relative overflow-hidden rounded-3xl shadow-xl shadow-brand-500/10 my-4 group select-none touch-callout-none bg-slate-100 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800/50"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Sliding Track - 100% visible images with ZERO fade effects or darkening overlays */}
      <div
        className="flex h-48 sm:h-64 md:h-72 lg:h-80 w-full transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner, idx) => {
          // Check if there is actual textual title (not just emoji or placeholder)
          const cleanTitle = banner.title?.trim() || '';
          const isEmojiOnly = cleanTitle.length > 0 && /^[\p{Extended_Pictographic}\uFE0F\s]+$/u.test(cleanTitle);
          const hasTitle = Boolean(cleanTitle && !isEmojiOnly && cleanTitle !== '🪔');
          const hasSubtitle = Boolean(banner.subtitle && banner.subtitle.trim());
          const hasButton = Boolean(banner.buttonText && banner.buttonUrl);
          const hasOverlayContent = hasTitle || hasSubtitle || hasButton;

          const slideContent = (
            <div
              key={banner.id || idx}
              className="relative w-full h-full flex-shrink-0 overflow-hidden bg-slate-100 dark:bg-slate-900"
            >
              <picture className="w-full h-full block">
                {banner.mobileImageUrl && (
                  <source media="(max-width: 640px)" srcSet={banner.mobileImageUrl} />
                )}
                <img
                  src={banner.imageUrl}
                  alt={hasTitle ? `${cleanTitle} | Diyas N Duas` : 'Festive Handcrafted Diyas & Sacred Essentials | Diyas N Duas'}
                  className="w-full h-full object-cover select-none"
                  draggable={false}
                  loading={idx === 0 ? 'eager' : 'lazy'}
                  // @ts-ignore
                  fetchpriority={idx === 0 ? 'high' : undefined}
                  width={1376}
                  height={768}
                />
              </picture>

              {/* Text overlay ONLY rendered when there is legitimate text or action button */}
              {hasOverlayContent && (
                <div className="absolute inset-0 p-6 sm:p-10 flex flex-col justify-end max-w-xl text-white pointer-events-none">
                  {hasTitle && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-black/50 backdrop-blur-md border border-white/20 text-[11px] font-bold text-amber-300 w-fit mb-2 shadow-sm">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      <span>Featured Offer</span>
                    </div>
                  )}
                  {hasTitle && (
                    <h2 className="text-xl sm:text-3xl font-black leading-tight tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]">
                      {cleanTitle}
                    </h2>
                  )}
                  {hasSubtitle && (
                    <p className="mt-1 text-xs sm:text-sm text-amber-100/95 line-clamp-2 drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] font-medium">
                      {banner.subtitle}
                    </p>
                  )}
                  {hasButton && (
                    <div className="mt-4 pointer-events-auto">
                      <Link to={banner.buttonUrl!}>
                        <Button
                          size="sm"
                          className="bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold border-none shadow-lg shadow-amber-400/20"
                        >
                          {banner.buttonText}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          );

          if (banner.buttonUrl && !hasButton) {
            return (
              <Link
                key={banner.id || idx}
                to={banner.buttonUrl}
                className="w-full h-full flex-shrink-0 block focus:outline-none"
              >
                {slideContent}
              </Link>
            );
          }

          return slideContent;
        })}
      </div>

      {/* Desktop Prev/Next Controls */}
      {banners.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-md"
            aria-label="Previous Slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={nextSlide}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all opacity-0 group-hover:opacity-100 shadow-md"
            aria-label="Next Slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Pagination Dots */}
      {banners.length > 1 && (
        <div className="absolute bottom-3 right-4 flex gap-1.5 z-10">
          {banners.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 rounded-full transition-all drop-shadow-sm ${
                currentIndex === idx ? 'w-6 bg-amber-400' : 'w-2 bg-white/70 hover:bg-white'
              }`}
              aria-label={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
