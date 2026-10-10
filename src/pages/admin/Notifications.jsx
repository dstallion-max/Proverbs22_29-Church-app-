import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Users, UserCheck, Send, CheckCircle2,
  AlertCircle, Info, ArrowLeft, Trash2, RefreshCw
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const audiences = [
  { id: 'all', label: 'All Members', icon: Users },
  { id: 'workers', label: 'Workers Only', icon: UserCheck },
  { id: 'ushers', label: 'Ushers', icon: Users },
  { id: 'choir', label: 'Choir', icon: Users },
  { id: 'media', label: 'Media', icon: Users },
  { id: 'teens', label: 'Teens', icon: Users },
  { id: 'super_teens', label: 'Super Teens', icon: Users },
  { id: 'adults', label: 'Adults', icon: Users },
];

const priorities = [
  { id: 'info', label: 'Info', icon: Info, color: 'var(--primary)' },
  { id: 'important', label: 'Important', icon: AlertCircle, color: 'var(--accent)' },
  { id: 'urgent', label: 'Urgent', icon: AlertCircle, color: 'var(--danger)' },
];

export default function Notifications() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [audience, setAudience] = useState('all');
  const [priority, setPriority] = useState('info');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [alsoPush, setAlsoPush] = useState(true);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);

  const inputStyle = {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  };

  useEffect(() => {
    if (profile?.role === 'admin') loadRecent();
  }, [profile]);

  const loadRecent = async () => {
    setRecentLoading(true);
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    setRecent(data || []);
    setRecentLoading(false);
  };

  if (profile && profile.role !== 'admin') {
    return (
      <div
        className="min-h-screen max-w-md mx-auto flex flex-col items-center justify-center px-6"
        style={{ background: 'var(--bg)' }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'var(--danger-soft)', border: '2px solid var(--danger)' }}
        >
          <AlertCircle size={36} style={{ color: 'var(--danger)' }} />
        </div>
        <h1 className="font-display text-2xl mt-6 text-center" style={{ color: 'var(--text)' }}>
          Access Denied
        </h1>
        <p className="text-sm mt-2 text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
          Only church admins can send announcements.
        </p>
        <button
          onClick={() => navigate('/')}
          className="w-full mt-10 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition"
          style={{ background: 'var(--primary)' }}
        >
          Go Back Home
        </button>
      </div>
    );
  }

  const handleSend = async () => {
    setError('');

    if (!title.trim() || !message.trim()) {
      setError('Please enter both a title and a message.');
      return;
    }

    setLoading(true);

    // 1. Save announcement
    const { error } = await supabase.from('announcements').insert({
      title: title.trim(),
      body: message.trim(),
      priority,
      audience,
      created_by: user?.id || null,
      push_sent: alsoPush,
      push_sent_at: alsoPush ? new Date().toISOString() : null,
    });

    if (error) {
      setLoading(false);
      setError(friendlyError(error));
      return;
    }

    // 2. Fire push (only if user opted in) — non-blocking
    if (alsoPush) {
      supabase.functions
        .invoke('send-push', {
          body: {
            title: title.trim(),
            body: message.trim(),
            url: '/announcements',
            audience,
          },
        })
        .then(({ data, error }) => {
          if (error) console.warn('Push send failed:', error);
          else console.log('Push result:', data);
        })
        .catch((e) => console.warn('Push invoke failed:', e));
    }

    setLoading(false);
    setSent(true);
    setTitle('');
    setMessage('');
    await loadRecent();
    setTimeout(() => setSent(false), 2500);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this announcement?')) return;
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    loadRecent();
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hrs = Math.floor(diff / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/admin')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Send Announcement
        </h1>
        <button
          onClick={loadRecent}
          disabled={recentLoading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Broadcast"
          title="Push a Message"
          subtitle="Reaches all members instantly"
          right={<HeroIcon icon={Bell} />}
        />
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Audience
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {audiences.map((a) => {
            const active = audience === a.id;
            return (
              <button
                key={a.id}
                onClick={() => setAudience(a.id)}
                className="flex items-center gap-2 p-3 rounded-2xl transition text-left"
                style={{
                  background: active ? 'var(--primary)' : 'var(--card)',
                  border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                <a.icon size={16} style={{ color: active ? '#ffffff' : 'var(--primary)' }} />
                <span
                  className="text-xs font-medium truncate"
                  style={{ color: active ? '#ffffff' : 'var(--text)' }}
                >
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Priority
        </h2>
        <div className="grid grid-cols-3 gap-2">
          {priorities.map((p) => {
            const active = priority === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setPriority(p.id)}
                className="p-3 rounded-xl text-sm font-medium flex flex-col items-center gap-1.5 transition"
                style={{
                  background: active ? `${p.color}20` : 'var(--card)',
                  color: active ? p.color : 'var(--text-muted)',
                  border: `1px solid ${active ? p.color : 'var(--border)'}`,
                }}
              >
                <p.icon size={16} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-5 mt-6 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunday Service Reminder"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            rows={4}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>
      </div>

      <div className="px-5 mt-4">
        <button
          onClick={() => setAlsoPush(!alsoPush)}
          className="w-full flex items-center gap-3 p-3 rounded-2xl"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-5 h-5 rounded flex items-center justify-center"
            style={{
              background: alsoPush ? 'var(--primary)' : 'var(--card-soft)',
              border: `1px solid ${alsoPush ? 'var(--primary)' : 'var(--border)'}`,
            }}
          >
            {alsoPush && <CheckCircle2 size={14} className="text-white" />}
          </div>
          <span className="text-sm" style={{ color: 'var(--text)' }}>
            Also send as push notification
          </span>
        </button>
      </div>

      <div className="px-5 mt-6">
        <p className="text-xs uppercase tracking-wide mb-3" style={{ color: 'var(--text-muted)' }}>
          Preview
        </p>
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {(() => {
            const p = priorities.find((x) => x.id === priority);
            const Icon = p.icon;
            return <Icon size={20} style={{ color: p.color }} className="mt-0.5" />;
          })()}
          <div className="flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              {title || 'Announcement title'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {message || 'Your message preview appears here'}
            </p>
            <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>
              To: {audiences.find((a) => a.id === audience)?.label}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6">
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {sent ? (
            <>
              <CheckCircle2 size={18} />
              Sent
            </>
          ) : loading ? (
            'Sending...'
          ) : (
            <>
              <Send size={18} />
              Send Announcement
            </>
          )}
        </button>
      </div>

      {/* Recent sent */}
      <div className="px-5 mt-6 pb-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Recent Announcements
        </h2>

        {recentLoading && (
          <div className="flex justify-center py-6">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
            />
          </div>
        )}

        {!recentLoading && recent.length === 0 && (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No announcements yet
          </p>
        )}

        {!recentLoading && recent.length > 0 && (
          <div className="space-y-2">
            {recent.map((n) => (
              <div
                key={n.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {n.title}
                    </p>
                    <p className="text-xs mt-1 line-clamp-2" style={{ color: 'var(--text-muted)' }}>
                      {n.body}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                        style={{
                          background: 'var(--primary-soft)',
                          color: 'var(--primary)',
                        }}
                      >
                        {n.audience}
                      </span>
                      {n.push_sent && (
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{
                            background: 'var(--success-soft)',
                            color: 'var(--success)',
                          }}
                        >
                          Push sent
                        </span>
                      )}
                      <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                        {formatTime(n.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: 'var(--danger-soft)' }}
                  >
                    <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}