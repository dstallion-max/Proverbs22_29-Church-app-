import { useState, useEffect } from 'react';
import { Bell, X, Smartphone, Download, Share } from 'lucide-react';
import { usePush } from '../../context/PushContext';
import { useAuth } from '../../context/AuthContext';

const STORAGE_KEY = 'heghizbah-push-prompt-dismissed';

export default function PushPrompt() {
  const { profile } = useAuth();
  const { permission, enablePush, registering } = usePush();
  const [visible, setVisible] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Detect platform
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsIOS(ios);
    setIsStandalone(standalone);

    // Capture Android install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Show prompt if appropriate
    if (profile && !profile.push_enabled && permission !== 'granted' && permission !== 'denied') {
      if (!localStorage.getItem(STORAGE_KEY)) {
        setVisible(true);
      }
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [profile, permission]);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Android: trigger native install
      deferredPrompt.prompt();
      const result = await deferredPrompt.userChoice;
      if (result.outcome === 'accepted') {
        setDeferredPrompt(null);
        dismiss();
      }
    } else if (isIOS && !isStandalone) {
      // iPhone: show instructions in a bottom sheet
      setShowIOSHelp(true);
    }
  };

  const [showIOSHelp, setShowIOSHelp] = useState(false);

  const handleEnable = async () => {
    const result = await enablePush();
    if (result.ok) setVisible(false);
  };

  if (!visible) return null;

  const needsInstall = isIOS && !isStandalone;
  const canInstallAndroid = !isIOS && !isStandalone && deferredPrompt;

  return (
    <>
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
            <p className="text-sm font-semibold text-white">Stay Connected</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.85)' }}>
              {needsInstall
                ? 'Install this app to receive notifications on iPhone.'
                : 'Get notified about sermons, prayer times, and announcements.'}
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {/* Android: Install button (triggers native prompt) */}
              {canInstallAndroid && (
                <button
                  onClick={handleInstallClick}
                  className="px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition flex items-center gap-1.5"
                  style={{ background: '#ffffff', color: 'var(--primary)' }}
                >
                  <Download size={14} />
                  Install App
                </button>
              )}

              {/* iPhone: Install instructions button */}
              {needsInstall && (
                <button
                  onClick={() => setShowIOSHelp(true)}
                  className="px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition flex items-center gap-1.5"
                  style={{ background: '#ffffff', color: 'var(--primary)' }}
                >
                  <Smartphone size={14} />
                  How to Install
                </button>
              )}

              {/* Notification enable (works after install or on Android directly) */}
              {(!needsInstall || isStandalone) && (
                <button
                  onClick={handleEnable}
                  disabled={registering}
                  className="px-4 py-2 rounded-full text-xs font-semibold active:scale-95 transition disabled:opacity-60 flex items-center gap-1.5"
                  style={{
                    background: 'rgba(255,255,255,0.2)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                  }}
                >
                  <Bell size={14} />
                  {registering ? 'Enabling...' : 'Enable Notifications'}
                </button>
              )}
            </div>
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

      {/* iPhone install instructions bottom sheet */}
      {showIOSHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowIOSHelp(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
              Install on iPhone
            </h3>

            <div className="space-y-4">
              <Step
                number={1}
                icon={Share}
                title="Tap the Share button"
                subtitle="The square icon with arrow at the bottom of Safari"
              />
              <Step
                number={2}
                icon={Smartphone}
                title="Scroll and tap 'Add to Home Screen'"
                subtitle="Choose a name and tap Add"
              />
              <Step
                number={3}
                icon={Bell}
                title="Open from Home Screen"
                subtitle="Then enable notifications when prompted"
              />
            </div>

            <button
              onClick={() => setShowIOSHelp(false)}
              className="w-full mt-6 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition"
              style={{ background: 'var(--primary)' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function Step({ number, icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display text-sm"
        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
      >
        {number}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium flex items-center gap-2" style={{ color: 'var(--text)' }}>
          <Icon size={14} style={{ color: 'var(--primary)' }} />
          {title}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
      </div>
    </div>
  );
}