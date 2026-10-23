import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Settings, Mail, Phone, AtSign, MessageCircle, Calendar,
  ShieldCheck, X, Moon, Sun, LogOut, UserCog, Smartphone, Code2,
  ChevronRight, Copy, Users, Bell, Award
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export default function Profile() {
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const { profile, user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
        />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  const fields = [
    profile.username && {
      key: 'username', icon: AtSign, label: 'Username', value: `@${profile.username}`
    },
    profile.phone && {
      key: 'phone', icon: Phone, label: 'Phone', value: profile.phone, verified: true
    },
    profile.whatsapp && profile.whatsapp !== profile.phone && {
      key: 'whatsapp', icon: MessageCircle, label: 'WhatsApp', value: profile.whatsapp
    },
    profile.email && {
      key: 'email', icon: Mail, label: 'Email', value: profile.email
    },
    profile.created_at && {
      key: 'joinedAt', icon: Calendar, label: 'Member Since',
      value: new Date(profile.created_at).toLocaleDateString('en-NG', {
        year: 'numeric', month: 'long', day: 'numeric'
      })
    }
  ].filter(Boolean);

  const initial = (profile.full_name || 'U').charAt(0).toUpperCase();
  const roleLabel =
    profile.role === 'admin' ? 'Admin' :
    profile.role === 'lead' ? 'Leader' :
    profile.role === 'worker' ? 'Worker' : 'Member';

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>My Profile</h1>
        <button
          onClick={() => setSettingsOpen(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Settings size={20} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="h-16" />

      <div className="px-5">
        <div
          className="relative rounded-3xl pt-16 pb-6 px-5"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)'
          }}
        >
          <div className="absolute -top-14 left-1/2 -translate-x-1/2">
            <div className="relative">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center"
                style={{
                  background: 'var(--bg)',
                  border: '4px solid var(--success)',
                  boxShadow: '0 8px 24px rgba(34, 197, 94, 0.25)'
                }}
              >
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--card-soft)' }}
                >
                  <span className="font-display text-3xl" style={{ color: 'var(--text)' }}>
                    {initial}
                  </span>
                </div>
              </div>
              <button
                className="absolute bottom-1 right-1 w-9 h-9 rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ background: 'var(--card)', border: '3px solid var(--bg)' }}
              >
                <UserCog size={14} style={{ color: 'var(--text)' }} />
              </button>
            </div>
          </div>

          <div className="text-center mt-2">
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Hi,</p>
            <h2 className="font-display text-2xl mt-1" style={{ color: 'var(--text)' }}>
              {profile.full_name || 'Friend'}
            </h2>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {roleLabel}
            </p>
          </div>

          <div
            className="rounded-2xl p-4 mt-6 space-y-4"
            style={{ background: 'var(--card-soft)' }}
          >
            {fields.map((f) => (
              <InfoRow key={f.key} {...f} />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-center">
            <div
              className="inline-flex items-center gap-2 px-5 py-3 rounded-full"
              style={{
                border: '1px solid var(--success)',
                background: 'var(--success-soft)'
              }}
            >
              <ShieldCheck size={18} style={{ color: 'var(--success)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--success)' }}>
                Account Verified
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <MenuLink icon={Users} label="My Groups" onClick={() => navigate('/my-groups')} />
          <MenuLink icon={Bell} label="Notifications" onClick={() => navigate('/announcements')} />
          <MenuLink icon={ShieldCheck} label="Privacy & Security" />
          <MenuLink icon={Award} label="My Achievements" onClick={() => navigate('/growth')} />
        </div>
      </div>

      {(profile.role === 'lead' || profile.role === 'worker' || profile.role === 'admin') && (
        <div className="px-5 mt-5 space-y-2">
          {(profile.role === 'lead' || profile.role === 'admin') && (
            <RoleCard
              title="Lead Dashboard"
              subtitle="Manage your group and upload lessons"
              onClick={() => navigate('/lead')}
            />
          )}

          {(profile.role === 'worker' || profile.role === 'lead' || profile.role === 'admin') && (
            <RoleCard
              title="Worker View"
              subtitle="Worker tools and department"
              onClick={() => navigate('/worker')}
            />
          )}

          {profile.role === 'admin' && (
            <RoleCard
              title="Pastor / Admin View"
              subtitle="Church oversight and management"
              onClick={() => navigate('/admin')}
            />
          )}
        </div>
      )}

      <div className="h-6" />

      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setSettingsOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Settings</h3>
              <button
                onClick={() => setSettingsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <SettingsRow icon={UserCog} label="Developer" value="Hephzibah youth" />
            <SettingsRow icon={Smartphone} label="App Version" value="1.0.2" />
            <SettingsRow icon={Code2} label="Design By" value="Victor Marke" />

            <div className="my-4" style={{ borderTop: '1px solid var(--border)' }} />

            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between py-4"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'var(--accent-soft)' }}
                >
                  {isDark ? (
                    <Moon size={18} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <Sun size={18} style={{ color: 'var(--accent)' }} />
                  )}
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {isDark ? 'Dark Mode' : 'Light Mode'}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-dim)' }}>Tap to switch</p>
                </div>
              </div>
              <div
                className="w-12 h-7 rounded-full relative transition-all"
                style={{
                  background: isDark ? 'var(--accent)' : 'var(--card-soft)',
                  border: '1px solid var(--border)'
                }}
              >
                <span
                  className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow transition-all"
                  style={{ left: isDark ? '22px' : '2px' }}
                />
              </div>
            </button>

            <div className="my-2" style={{ borderTop: '1px solid var(--border)' }} />

            <button onClick={handleLogout} className="w-full flex items-center gap-3 py-4">
              <LogOut size={18} style={{ color: 'var(--danger)' }} />
              <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, verified }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mt-0.5 shrink-0"
        style={{ background: 'var(--card)' }}
      >
        <Icon size={16} style={{ color: 'var(--primary)' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[11px] uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--text-dim)' }}>
          {label}
          {verified && <ShieldCheck size={11} style={{ color: 'var(--success)' }} />}
        </p>
        <p className="text-sm mt-0.5 break-all" style={{ color: 'var(--text)' }}>{value}</p>
      </div>
      <button className="mt-1.5" style={{ color: 'var(--text-muted)' }}>
        <Copy size={15} />
      </button>
    </div>
  );
}

function MenuLink({ icon: Icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-4 border-b last:border-b-0 active:bg-cream transition"
      style={{ borderColor: 'var(--border)' }}
    >
      <Icon size={18} style={{ color: 'var(--primary)' }} />
      <span className="flex-1 text-left text-sm" style={{ color: 'var(--text)' }}>{label}</span>
      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

function RoleCard({ title, subtitle, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex-1 text-left">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{title}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>{subtitle}</p>
      </div>
      <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
    </button>
  );
}

function SettingsRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex items-center gap-3">
        <Icon size={18} style={{ color: 'var(--text-muted)' }} />
        <span className="text-sm" style={{ color: 'var(--text)' }}>{label}</span>
      </div>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{value}</span>
    </div>
  );
}