import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Pause, RotateCcw, Plus, Target, TrendingUp, ArrowLeft, Flame, Award } from 'lucide-react';
import HeroCard, { HeroStat } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const categories = ['Thanksgiving', 'Intercession', 'Confession', 'Worship', 'Word'];

export default function Prayer() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('timer');
  const [duration, setDuration] = useState(10);
  const [secondsLeft, setSecondsLeft] = useState(600);
  const [running, setRunning] = useState(false);
  const [category, setCategory] = useState('Thanksgiving');
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savedMessage, setSavedMessage] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    if (user) loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);

    const [sessionsRes, goalsRes, schedRes] = await Promise.all([
      supabase
        .from('prayer_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('growth_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('prayer_schedules')
        .select('*')
        .eq('user_id', user.id)
        .order('time_of_day', { ascending: true }),
    ]);

    setSessions(sessionsRes.data || []);
    setGoals(goalsRes.data || []);
    setSchedules(schedRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (running && secondsLeft > 0) {
      ref.current = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    } else if (secondsLeft === 0 && running) {
      setRunning(false);
      saveSession();
    }
    return () => clearInterval(ref.current);
  }, [running, secondsLeft]);

  useEffect(() => setSecondsLeft(duration * 60), [duration]);

  const saveSession = async () => {
    if (!user) return;
    const { error } = await supabase.from('prayer_sessions').insert({
      user_id: user.id,
      category,
      duration_minutes: duration,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    if (!error) {
      setSavedMessage('Prayer session saved');
      setTimeout(() => setSavedMessage(''), 2500);
      loadAll();
    }
  };

  const reset = () => {
    setRunning(false);
    setSecondsLeft(duration * 60);
  };

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const progress = 1 - secondsLeft / (duration * 60);
  const r = 120;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - progress);

  const completedSessions = sessions.filter((s) => s.completed).length;
  const totalMinutes = sessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Prayer</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Your Walk with God"
          title={`${totalMinutes} min prayed`}
          subtitle={`${completedSessions} session${completedSessions === 1 ? '' : 's'} completed`}
          right={
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.15)' }}
            >
              <Flame size={24} className="text-white" />
            </div>
          }
          footer={
            <div className="flex items-center gap-4">
              <HeroStat icon={Flame} label={`${completedSessions} sessions`} />
              <HeroStat icon={Award} label={`${goals.length} goals`} />
            </div>
          }
        />
      </div>

      <div className="px-5 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {['timer', 'schedule', 'growth'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 text-sm font-medium rounded-xl capitalize transition-all"
              style={{
                background: tab === t ? 'var(--primary)' : 'transparent',
                color: tab === t ? '#ffffff' : 'var(--text-muted)'
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-5 pb-8">
        {savedMessage && (
          <div
            className="rounded-2xl p-3 mb-4 text-center"
            style={{ background: 'var(--success-soft)', border: '1px solid var(--success)' }}
          >
            <p className="text-xs" style={{ color: 'var(--success)' }}>{savedMessage}</p>
          </div>
        )}

        {tab === 'timer' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2 justify-center">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition"
                  style={{
                    background: category === cat ? 'var(--primary)' : 'var(--card)',
                    color: category === cat ? '#ffffff' : 'var(--text-muted)',
                    border: `1px solid ${category === cat ? 'var(--primary)' : 'var(--border)'}`
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="flex justify-center">
              <div className="relative w-[260px] h-[260px]">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 260 260">
                  <circle cx="130" cy="130" r={r} stroke="var(--card-soft)" strokeWidth="10" fill="none" />
                  <circle
                    cx="130" cy="130" r={r}
                    stroke="var(--accent)" strokeWidth="10" fill="none"
                    strokeLinecap="round" strokeDasharray={c} strokeDashoffset={offset}
                    style={{ transition: 'stroke-dashoffset 1s linear' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-display text-5xl" style={{ color: 'var(--text)' }}>
                    {fmt(secondsLeft)}
                  </p>
                  <p className="text-xs mt-2 uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    {category}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              {[5, 10, 15, 30, 60].map((m) => (
                <button
                  key={m}
                  onClick={() => setDuration(m)}
                  disabled={running}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition"
                  style={{
                    background: duration === m ? 'var(--primary)' : 'var(--card)',
                    color: duration === m ? '#ffffff' : 'var(--text-muted)',
                    border: `1px solid ${duration === m ? 'var(--primary)' : 'var(--border)'}`,
                    opacity: running ? 0.5 : 1
                  }}
                >
                  {m}m
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-3">
              <button
                onClick={reset}
                className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <RotateCcw size={22} style={{ color: 'var(--text)' }} />
              </button>

              <button
                onClick={() => setRunning(!running)}
                className="w-20 h-20 rounded-full flex items-center justify-center active:scale-95 transition"
                style={{ background: 'var(--primary)', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)' }}
              >
                {running ? <Pause size={30} className="text-white" /> : <Play size={30} className="text-white ml-1" />}
              </button>

              <button
                onClick={() => { if (!running) saveSession(); }}
                disabled={running}
                className="w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <Plus size={22} style={{ color: 'var(--text)' }} />
              </button>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div className="space-y-3">
            {schedules.map((s) => (
              <div
                key={s.id}
                className="rounded-2xl p-4 flex items-center justify-between"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.label}</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {s.time_of_day} • {s.duration_minutes} min
                  </p>
                </div>
                <input type="checkbox" defaultChecked={s.active} className="w-5 h-5 accent-blue-600" />
              </div>
            ))}

            {schedules.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No scheduled prayer times yet
              </p>
            )}
          </div>
        )}

        {tab === 'growth' && (
          <div className="space-y-3">
            {goals.map((g) => {
              const pct = Math.round((g.progress / g.target) * 100);
              return (
                <div
                  key={g.id}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-start gap-3">
                    <Target size={20} style={{ color: 'var(--primary)' }} />
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.title}</p>
                      <div
                        className="w-full rounded-full h-2 mt-3 overflow-hidden"
                        style={{ background: 'var(--card-soft)' }}
                      >
                        <div
                          className="h-2 rounded-full"
                          style={{ width: `${pct}%`, background: 'var(--primary)' }}
                        />
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        {g.progress} of {g.target} {g.unit}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {goals.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                No growth goals yet. Add one from the Growth page.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}