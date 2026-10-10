import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home, BookOpen, Timer, Gamepad2, User,
  Users, Crown, Wallet, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const mainItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/sermons', icon: BookOpen, label: 'The Word' },
  { to: '/prayer', icon: Timer, label: 'Prayer' },
  { to: '/game', icon: Gamepad2, label: 'Game' },
  { to: '/profile', icon: User, label: 'Me' },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const user = profile || {
    full_name: 'Guest',
    username: '',
    role: 'member',
    groups: [],
  };

  const isUserAdmin = user.role === 'admin';
  const isLead = user.role === 'lead';
  const isWorker = user.role === 'worker';
  const showServe = isUserAdmin || isLead || isWorker;

  const initial = (user.full_name || 'U').charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside
      className="hidden md:flex fixed top-0 bottom-0 left-0 w-64 flex-col z-40"
      style={{
        background: 'var(--card)',
        borderRight: '1px solid var(--border)',
      }}
    >
      {/* Brand */}
      <div
        className="px-6 py-5 flex items-center gap-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'var(--card-soft)',
            border: '2px solid var(--gold)',
          }}
        >
          <img
            src="/icons/Rccg_logo.png"
            alt="RCCG Heghizbah Chapel"
            style={{ width: 32, height: 32, objectFit: 'contain' }}
          />
        </div>
        <div className="min-w-0">
          <p
            className="font-display text-sm leading-tight"
            style={{ color: 'var(--text)' }}
          >
            Heghizbah Chapel
          </p>
          <p
            className="text-[10px] tracking-widest uppercase"
            style={{ color: 'var(--gold)' }}
          >
            RCCG
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4">
        <p
          className="text-[10px] font-semibold uppercase tracking-widest px-3 mb-2"
          style={{ color: 'var(--text-dim)' }}
        >
          Main
        </p>

        <div className="space-y-1">
          {mainItems.map((item) => (
            <SidebarLink
              key={item.to}
              to={item.to}
              icon={item.icon}
              label={item.label}
            />
          ))}
        </div>

        {showServe && (
          <>
            <p
              className="text-[10px] font-semibold uppercase tracking-widest px-3 mt-6 mb-2"
              style={{ color: 'var(--text-dim)' }}
            >
              Serve
            </p>

            <div className="space-y-1">
              {(isLead || isUserAdmin) && (
                <SidebarLink to="/lead" icon={Users} label="Lead Dashboard" />
              )}

              {isUserAdmin && (
                <SidebarLink to="/admin" icon={Crown} label="Admin Panel" />
              )}

              {(isWorker || isLead || isUserAdmin) && (
                <SidebarLink to="/worker" icon={Wallet} label="Worker Tools" />
              )}
            </div>
          </>
        )}
      </nav>

      {/* Footer — user + logout */}
      <div
        className="px-3 py-4"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        <button
          onClick={() => navigate('/profile')}
          className="w-full flex items-center gap-3 p-2 rounded-xl active:scale-[0.98] transition"
          style={{ background: 'var(--card-soft)' }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: 'var(--primary)',
              color: '#ffffff',
            }}
          >
            <span className="font-display text-base">{initial}</span>
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p
              className="text-sm font-medium truncate"
              style={{ color: 'var(--text)' }}
            >
              {user.full_name || 'Guest'}
            </p>
            <p
              className="text-[11px] truncate"
              style={{ color: 'var(--text-dim)' }}
            >
              @{user.username || 'no-username'}
            </p>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
        </button>

        <button
          onClick={handleLogout}
          className="w-full mt-2 flex items-center gap-3 p-2 rounded-xl active:scale-[0.98] transition"
        >
          <LogOut size={16} style={{ color: 'var(--danger)' }} />
          <span
            className="text-xs font-medium"
            style={{ color: 'var(--danger)' }}
          >
            Logout
          </span>
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
          isActive ? 'shadow-sm' : ''
        }`
      }
      style={({ isActive }) => ({
        background: isActive ? 'var(--primary)' : 'transparent',
        color: isActive ? '#ffffff' : 'var(--text)',
      })}
    >
      {({ isActive }) => (
        <>
          <Icon
            size={18}
            strokeWidth={isActive ? 2.4 : 1.8}
            style={{ color: isActive ? '#ffffff' : 'var(--text-muted)' }}
          />
          <span className="text-sm font-medium">{label}</span>
        </>
      )}
    </NavLink>
  );
}