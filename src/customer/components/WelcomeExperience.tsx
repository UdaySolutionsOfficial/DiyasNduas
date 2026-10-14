import React, { useEffect, useState } from 'react';

export const WelcomeExperience: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [fade, setFade] = useState(false);

  useEffect(() => {
    // 1.2s delay before fade out begins
    const timer1 = setTimeout(() => {
      setFade(true);
    }, 1200);

    // 1.6s total duration before unmounting intro
    const timer2 = setTimeout(() => {
      onComplete();
    }, 1600);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950 text-white transition-opacity duration-500 ${
        fade ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="text-center space-y-4 px-6 animate-scale-in">
        <div className="w-20 h-20 rounded-full mx-auto overflow-hidden shadow-2xl shadow-amber-500/40 border-2 border-amber-400/80 p-0.5 bg-slate-900">
          <img
            src="/logo.png"
            alt="Diyas N Duas Logo"
            className="w-full h-full object-cover rounded-full"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
            DIYAS N DUAS
          </h1>
          <p className="text-xs font-semibold text-amber-300 tracking-widest uppercase">
            Handcrafted Festive Diyas & Sacred Light
          </p>
        </div>
      </div>
    </div>
  );
};
