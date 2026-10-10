import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, Calendar, Users, TrendingUp, Plus,
  CheckCircle2, Share2, Wallet, X, AlertCircle
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [project, setProject] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showPledge, setShowPledge] = useState(false);
  const [pledgeAmount, setPledgeAmount] = useState('');
  const [pledgeName, setPledgeName] = useState('');
  const [pledgeAnonymous, setPledgeAnonymous] = useState(false);
  const [pledgeNote, setPledgeNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id) loadProject();
  }, [id]);

  const loadProject = async () => {
    setLoading(true);
    setError('');

    const { data: projData, error: projErr } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (projErr) {
      setLoading(false);
      setError(friendlyError(projErr));
      return;
    }

    if (!projData) {
      setLoading(false);
      setError('Project not found');
      return;
    }

    setProject(projData);

    // Load contributions with user names
    const { data: contribData } = await supabase
      .from('contributions')
      .select('*')
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (contribData && contribData.length > 0) {
      const userIds = contribData.map((c) => c.user_id).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username')
          .in('id', userIds);

        const profileMap = {};
        (profiles || []).forEach((p) => { profileMap[p.id] = p; });

        setContributions(
          contribData.map((c) => ({
            ...c,
            user: profileMap[c.user_id] || null,
          }))
        );
      } else {
        setContributions(contribData);
      }
    } else {
      setContributions([]);
    }

    setLoading(false);
  };

  const handlePledge = async () => {
    const amount = parseFloat(pledgeAmount);
    if (!amount || amount <= 0) {
      setError('Enter a valid amount');
      return;
    }

    setSaving(true);
    setError('');

    const { error } = await supabase.from('contributions').insert({
      project_id: id,
      user_id: user?.id || null,
      contributor_name: pledgeAnonymous ? 'Anonymous' : (pledgeName.trim() || profile?.full_name || 'Anonymous'),
      amount,
      anonymous: pledgeAnonymous,
      note: pledgeNote.trim() || null,
    });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setSaved(true);
    setPledgeAmount('');
    setPledgeName('');
    setPledgeNote('');
    setPledgeAnonymous(false);
    await loadProject();
    setTimeout(() => {
      setSaved(false);
      setShowPledge(false);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div
          className="w-10 h-10 rounded-full border-2 animate-spin"
          style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
        />
      </div>
    );
  }

  if (error && !project) {
    return (
      <div className="min-h-screen max-w-md mx-auto p-5" style={{ background: 'var(--bg)' }}>
        <p className="text-sm mt-20 text-center" style={{ color: 'var(--danger)' }}>
          {error || 'Project not found'}
        </p>
      </div>
    );
  }

  const pct = project.target > 0
    ? Math.min(100, Math.round((project.raised / project.target) * 100))
    : 0;

  const remaining = Math.max(0, project.target - project.raised);
  const fmt = (n) => `N ${Number(n).toLocaleString()}`;

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/worker/projects')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Project</h1>
        <button
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <Share2 size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow={project.status === 'completed' ? 'Completed Project' : 'Active Project'}
          title={project.title}
          subtitle={project.description}
          right={<HeroIcon icon={Target} />}
        />
      </div>

      {/* Progress card */}
      <div className="px-5 mt-5">
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-baseline justify-between mb-3">
            <p className="font-display text-3xl" style={{ color: 'var(--text)' }}>
              {fmt(project.raised)}
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              of {fmt(project.target)}
            </p>
          </div>

          <div
            className="w-full rounded-full h-3 overflow-hidden"
            style={{ background: 'var(--card-soft)' }}
          >
            <div
              className="h-3 rounded-full transition-all"
              style={{ width: `${pct}%`, background: project.color }}
            />
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm font-semibold" style={{ color: project.color }}>
              {pct}% funded
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {fmt(remaining)} to go
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {project.deadline && (
              <div
                className="rounded-xl p-3 flex items-center gap-2"
                style={{ background: 'var(--card-soft)' }}
              >
                <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
                <div>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Deadline</p>
                  <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                    {new Date(project.deadline).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            )}
            <div
              className="rounded-xl p-3 flex items-center gap-2"
              style={{ background: 'var(--card-soft)' }}
            >
              <Users size={16} style={{ color: 'var(--text-muted)' }} />
              <div>
                <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>Contributors</p>
                <p className="text-xs font-medium" style={{ color: 'var(--text)' }}>
                  {contributions.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pledge */}
      {project.status === 'active' && (
        <div className="px-5 mt-5">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
            Make a Pledge
          </h2>

          <button
            onClick={() => setShowPledge(true)}
            className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition"
            style={{ background: project.color }}
          >
            <Plus size={18} />
            Pledge to this project
          </button>
        </div>
      )}

      {/* Contributions */}
      <div className="px-5 mt-6 pb-6">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Recent Contributions
          </h2>
        </div>

        {contributions.length === 0 ? (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Wallet size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No contributions yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Be the first to give
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {contributions.slice(0, 10).map((c) => (
              <div
                key={c.id}
                className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${project.color}20` }}
                >
                  <span className="text-xs font-bold" style={{ color: project.color }}>
                    {c.anonymous ? 'A' : (c.contributor_name || 'A').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {c.anonymous ? 'Anonymous' : (c.contributor_name || 'Contributor')}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>
                    {new Date(c.created_at).toLocaleDateString('en-NG', {
                      day: 'numeric', month: 'short',
                    })}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: project.color }}>
                  {fmt(c.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {/* Pledge sheet */}
      {showPledge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setShowPledge(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Pledge
              </h3>
              <button
                onClick={() => !saving && setShowPledge(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <p className="text-sm mb-5" style={{ color: 'var(--text-muted)' }}>
              Pledge to <strong style={{ color: 'var(--text)' }}>{project.title}</strong>
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Amount (Naira)
                </label>
                <div className="relative mt-2">
                  <span
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-medium"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    N
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={pledgeAmount}
                    onChange={(e) => setPledgeAmount(e.target.value)}
                    placeholder="0"
                    className="w-full pl-9 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
                    style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[1000, 5000, 10000, 20000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setPledgeAmount(amt.toString())}
                    className="py-2 rounded-xl text-xs font-medium"
                    style={{
                      background: 'var(--card)',
                      color: 'var(--text-muted)',
                      border: '1px solid var(--border)',
                    }}
                  >
                    {amt.toLocaleString()}
                  </button>
                ))}
              </div>

              {!pledgeAnonymous && (
                <div>
                  <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                    Your name (optional)
                  </label>
                  <input
                    type="text"
                    value={pledgeName}
                    onChange={(e) => setPledgeName(e.target.value)}
                    placeholder={profile?.full_name || 'Leave blank to use your profile name'}
                    className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
                    style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              )}

              <button
                onClick={() => setPledgeAnonymous(!pledgeAnonymous)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-5 h-5 rounded flex items-center justify-center"
                  style={{
                    background: pledgeAnonymous ? 'var(--primary)' : 'var(--card-soft)',
                    border: `1px solid ${pledgeAnonymous ? 'var(--primary)' : 'var(--border)'}`,
                  }}
                >
                  {pledgeAnonymous && <CheckCircle2 size={14} className="text-white" />}
                </div>
                <span className="text-sm" style={{ color: 'var(--text)' }}>
                  Give anonymously
                </span>
              </button>

              <input
                type="text"
                value={pledgeNote}
                onChange={(e) => setPledgeNote(e.target.value)}
                placeholder="Optional note"
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>

            <button
              onClick={handlePledge}
              disabled={saving || !pledgeAmount}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: project.color }}
            >
              {saved ? (
                <><CheckCircle2 size={18} />Pledged</>
              ) : saving ? (
                'Saving...'
              ) : (
                <><Plus size={18} />Pledge</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}