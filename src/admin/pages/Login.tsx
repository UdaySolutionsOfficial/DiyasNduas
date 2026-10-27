import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { adminAuthService } from '../../services/adminAuth.service';
import { settingsService } from '../../services/settings.service';
import { ROUTES } from '../../constants/routes';
import { useToast } from '../../contexts/ToastContext';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const cached = settingsService.getCachedSettings();
  const [logoUrl, setLogoUrl] = useState(cached.logoUrl || '/logo.png');
  const [storeName, setStoreName] = useState(cached.storeName || 'Diyas N Duas');

  useEffect(() => {
    const unsub = settingsService.subscribeToStoreSettings((s) => {
      if (s.logoUrl) setLogoUrl(s.logoUrl);
      if (s.storeName) setStoreName(s.storeName);
    });
    return () => unsub();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.warning('Missing Credentials', 'Please enter your admin email and password.');
      return;
    }

    try {
      setLoading(true);
      await adminAuthService.login(email, password);
      toast.success('Welcome Back', 'Successfully signed into Diyas N Duas admin panel.');
      navigate(ROUTES.ADMIN.DASHBOARD);
    } catch (err: any) {
      console.error('[AdminLogin]', err);
      toast.error('Authentication Error', err.message || 'Invalid credentials or permissions.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-ambient">
      <Card glass className="max-w-md w-full p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <img
            src={logoUrl || '/logo.png'}
            alt={`${storeName} Logo`}
            className="w-16 h-16 rounded-full mx-auto object-cover shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/60"
          />
          <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100">{storeName}</h1>
          <p className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">Admin Portal Login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 pt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Admin Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@diyasnduas.com"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <Button type="submit" isLoading={loading} className="w-full mt-4" size="lg">
            Sign Into Dashboard
          </Button>
        </form>
      </Card>
    </div>
  );
};
