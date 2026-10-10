import { useState, useEffect } from 'react';
import { Bell, X, Smartphone } from 'lucide-react';
import { usePush } from '../../context/PushContext';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'heghizbah-push-prompt-dismissed';

export default function PushPrompt() {
  const { profile } = useAuth();
  const { permission, enablePush, registering } = usePush();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (profile.push_enabled) return;
    if (permission === 'granted') return;
    if (permission === 'denied') return;
    if (localStorage.getItem(STORAGE_KEY) === '1') return;
    setVisible(true);
  }, [profile, permission]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleEnable = async () => {
    const result = await enablePush();
    if (result.ok) {
      setVisible(false);
    }
  };

  if (!visible) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true;

  return (
    <div
      className="rounded-2xl p-4 mb-4 anim-fade-up"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
        boxShadow: '0 8px 24px rgba(37, 99, 235, 0.3)',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >
          <Bell size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">
            Stay Connected
          </p>
          <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
            {isIOS && !isStandalone
              ? 'Add this app to your Home Screen first, then enable notifications.'
              : 'Get notified about sermons, prayer times, and church announcements.'}
          </p>

          {isIOS && !isStandalone ? (
            <div
              className="mt-3 p-3 rounded-xl text-xs"
              style={{ background: 'rgba(255,255,255,0.15)', color: '#ffffff' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Smartphone size={14} />
                <span className="font-semibold">To install on iPhone:</span>
              </div>
              <p>1. Tap the Share button in Safari</p>
              <p>2. Scroll down → "Add to Home Screen"</p>
              <p>3. Open the app from your Home Screen</p>
            </div>
          ) : (
            <button
              onClick={handleEnable}
              disabled={registering}
              className="mt-3 px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition disabled:opacity-60"
              style={{ background: '#ffffff', color: 'var(--primary)' }}
            >
              {registering ? 'Enabling...' : 'Enable Notifications'}
            </button>
          )}
        </div>

        <button
          onClick={dismiss}
          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'rgba(255,255,255,0.15)' }}
        >
          <X size={14} className="text-white" />
        </button>
      </div>
    </div>
  );
}