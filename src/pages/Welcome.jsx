import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Church, BookOpen, Users, Timer, Heart, MapPin, Clock,
  Download, ArrowRight, Smartphone, Share, Plus, X,
  CheckCircle2, ExternalLink
} from 'lucide-react'

export default function Welcome() {
  const navigate = useNavigate()
  const [installPrompt, setInstallPrompt] = useState(null)
  const [showInstallHelp, setShowInstallHelp] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    setIsIOS(ios)

    // Detect if already installed (standalone mode)
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    setIsInstalled(standalone)

    // Capture Android/Chrome install prompt
    const handler = (e) => {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    // If already installed, just open the app
    if (isInstalled) {
      navigate('/login')
      return
    }

    // Android/Chrome — trigger native prompt
    if (installPrompt) {
      installPrompt.prompt()
      const result = await installPrompt.userChoice
      if (result.outcome === 'accepted') {
        setInstallPrompt(null)
      }
      return
    }

    // iOS or unsupported — show instructions
    setShowInstallHelp(true)
  }

  return (
    <div className="min-h-screen w-full" style={{ background: 'var(--bg)' }}>
      <div className="max-w-md mx-auto md:max-w-3xl">

        {/* Top bar */}
        <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--card)',
                border: '2px solid var(--gold)'
              }}
            >
              <img
                src="/icons/Rccg_logo.png"
                alt="RCCG Heghizbah Chapel"
                style={{ width: 28, height: 28, objectFit: 'contain' }}
              />
            </div>
            <div>
              <p
                className="font-display text-sm leading-tight"
                style={{ color: 'var(--text)' }}
              >
                Heghizbah Chapel
              </p>
              <p
                className="text-[9px] tracking-widest uppercase"
                style={{ color: 'var(--gold)' }}
              >
                RCCG
              </p>
            </div>
          </div>

          <button
            onClick={() => navigate('/login')}
            className="px-4 py-2 rounded-full text-xs font-medium active:scale-95 transition"
            style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              color: 'var(--text)'
            }}
          >
            Sign In
          </button>
        </div>

        {/* HERO */}
        <section className="px-5 pt-4 pb-8">
          <div className="text-center">
            <div
              className="w-24 h-24 rounded-full mx-auto flex items-center justify-center"
              style={{
                background: 'rgba(37, 99, 235, 0.08)',
                border: '3px solid var(--gold)',
                boxShadow: '0 16px 48px rgba(212, 175, 55, 0.25)'
              }}
            >
              <img
                src="/icons/Rccg_logo.png"
                alt="RCCG Heghizbah Chapel"
                style={{ width: 80, height: 80, objectFit: 'contain' }}
              />
            </div>

            <h1
              className="font-display text-3xl mt-6"
              style={{ color: 'var(--text)' }}
            >
              RCCG Heghizbah Chapel
            </h1>

            <p
              className="text-[11px] tracking-[0.35em] uppercase mt-2"
              style={{ color: 'var(--gold)' }}
            >
              A Place of Grace
            </p>

            <p
              className="text-sm mt-5 leading-relaxed max-w-sm mx-auto"
              style={{ color: 'var(--text-muted)' }}
            >
              Your spiritual companion for sermons, prayer, giving,
              and growing together as one family in Christ.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 mt-8">
            <button
              onClick={() => navigate('/login')}
              className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition"
              style={{ background: 'var(--primary)' }}
            >
              Open the App
              <ArrowRight size={18} />
            </button>

            <button
              onClick={handleInstall}
              className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
              style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                color: 'var(--text)'
              }}
            >
              {isInstalled ? (
                <>
                  <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                  App Installed
                </>
              ) : (
                <>
                  <Download size={18} />
                  Install App
                </>
              )}
            </button>

            <p
              className="text-[11px] text-center"
              style={{ color: 'var(--text-dim)' }}
            >
              Free · Works on any phone · No app store needed
            </p>
          </div>
        </section>

        {/* APP FEATURES */}
        <section className="px-5 py-8">
          <h2
            className="font-display text-2xl text-center mb-1"
            style={{ color: 'var(--text)' }}
          >
            What's Inside
          </h2>
          <p
            className="text-xs text-center mb-6"
            style={{ color: 'var(--text-muted)' }}
          >
            Everything you need for your spiritual journey
          </p>

          <div className="grid grid-cols-2 gap-3">
            <FeatureCard
              icon={BookOpen}
              title="Sermons"
              subtitle="Daily Word from Pastor"
              color="var(--primary)"
            />
            <FeatureCard
              icon={Timer}
              title="Prayer"
              subtitle="Timers & schedules"
              color="var(--accent)"
            />
            <FeatureCard
              icon={Users}
              title="Groups"
              subtitle="Connect with your class"
              color="#a855f7"
            />
            <FeatureCard
              icon={Heart}
              title="Giving"
              subtitle="Tithes & offerings"
              color="var(--success)"
            />
          </div>
        </section>

        {/* ABOUT */}
        <section className="px-5 py-8">
          <h2
            className="font-display text-2xl mb-3"
            style={{ color: 'var(--text)' }}
          >
            About Our Chapel
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--text-muted)' }}
          >
            RCCG Heghizbah Chapel is a family of believers committed to
            worship, the Word, and walking together in grace. Whether you're
            new to faith or have walked with God for years, you belong here.
          </p>

          <div className="mt-5 space-y-3">
            <InfoLine
              icon={Clock}
              label="Sunday Service"
              value="8:00 AM – 10:30 AM"
            />
            <InfoLine
              icon={Church}
              label="Midweek Service"
              value="Wednesday · 5:30 PM"
            />
            <InfoLine
              icon={MapPin}
              label="Location"
              value="RCCG Heghizbah Chapel"
            />
          </div>
        </section>

        {/* CONTACT */}
        <section className="px-5 py-8">
          <div
            className="rounded-3xl p-6 text-center"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)'
            }}
          >
            <h3
              className="font-display text-xl text-white"
            >
              Ready to Join Us?
            </h3>
            <p
              className="text-sm mt-2 mb-5"
              style={{ color: 'rgba(255,255,255,0.85)' }}
            >
              Create your account and begin your journey
            </p>
            <button
              onClick={() => navigate('/register')}
              className="px-6 py-3 rounded-full font-medium text-sm active:scale-95 transition flex items-center gap-2 mx-auto"
              style={{ background: '#ffffff', color: 'var(--primary)' }}
            >
              Create Account
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-5 pb-10 pt-4 text-center">
          <p
            className="text-[11px] tracking-wide"
            style={{ color: 'var(--text-dim)' }}
          >
            RCCG Heghizbah Chapel · A Place of Grace
          </p>
          <p
            className="text-[10px] mt-1"
            style={{ color: 'var(--text-dim)' }}
          >
            © {new Date().getFullYear()} · All rights reserved
          </p>
        </footer>
      </div>

      {/* INSTALL HELP MODAL */}
      {showInstallHelp && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowInstallHelp(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-6 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div
              className="w-12 h-1 rounded-full mx-auto mb-5"
              style={{ background: 'var(--text-dim)' }}
            />

            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Smartphone size={20} style={{ color: 'var(--primary)' }} />
                <h3
                  className="text-lg font-semibold"
                  style={{ color: 'var(--text)' }}
                >
                  Install the App
                </h3>
              </div>
              <button
                onClick={() => setShowInstallHelp(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            {isIOS ? (
              <div>
                <p
                  className="text-sm mb-5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  On iPhone, follow these simple steps in Safari:
                </p>

                <Step
                  number={1}
                  icon={Share}
                  title="Tap the Share button"
                  subtitle="The square icon at the bottom of Safari"
                />
                <Step
                  number={2}
                  icon={Plus}
                  title="Scroll and tap 'Add to Home Screen'"
                  subtitle="Choose a name and confirm"
                />
                <Step
                  number={3}
                  icon={CheckCircle2}
                  title="Open from your home screen"
                  subtitle="The app icon appears like any other app"
                />

                <p
                  className="text-xs mt-5 p-3 rounded-xl leading-relaxed"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--text)'
                  }}
                >
                  <strong>Note:</strong> Apple requires this manual step.
                  Android users can install with one tap.
                </p>
              </div>
            ) : (
              <div>
                <p
                  className="text-sm mb-5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Your browser doesn't support automatic installation. You can
                  still use the app right now — just open it in your browser.
                  To add it to your home screen:
                </p>

                <Step
                  number={1}
                  icon={Smartphone}
                  title="Open in Chrome, Edge, or Samsung Internet"
                  subtitle="Chrome is recommended"
                />
                <Step
                  number={2}
                  icon={Plus}
                  title="Tap menu, then 'Add to Home screen'"
                  subtitle="Install as app in the browser menu"
                />
                <Step
                  number={3}
                  icon={CheckCircle2}
                  title="Open from your home screen"
                  subtitle="The app icon appears like any other app"
                />
              </div>
            )}

            <button
              onClick={() => {
                setShowInstallHelp(false)
                navigate('/login')
              }}
              className="w-full mt-6 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              <ExternalLink size={18} />
              Open in Browser Instead
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================
// SMALL COMPONENTS
// ============================================

function FeatureCard({ icon: Icon, title, subtitle, color }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{
        background: 'var(--card)',
        border: `1px solid ${color}40`
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}15` }}
      >
        <Icon size={20} style={{ color }} />
      </div>
      <p
        className="text-sm font-semibold"
        style={{ color: 'var(--text)' }}
      >
        {title}
      </p>
      <p
        className="text-[11px] mt-0.5"
        style={{ color: 'var(--text-muted)' }}
      >
        {subtitle}
      </p>
    </div>
  )
}

function InfoLine({ icon: Icon, label, value }) {
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)'
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: 'var(--primary-soft)' }}
      >
        <Icon size={16} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[10px] uppercase tracking-wide"
          style={{ color: 'var(--text-dim)' }}
        >
          {label}
        </p>
        <p
          className="text-sm font-medium mt-0.5"
          style={{ color: 'var(--text)' }}
        >
          {value}
        </p>
      </div>
    </div>
  )
}

function Step({ number, icon: Icon, title, subtitle }) {
  return (
    <div className="flex items-start gap-3 mb-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-display text-sm"
        style={{
          background: 'var(--primary-soft)',
          color: 'var(--primary)'
        }}
      >
        {number}
      </div>
      <div className="flex-1">
        <p
          className="text-sm font-medium flex items-center gap-2"
          style={{ color: 'var(--text)' }}
        >
          <Icon size={14} style={{ color: 'var(--primary)' }} />
          {title}
        </p>
        <p
          className="text-xs mt-1"
          style={{ color: 'var(--text-muted)' }}
        >
          {subtitle}
        </p>
      </div>
    </div>
  )
}