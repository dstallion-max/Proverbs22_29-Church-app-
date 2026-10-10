import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, CheckCheck, ChevronDown, AlertCircle, Info } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Announcements() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .is('archived_at', null)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    const userGroups = profile?.groups || [];
    const userRole = profile?.role || 'member';

    const visible = (data || []).filter((a) => {
      if (a.audience === 'all') return true;
      if (a.audience === 'workers') return userRole === 'worker' || userRole === 'lead' || userRole === 'admin';
      return userGroups.includes(a.audience);
    });

    setAnnouncements(visible);
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;

    return d.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const priorityStyle = (priority) => {
    if (priority === 'urgent') {
      return { border: 'var(--danger)', bg: 'var(--danger-soft)', icon: AlertCircle, iconColor: 'var(--danger)' };
    }
    if (priority === 'important') {
      return { border: 'var(--accent)', bg: 'var(--accent-soft)', icon: AlertCircle, iconColor: 'var(--accent)' };
    }
    return { border: 'var(--border)', bg: 'var(--card)', icon: Info, iconColor: 'var(--primary)' };
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Notifications</h1>
        <button
          onClick={() => setOpenId(null)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <CheckCheck size={20} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {error && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-4" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && announcements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 px-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Bell size={28} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--text)' }}>No announcements yet</p>
          <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
            Check back later for updates from your church
          </p>
        </div>
      )}

      <div className="px-5 mt-2 space-y-3 pb-8">
        {announcements.map((n) => {
          const open = openId === n.id;
          const style = priorityStyle(n.priority);
          const Icon = style.icon;

          return (
            <button
              key={n.id}
              onClick={() => setOpenId(open ? null : n.id)}
              className="w-full text-left rounded-2xl p-4 transition"
              style={{ background: style.bg, border: `1px solid ${style.border}` }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--card)' }}
                >
                  <Icon size={18} style={{ color: style.iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>
                      {n.title}
                    </p>
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
                      style={{ color: 'var(--text-muted)' }}
                    />
                  </div>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                    {formatDate(n.created_at)}
                  </p>
                  {open && (
                    <p className="text-xs mt-3 leading-relaxed anim-fade-up" style={{ color: 'var(--text-muted)' }}>
                      {n.body}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}