import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Target, Calendar, Users, Search, Wallet } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Projects() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setProjects(data || []);
  };

  const filtered = projects
    .filter((p) => p.status === tab)
    .filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));

  const activeCount = projects.filter((p) => p.status === 'active').length;

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Projects</h1>
        {isAdmin ? (
          <button
            onClick={() => navigate('/worker/projects/new')}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={20} className="text-white" />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Giving Together"
          title={`${activeCount} active project${activeCount === 1 ? '' : 's'}`}
          subtitle="Track pledges and progress as a church"
          right={<HeroIcon icon={Target} />}
        />
      </div>

      <div className="px-5 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <TabBtn active={tab === 'active'} onClick={() => setTab('active')} label="Active" />
          <TabBtn active={tab === 'completed'} onClick={() => setTab('completed')} label="Completed" />
          <TabBtn active={tab === 'paused'} onClick={() => setTab('paused')} label="Paused" />
        </div>
      </div>

      <div className="px-5 mt-3">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>
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

      {!loading && filtered.length === 0 && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Target size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>
              No {tab} projects
            </p>
            {isAdmin && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Tap + to create one
              </p>
            )}
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onClick={() => navigate(`/worker/projects/${p.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}

function ProjectCard({ project, onClick }) {
  const pct = project.target > 0
    ? Math.min(100, Math.round((project.raised / project.target) * 100))
    : 0;

  const fmt = (n) => `N ${Number(n).toLocaleString()}`;

  const remaining = Math.max(0, project.target - project.raised);

  return (
    <button
      onClick={onClick}
      className="w-full rounded-2xl p-4 text-left active:scale-[0.98] transition"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-base" style={{ color: 'var(--text)' }}>
            {project.title}
          </h3>
          <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {project.deadline && (
              <div className="flex items-center gap-1">
                <Calendar size={12} />
                <span>
                  {new Date(project.deadline).toLocaleDateString('en-NG', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <Wallet size={12} />
              <span>{fmt(remaining)} to go</span>
            </div>
          </div>
        </div>
        {project.status === 'completed' && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shrink-0"
            style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
          >
            Done
          </span>
        )}
        {project.status === 'paused' && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded shrink-0"
            style={{ background: 'var(--card-soft)', color: 'var(--text-muted)' }}
          >
            Paused
          </span>
        )}
      </div>

      <div className="mt-3">
        <div
          className="w-full rounded-full h-2 overflow-hidden"
          style={{ background: 'var(--card-soft)' }}
        >
          <div
            className="h-2 rounded-full"
            style={{ width: `${pct}%`, background: project.color }}
          />
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {fmt(project.raised)} of {fmt(project.target)}
          </span>
          <span className="text-xs font-semibold" style={{ color: project.color }}>
            {pct}%
          </span>
        </div>
      </div>
    </button>
  );
}