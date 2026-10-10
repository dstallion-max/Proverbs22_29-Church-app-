import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Target, CheckCircle2, Plus, Heart, AlertCircle } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const COLORS = ['var(--primary)', 'var(--success)', 'var(--accent)', '#a855f7', '#ec4899', '#06b6d4'];
const CATEGORIES = ['Equipment', 'Building', 'Missions', 'Events', 'Welfare', 'Youth', 'Other'];

export default function CreateProject() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [target, setTarget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('Equipment');
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = profile?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <AlertCircle size={36} style={{ color: 'var(--danger)' }} />
        <p className="text-sm mt-4 text-center" style={{ color: 'var(--text)' }}>
          Only church admins can create projects.
        </p>
      </div>
    );
  }

  const handleCreate = async () => {
    setError('');

    if (!title.trim()) return setError('Enter a project title');
    const targetNum = parseFloat(target);
    if (!targetNum || targetNum <= 0) return setError('Enter a valid target amount');
    if (!deadline) return setError('Pick a deadline');

    setSaving(true);

    const { error } = await supabase.from('projects').insert({
      title: title.trim(),
      description: description.trim() || null,
      target: targetNum,
      raised: 0,
      deadline,
      category,
      color,
      status: 'active',
      created_by: user?.id || null,
    });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    navigate('/worker/projects');
  };

  const inputStyle = {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  };

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Project</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Create Project"
          title="Start a Contribution"
          subtitle="Bring the church together for a goal"
          right={<HeroIcon icon={Target} />}
        />
      </div>

      <div className="px-5 mt-5 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Project Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. New Keyboard for Choir"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why this project matters..."
            rows={3}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Target Amount (Naira)
          </label>
          <input
            type="number"
            inputMode="numeric"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="150000"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Deadline
          </label>
          <input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={inputStyle}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={inputStyle}
          >
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Color
          </label>
          <div className="flex gap-3 mt-2">
            {COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
                style={{
                  background: c,
                  border: color === c ? '3px solid var(--text)' : '3px solid transparent',
                }}
              >
                {color === c && <CheckCircle2 size={18} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 mt-5">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}
        >
          <Heart size={18} style={{ color: 'var(--primary)' }} className="mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--primary)' }}>
            Members will be notified once your project is live. All contributions appear on the project page.
          </p>
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6 pb-6">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {saving ? (
            'Creating...'
          ) : (
            <><Plus size={18} />Create Project</>
          )}
        </button>
      </div>
    </div>
  );
}