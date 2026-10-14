import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home } from 'lucide-react';
import { ROUTES } from '../../constants/routes';
import { Button } from '../ui/Button';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <div className="max-w-md w-full text-center space-y-6 p-8 rounded-3xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-hero-gradient flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
          <Sparkles className="w-8 h-8 text-amber-300" />
        </div>

        <div className="space-y-2">
          <span className="text-4xl font-mono font-black text-brand-600 dark:text-brand-400">404</span>
          <h1 className="text-2xl font-black">Page Not Found</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            The page or route you are looking for does not exist or has been moved.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ROUTES.CUSTOMER.HOME} className="w-full">
            <Button variant="primary" size="md" className="w-full font-bold">
              <Home className="w-4 h-4 mr-2" />
              <span>Return Home</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
