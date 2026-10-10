import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Zap, BookOpen, Timer, HandHeart, CalendarDays, Compass, Flame, User, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getUserGroup } from '../../utils/groups';
import { friendlyError } from '../../utils/errors';
import PushPrompt from '../../components/common/PushPrompt';

const quickActions = [
  { icon: HandHeart, title: 'Growth', sub: 'Stay closer to God', color: 'var(--success)', to: '/growth' },
  { icon: BookOpen, title: 'Sermons', sub: 'Past messages', color: 'var(--primary)', to: '/sermons' },
  { icon: Timer, title: 'Prayer', sub: 'Start a session', color: 'var(--accent)', to: '/prayer' }
];

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const [fade, setFade] = useState(true);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (profile?.full_name || 'Friend').split(' ')[0];
  const initial = firstName.charAt(0).toUpperCase();

  useEffect(() => {
    if (profile) loadSermon();
  }, [profile]);

  const loadSermon = async () => {
    setLoading(true);
    setError('');

    const groupId = getUserGroup(profile);

    // Get latest published sermon for user's group
    const { data: sermonData, error: sermonError } = await supabase
      .from('sermons')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'published')
      .order('taught_on', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sermonError) {
      setError(friendlyError(sermonError));
      setLoading(false);
      return;
    }

    if (!sermonData) {
      setSermon(null);
      setLoading(false);
      return;
    }

    // Get points for this sermon
    const { data: pointsData, error: pointsError } = await supabase
      .from('sermon_points')
      .select('*')
      .eq('sermon_id', sermonData.id)
      .order('day', { ascending: true })
      .order('session', { ascending: true });

    if (pointsError) {
      setError(friendlyError(pointsError));
      setLoading(false);
      return;
    }

    setSermon({ ...sermonData, points: pointsData || [] });
    setLoading(false);
  };

  // Rotate points every 10s
  useEffect(() => {
    if (!sermon?.points || sermon.points.length < 2) return;

    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % sermon.points.length);
        setFade(true);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, [sermon]);

  const point = sermon?.points?.[activeIndex];
  const taughtDate = sermon?.taught_on
    ? new Date(sermon.taught_on).toLocaleDateString('en-NG', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
      })
    : '';

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex justify-end items-center gap-3 px-5 pt-6 pb-2 safe-top">
        <button
          onClick={() => navigate('/announcements')}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition relative"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Bell size={20} style={{ color: 'var(--text)' }} />
          <span
            className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
            style={{ background: 'var(--accent)' }}
          />
        </button>

        <button
          onClick={() => navigate('/profile')}
          className="w-11 h-11 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '2px solid var(--success)' }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: 'var(--card-soft)' }}
          >
            <span className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {initial}
            </span>
          </div>
        </button>
      </div>

       <div className="px-5 pt-2">
      <PushPrompt />
    </div>

      {/* Greeting */}
      <div className="px-5 pt-3">
        <p className="text-base" style={{ color: 'var(--text-muted)' }}>{greeting},</p>
        <h1 className="font-display text-4xl mt-1" style={{ color: 'var(--text)' }}>
          {firstName}
        </h1>
      </div>

      {/* Sermon point card */}
      <div className="px-5 mt-6">
        {loading && (
          <div
            className="w-full rounded-3xl p-5 flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)', minHeight: '200px' }}
          >
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
            />
          </div>
        )}

        {!loading && !sermon && (
          <div
            className="w-full rounded-3xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <BookOpen size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>
              No sermon yet this week
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Your teacher hasn't uploaded this week's lesson. Check back soon.
            </p>
          </div>
        )}

        {!loading && sermon && point && (
          <button
            onClick={() => navigate('/sermons')}
            className="relative w-full rounded-3xl p-5 overflow-hidden text-left active:scale-[0.99] transition"
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
              boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)',
              minHeight: '200px'
            }}
          >
            <div className="transition-opacity duration-300" style={{ opacity: fade ? 1 : 0 }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-white/80 text-[11px] font-semibold uppercase tracking-wide">
                  {sermon.title}
                </p>
                <span
                  className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded"
                  style={{ background: 'rgba(255,255,255,0.2)', color: '#ffffff' }}
                >
                  {point.session}
                </span>
              </div>

              <div className="flex items-start justify-between gap-4">
                <p className="text-white text-base font-medium leading-snug flex-1 pr-2">
                  {point.body}
                </p>

                <div className="relative shrink-0">
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      boxShadow: '0 0 24px rgba(255,255,255,0.35)'
                    }}
                  >
                    <Zap size={24} className="text-white" fill="white" />
                  </div>
                </div>
              </div>

              <p className="text-white/90 text-xs font-medium mt-3">
                {point.scripture}
              </p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-4 text-white/75 text-[11px]">
                <div className="flex items-center gap-1.5">
                  <User size={12} />
                  <span>{sermon.teacher}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  <span>{taughtDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-1.5 mt-4">
              {sermon.points.map((_, idx) => (
                <span
                  key={idx}
                  className="rounded-full transition-all"
                  style={{
                    width: idx === activeIndex ? '20px' : '6px',
                    height: '6px',
                    background: idx === activeIndex ? '#ffffff' : 'rgba(255,255,255,0.4)'
                  }}
                />
              ))}
            </div>
          </button>
        )}

        {error && (
          <p className="text-xs mt-3 text-center" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        )}
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-8">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Quick Actions
        </h2>

        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => navigate(action.to)}
              className="rounded-2xl p-4 flex flex-col items-center text-center active:scale-95 transition"
              style={{
                background: 'var(--card)',
                border: `1px solid ${action.color}30`
              }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center mb-2"
                style={{ background: `${action.color}15` }}
              >
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
                {action.title}
              </p>
              <p className="text-[10px] mt-1 leading-tight" style={{ color: 'var(--text-dim)' }}>
                {action.sub}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Today's Activities */}
      <div className="px-5 mt-8">
        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--text)' }}>
          Today's Activities
        </h2>

        <div className="flex flex-col items-center justify-center py-8">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <CalendarDays size={22} style={{ color: 'var(--text-muted)' }} />
          </div>
          <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
            No activities scheduled for today
          </p>
          <button
            onClick={() => navigate('/worker/service-plan')}
            className="text-xs font-medium mt-2"
            style={{ color: 'var(--primary)' }}
          >
            Open your schedule to create one
          </button>
        </div>
      </div>

      {/* Growth shortcut */}
      <div className="px-5 mt-4 mb-6">
        <button
          onClick={() => navigate('/growth')}
          className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: 'var(--primary-soft)' }}
          >
            <Compass size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
              Explore Growth
            </p>
            <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
              Track your spiritual journey
            </p>
          </div>
          <Flame size={18} style={{ color: 'var(--accent)' }} />
        </button>
      </div>
    </div>
  );
}