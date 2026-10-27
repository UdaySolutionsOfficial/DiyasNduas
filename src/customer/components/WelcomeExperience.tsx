import React, { useEffect, useState, useRef } from 'react';
import { settingsService } from '../../services/settings.service';

export interface WelcomeExperienceProps {
  onComplete: () => void;
}

export const WelcomeExperience: React.FC<WelcomeExperienceProps> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoFailed, setVideoFailed] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  // Synchronous initial value from local persistent cache (0ms latency, zero flash)
  const cached = settingsService.getCachedSettings();
  const [logoUrl, setLogoUrl] = useState(cached.logoUrl || '/logo.png');
  const [storeName, setStoreName] = useState(cached.storeName || 'Diyas N Duas');

  const handleFinish = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    sessionStorage.setItem('ck_welcome_seen', 'true');
    // Notify app modals that welcome animation has completed so they can trigger naturally
    window.dispatchEvent(new CustomEvent('welcome-animation-completed'));
    setFade(true);
    setTimeout(() => {
      onComplete();
    }, 600);
  };

  useEffect(() => {
    // Subscribe to store settings for real-time cloud updates
    const unsubscribe = settingsService.subscribeToStoreSettings((s) => {
      if (s.logoUrl) setLogoUrl(s.logoUrl);
      if (s.storeName) setStoreName(s.storeName);
    });

    // Safety timeout: If video doesn't play within 3.5s (e.g. slow 2G/offline), gracefully exit
    const bufferTimeout = setTimeout(() => {
      if (!isPlaying) {
        console.info('[WelcomeExperience] Video buffering exceeded timeout, falling back smoothly.');
        handleFinish();
      }
    }, 3500);

    // Hard ceiling timeout: Ensure customer enters the store even if video events fail to fire (10.5s)
    const maxDurationTimeout = setTimeout(() => {
      handleFinish();
    }, 10500);

    return () => {
      unsubscribe();
      clearTimeout(bufferTimeout);
      clearTimeout(maxDurationTimeout);
    };
  }, [isPlaying]);

  // Attempt autoPlay as soon as component mounts
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.play().catch((err) => {
        console.warn('[WelcomeExperience] Autoplay prevented or failed:', err);
      });
    }
  }, []);

  const handleVideoError = () => {
    console.warn('[WelcomeExperience] Video failed to load, falling back to logo intro.');
    setVideoFailed(true);
    // Fall back to 1.4s static logo display
    setTimeout(() => {
      handleFinish();
    }, 1400);
  };

  return (
    <div
      onClick={handleFinish}
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-white text-slate-900 select-none transition-all duration-700 ease-out cursor-pointer ${
        fade ? 'opacity-0 scale-[1.01] pointer-events-none' : 'opacity-100 scale-100'
      }`}
      aria-label="Welcome to Diyas N Duas"
    >
      {/* Main Center Container */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4 flex flex-col items-center justify-center">
        {!videoFailed ? (
          <div className="relative w-full flex items-center justify-center">
            {/* Seamless White Fallback Poster (visible while video buffers, then cross-fades smoothly) */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-500 pointer-events-none bg-white ${
                isPlaying ? 'opacity-0' : 'opacity-100'
              }`}
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden shadow-lg border-2 border-amber-400 p-0.5 bg-white animate-pulse">
                <img
                  src={logoUrl || '/logo.png'}
                  alt={`${storeName} Logo`}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <p className="mt-4 text-2xl sm:text-3xl font-black text-slate-900">
                {storeName}
              </p>
            </div>

            {/* Seamless Natural Animation Video with Zero Borders/Zero Letterboxing */}
            <video
              ref={videoRef}
              src="/logo-animation.mp4"
              playsInline
              autoPlay
              muted
              preload="auto"
              disablePictureInPicture
              disableRemotePlayback
              controls={false}
              onPlay={() => setIsPlaying(true)}
              onPlaying={() => setIsPlaying(true)}
              onEnded={handleFinish}
              onError={handleVideoError}
              className={`w-full max-w-3xl max-h-[85vh] object-contain transition-opacity duration-500 pointer-events-none ${
                isPlaying ? 'opacity-100' : 'opacity-0'
              }`}
            />
          </div>
        ) : (
          /* Fallback Brand Card if Video Fails on Slow Connection */
          <div className="text-center space-y-4 px-6 animate-scale-in">
            <div className="w-24 h-24 rounded-full mx-auto overflow-hidden shadow-lg border-2 border-amber-400 p-0.5 bg-white animate-pulse">
              <img
                src={logoUrl || '/logo.png'}
                alt={`${storeName} Logo`}
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div className="space-y-1">
              <p className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
                {storeName}
              </p>
              <p className="text-xs font-semibold text-amber-600 tracking-widest uppercase">
                Handcrafted Festive Diyas & Sacred Light
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
