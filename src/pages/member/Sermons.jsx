import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, ChevronRight, Lock, CheckCircle2, Sun, Moon, ArrowLeft, Sparkles
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getUserGroup } from '../../utils/groups';
import { friendlyError } from '../../utils/errors';

export default function Sermons() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    if (profile) loadSermon();
  }, [profile]);

  const loadSermon = async () => {
    setLoading(true);
    setError('');

    const groupId = getUserGroup(profile);

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

  const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Determine "current day" based on today's date
  const today = new Date();
  const currentDay = sermon?.taught_on
    ? Math.max(1, Math.min(
        Math.ceil((today - new Date(sermon.taught_on)) / (1000 * 60 * 60 * 24)) + 1,
        4
      ))
    : 1;

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>The Word</h1>
        <div className="w-10" />
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {!loading && !sermon && (
        <div className="px-5 mt-8">
          <div
            className="rounded-3xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <BookOpen size={32} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-4" style={{ color: 'var(--text)' }}>
              No sermon yet this week
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Your teacher hasn't uploaded this week's lesson. Check back soon.
            </p>
          </div>
        </div>
      )}

      {!loading && sermon && (
        <>
          <div className="px-5 mt-1">
            <HeroCard
              eyebrow="This Week's Sermon"
              title={sermon.title}
              subtitle={`${sermon.teacher} • ${formatDate(sermon.taught_on)}`}
              right={<HeroIcon icon={BookOpen} />}
              footer={
                <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                  {sermon.scripture}
                </p>
              }
            />
          </div>

          <div className="px-5 mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Day {currentDay} • {sermon.points.length} point{sermon.points.length === 1 ? '' : 's'} this week
            </p>
          </div>

          <div className="px-5 mt-4 pb-8 space-y-3">
            {sermon.points.length === 0 && (
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Points will appear soon.
                </p>
              </div>
            )}

            {sermon.points.map((point, idx) => {
              const isToday = point.day === currentDay;
              const isPast = point.day < currentDay;
              const isLocked = point.day > currentDay;
              const isOpen = expanded === idx;

              return (
                <div
                  key={point.id}
                  className="w-full text-left rounded-2xl p-4 transition"
                  style={{
                    background: 'var(--card)',
                    border: isToday ? '1px solid var(--primary)' : '1px solid var(--border)',
                    opacity: isLocked ? 0.5 : 1
                  }}
                >
                  <button
                    onClick={() => !isLocked && setExpanded(isOpen ? null : idx)}
                    disabled={isLocked}
                    className="w-full text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {point.session === 'Morning' || point.session === 'Afternoon' ? (
                          <Sun size={14} style={{ color: isToday ? 'var(--accent)' : 'var(--text-muted)' }} />
                        ) : (
                          <Moon size={14} style={{ color: isToday ? 'var(--primary)' : 'var(--text-muted)' }} />
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                          Day {point.day} • {point.session}
                        </span>
                      </div>

                      {isLocked ? (
                        <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                      ) : isPast ? (
                        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
                      ) : (
                        <ChevronRight
                          size={18}
                          style={{ color: 'var(--primary)' }}
                          className={`transition-transform ${isOpen ? 'rotate-90' : ''}`}
                        />
                      )}
                    </div>

                    <h3 className="font-display text-base mt-2" style={{ color: 'var(--text)' }}>
                      {point.title}
                    </h3>
                  </button>

                  {isOpen && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
                      <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        {point.body}
                      </p>
                      {point.scripture && (
                        <p className="text-xs mt-3 font-medium" style={{ color: 'var(--primary)' }}>
                          {point.scripture}
                        </p>
                      )}

                      <button
                        onClick={() => navigate(`/sermons/${point.id}/reflect`)}
                        className="mt-3 w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2 text-white active:scale-[0.98] transition"
                        style={{ background: 'var(--primary)' }}
                      >
                        <Sparkles size={16} />
                        Reflect on this point
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}
    </div>
  );
}