import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Music, Camera, Baby, Shield, Sparkles,
  Heart, ChevronRight, CheckCircle2, Send, RefreshCw, Layers
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const ICON_MAP = {
  Users, Music, Camera, Baby, Shield, Sparkles, Heart, Layers,
};

export default function Departments() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(null);
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);

  const mySlugs = profile?.groups || [];

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase.rpc('get_department_stats');

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setDepartments((data || []).filter((d) => d.type === 'department'));
  };

  const handleRequest = async () => {
    if (!showJoin) return;
    setSending(true);

    const { error } = await supabase.from('group_join_requests').insert({
      user_id: profile.id,
      group_id: showJoin.id,
      note: reason.trim() || null,
    });

    setSending(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setShowJoin(null);
    setReason('');
    alert('Request sent. A leader will review it.');
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/worker')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Departments</h1>
        <button
          onClick={loadDepartments}
          disabled={loading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Serve in Ministry"
          title="Departments"
          subtitle="You can belong to more than one"
          right={<HeroIcon icon={Users} />}
        />
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {!loading && departments.length === 0 && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Users size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
              No departments yet
            </p>
          </div>
        </div>
      )}

      {!loading && departments.length > 0 && (
        <div className="px-5 mt-5 pb-6 space-y-2">
          {departments.map((d) => {
            const isMine = mySlugs.includes(d.slug);
            const Icon = ICON_MAP[d.icon] || Users;
            const color = d.color || 'var(--primary)';

            return (
              <div
                key={d.slug}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${isMine ? color : 'var(--border)'}`,
                }}
              >
                <button
                  onClick={() => navigate(`/worker/department/${d.slug}`)}
                  className="flex items-center gap-3 flex-1 min-w-0 text-left"
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: `${color}20` }}
                  >
                    <Icon size={20} style={{ color }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                        {d.name}
                      </p>
                      {isMine && (
                        <span
                          className="text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
                          style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                        >
                          Member
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                      {d.member_count} member{d.member_count === 1 ? '' : 's'}
                    </p>
                  </div>
                </button>

                {isMine ? (
                  <CheckCircle2 size={20} style={{ color }} />
                ) : (
                  <button
                    onClick={() => setShowJoin(d)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium shrink-0"
                    style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
                  >
                    Request
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !sending && setShowJoin(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />
            <h3 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>
              Request to Join {showJoin.name}
            </h3>
            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              The department leader will review your request
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why do you want to join? (optional)"
              rows={3}
              className="w-full p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
              style={{
                background: 'var(--card)',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            />
            <button
              onClick={handleRequest}
              disabled={sending}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              <Send size={18} />
              {sending ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}