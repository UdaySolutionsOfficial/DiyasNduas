import React, { useEffect, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useToast } from '../../contexts/ToastContext';
import { fcmService, DeviceSubscriber } from '../../services/fcm.service';
import { 
  BellRing, 
  Send, 
  Sparkles, 
  Smartphone, 
  Users, 
  Image as ImageIcon, 
  Link as LinkIcon, 
  CheckCircle2, 
  RefreshCw,
  Globe,
  Radio,
  Clock
} from 'lucide-react';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { formatDate } from '../../utils/formatters';

export const AdminCampaigns: React.FC = () => {
  const toast = useToast();

  const [subscribers, setSubscribers] = useState<DeviceSubscriber[]>([]);
  const [loadingSubscribers, setLoadingSubscribers] = useState(true);

  // Form State
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [imageUrl, setImageUrl] = useState('/og-products.jpg');
  const [actionUrl, setActionUrl] = useState('/products');
  const [isSending, setIsSending] = useState(false);

  // History state
  const [pastCampaigns, setPastCampaigns] = useState<any[]>([]);

  const loadSubscribersAndHistory = async () => {
    setLoadingSubscribers(true);
    try {
      const subs = await fcmService.getSubscribers();
      setSubscribers(subs);

      // Load past campaigns from firestore
      try {
        const q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'), limit(10));
        const snap = await getDocs(q);
        const history: any[] = [];
        snap.forEach((doc) => history.push({ id: doc.id, ...doc.data() }));
        setPastCampaigns(history);
      } catch {
        // ignore
      }
    } finally {
      setLoadingSubscribers(false);
    }
  };

  useEffect(() => {
    loadSubscribersAndHistory();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !body.trim()) {
      toast.warning('Incomplete Campaign', 'Please provide both a Title and Message for the broadcast.');
      return;
    }

    try {
      setIsSending(true);

      const res = await fcmService.broadcastCampaign({
        title: title.trim(),
        body: body.trim(),
        imageUrl: imageUrl.trim() || undefined,
        actionUrl: actionUrl.trim() || '/products',
      });

      toast.success(
        'Campaign Sent!',
        `Broadcast dispatched to ${res.recipientCount || subscribers.length} registered customer devices with sound chimes.`
      );

      // Clear form & reload
      setTitle('');
      setBody('');
      loadSubscribersAndHistory();
    } catch (err: any) {
      toast.error('Dispatch Failed', err.message || 'Could not send push notification.');
    } finally {
      setIsSending(false);
    }
  };

  const setPreset = (type: 'flash_sale' | 'diwali_offer' | 'new_diyas') => {
    if (type === 'flash_sale') {
      setTitle('⚡ 20% OFF Festive Flash Sale!');
      setBody('Exclusive offer on handcrafted clay diyas & brass deepams. Use code DIWALI20 at checkout.');
      setImageUrl('/og-products.jpg');
      setActionUrl('/products');
    } else if (type === 'diwali_offer') {
      setTitle('🪔 Celebrate Diwali with Sacred Light');
      setBody('Explore our fresh arrival of terracotta lamps and lotus urlis. Free delivery for orders above ₹1000!');
      setImageUrl('/og-home.jpg');
      setActionUrl('/products');
    } else {
      setTitle('✨ New Sacred Brass Deepams In Stock!');
      setBody('Handcrafted akhand deepams and puja thalis are now live. Limited festive stock available.');
      setImageUrl('/pwa_install_banner.jpg');
      setActionUrl('/products');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-12 max-w-6xl mx-auto">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-xs font-black tracking-wider uppercase mb-1">
            <Radio className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span>FCM Push Notification Broadcast Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
            Customer Push Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Broadcast marketing announcements and special festive offers directly to customers' lock screens.
          </p>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={loadSubscribersAndHistory}
          isLoading={loadingSubscribers}
          className="self-start sm:self-center font-bold text-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
          <span>Refresh Audience</span>
        </Button>
      </div>

      {/* Audience Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card glass className="p-4 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-brand-100 dark:bg-brand-950 text-brand-600">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Subscribed Devices</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {subscribers.length}
            </span>
          </div>
        </Card>

        <Card glass className="p-4 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
            <Globe className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Unique Network IPs</span>
            <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
              {new Set(subscribers.map((s) => s.ipAddress).filter(Boolean)).size || subscribers.length}
            </span>
          </div>
        </Card>

        <Card glass className="p-4 rounded-3xl flex items-center gap-4">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600">
            <BellRing className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-bold block">Lock-Screen Reach</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Background Push Active</span>
            </span>
          </div>
        </Card>
      </div>

      {/* Main Two-Column Layout: Form & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Compose Form */}
        <div className="lg:col-span-7 space-y-6">
          <Card glass className="p-6 rounded-3xl space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Send className="w-5 h-5 text-amber-500" />
                <span>Compose Campaign</span>
              </h2>

              {/* Quick Template Presets */}
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-400 hidden sm:inline">Presets:</span>
                <button
                  type="button"
                  onClick={() => setPreset('flash_sale')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold hover:bg-amber-100 hover:text-amber-900 transition-colors"
                >
                  Flash Sale
                </button>
                <button
                  type="button"
                  onClick={() => setPreset('diwali_offer')}
                  className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold hover:bg-amber-100 hover:text-amber-900 transition-colors"
                >
                  Diwali
                </button>
              </div>
            </div>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Campaign Title *
                </label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 🪔 Special Diwali 20% OFF Handcrafted Diyas"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Notification Message / Description *
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="e.g. Celebrate this festive season with sacred terracotta and brass lamps. Fast delivery across India!"
                  rows={3}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-900/50 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                    <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Banner Image URL</span>
                  </label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="e.g. /og-products.jpg"
                  />
                  <div className="flex gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setImageUrl('/og-products.jpg')}
                      className="text-[10px] text-brand-600 hover:underline"
                    >
                      Catalog Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('/og-home.jpg')}
                      className="text-[10px] text-brand-600 hover:underline"
                    >
                      Diwali Temple
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUrl('/pwa_install_banner.jpg')}
                      className="text-[10px] text-brand-600 hover:underline"
                    >
                      Festive Diya
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1 mb-1">
                    <LinkIcon className="w-3.5 h-3.5 text-amber-500" />
                    <span>Target Route / URL</span>
                  </label>
                  <Input
                    value={actionUrl}
                    onChange={(e) => setActionUrl(e.target.value)}
                    placeholder="e.g. /products or /checkout"
                  />
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Where the user will land upon tapping the push notification.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  isLoading={isSending}
                  className="w-full font-extrabold btn-shine-sweep bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-slate-950 border-none shadow-xl shadow-amber-500/25 rounded-2xl py-3 sm:py-3.5 px-3 sm:px-6 transition-all"
                  leftIcon={<Send className="w-4 h-4 text-slate-950 flex-shrink-0" />}
                >
                  <span className="text-xs sm:text-sm font-black tracking-normal uppercase text-center leading-snug">
                    <span className="sm:hidden">Broadcast to {subscribers.length} Devices</span>
                    <span className="hidden sm:inline">Broadcast Push Notification ({subscribers.length} Devices)</span>
                  </span>
                </Button>
              </div>
            </form>
          </Card>
        </div>

        {/* Right Column: Live Mobile Push Preview Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 block px-1">
              Mobile Lock-Screen Live Preview
            </span>

            {/* Mobile Notification Mockup */}
            <div className="p-4 rounded-3xl bg-slate-950 text-white shadow-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-2">
                <div className="flex items-center gap-1.5">
                  <img src="/logo.png" alt="Logo" className="w-4 h-4 rounded-full ring-1 ring-amber-400" />
                  <span className="font-bold text-slate-200">DIYAS N DUAS</span>
                  <span>•</span>
                  <span>Just now</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400 text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" />
                  <span>Sound Chime</span>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-extrabold text-sm text-slate-100">
                  {title || '🪔 Special Festive Announcement'}
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed font-normal">
                  {body || 'Your message will appear here with rich visuals and instant device audio alert.'}
                </p>
              </div>

              {Boolean(imageUrl) && (
                <div className="relative rounded-2xl overflow-hidden aspect-[16/9] border border-slate-800">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}

              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  className="flex-1 py-1.5 rounded-xl bg-amber-400 text-slate-950 font-bold text-xs text-center shadow-sm"
                >
                  View Offer
                </button>
                <button
                  type="button"
                  className="py-1.5 px-3 rounded-xl bg-slate-800 text-slate-300 font-semibold text-xs text-center"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>

          {/* Connected Device IPs list */}
          <Card glass className="p-4 rounded-3xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-amber-500" />
                <span>Audience Device Log</span>
              </span>
              <span className="text-[10px] text-slate-400">{subscribers.length} total</span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-2 pr-1 no-scrollbar">
              {subscribers.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  No devices registered yet. Users will appear here upon granting notification permission.
                </p>
              ) : (
                subscribers.map((sub, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200 block text-[11px]">
                        IP: {sub.ipAddress || '127.0.0.1'}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[200px]">
                        {sub.platform || 'Web Device'} • {sub.screen || 'Desktop/Mobile'}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Past Broadcast Campaigns History */}
          {pastCampaigns.length > 0 && (
            <Card glass className="p-4 rounded-3xl space-y-3">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-500" />
                <span>Recent Sent Broadcasts</span>
              </span>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1 no-scrollbar">
                {pastCampaigns.map((camp, idx) => (
                  <div key={camp.id || idx} className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {camp.title}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(camp.createdAt)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{camp.body}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
