import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Target, Plus, Flame, Award, Lock, TrendingUp, BookOpen,
  X, CheckCircle2, AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Growth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState('goals');
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [draft, setDraft] = useState({ title: '', target: '', unit: 'days', deadline: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('growth_goals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    setGoals(data || []);
  };

  const handleAddGoal = async () => {
    if (!draft.title.trim()) return;
    const target = parseInt(draft.target);
    if (!target || target < 1) return;

    setSaving(true);

    const { error } = await supabase.from('growth_goals').insert({
      user_id: user.id,
      title: draft.title.trim(),
      target,
      unit: draft.unit,
      deadline: draft.deadline || null,
      progress: 0,
    });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setDraft({ title: '', target: '', unit: 'days', deadline: '' });
    setShowAddGoal(false);
    loadGoals();
  };

  const incrementGoal = async (goal) => {
    const next = Math.min(goal.progress + 1, goal.target);
    const completed = next >= goal.target;

    const { error } = await supabase
      .from('growth_goals')
      .update({ progress: next, completed })
      .eq('id', goal.id);

    if (!error) loadGoals();
  };

  const deleteGoal = async (id) => {
    if (!confirm('Delete this goal?')) return;
    const { error } = await supabase.from('growth_goals').delete().eq('id', id);
    if (!error) loadGoals();
  };

  const inputStyle = {
    background: 'var(--card-soft)',
    color: 'var(--text)',
    border: '1px solid var(--border)'
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Spiritual Growth</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <div
          className="relative rounded-3xl p-5 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
            boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)'
          }}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>My Journey</p>
              <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>
                Private • Only visible to you
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-1.5">
                  <Award size={16} className="text-white" />
                  <span className="text-sm text-white font-medium">{goals.length} goals</span>
                </div>
              </div>
            </div>
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center shrink-0"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
            >
              <TrendingUp size={26} className="text-white" strokeWidth={2} />
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <TabButton active={tab === 'goals'} onClick={() => setTab('goals')} label="Goals" />
          <TabButton active={tab === 'journal'} onClick={() => setTab('journal')} label="Journal" />
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <div className="rounded-2xl p-3 flex items-center gap-2" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}>
            <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
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

      {!loading && tab === 'goals' && (
        <div className="px-5 mt-4 pb-8 space-y-3">
          {goals.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Target size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No goals yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Add your first spiritual goal
              </p>
            </div>
          )}

          {goals.map((g) => {
            const pct = Math.round((g.progress / g.target) * 100);
            return (
              <div
                key={g.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--primary-soft)' }}
                  >
                    <Target size={18} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.title}</p>
                    {g.deadline && (
                      <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                        Deadline: {new Date(g.deadline).toLocaleDateString()}
                      </p>
                    )}
                    <div
                      className="w-full rounded-full h-2 mt-3 overflow-hidden"
                      style={{ background: 'var(--card-soft)' }}
                    >
                      <div
                        className="h-2 rounded-full"
                        style={{ width: `${pct}%`, background: 'var(--primary)' }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs" style={{ color: 'var(--text-dim)' }}>
                        {g.progress} of {g.target} {g.unit}
                      </p>
                      <p className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{pct}%</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => incrementGoal(g)}
                        disabled={g.completed}
                        className="flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-50"
                        style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                      >
                        +1 Progress
                      </button>
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="px-3 py-2 rounded-xl text-xs font-medium"
                        style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          <button
            onClick={() => setShowAddGoal(true)}
            className="w-full py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition text-white"
            style={{ background: 'var(--primary)' }}
          >
            <Plus size={18} />
            Add New Goal
          </button>
        </div>
      )}

      {!loading && tab === 'journal' && (
        <div className="px-5 mt-4 pb-8 space-y-3">
          <div
            className="rounded-2xl p-4 flex items-start gap-3"
            style={{ background: 'var(--card-soft)', border: '1px solid var(--border)' }}
          >
            <Lock size={18} style={{ color: 'var(--primary)' }} className="mt-0.5 shrink-0" />
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              Private and encrypted. Your struggles and plans stay between you and God.
            </p>
          </div>

          <button
            onClick={() => navigate('/journal')}
            className="w-full py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition text-white"
            style={{ background: 'var(--primary)' }}
          >
            <BookOpen size={18} />
            Open My Journal
          </button>
        </div>
      )}

      {showAddGoal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setShowAddGoal(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Goal</h3>
              <button
                onClick={() => !saving && setShowAddGoal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="e.g. Read Bible in 90 days"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="Target (e.g. 90)"
                  value={draft.target}
                  onChange={(e) => setDraft({ ...draft, target: e.target.value })}
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
                <select
                  value={draft.unit}
                  onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="verses">Verses</option>
                  <option value="chapters">Chapters</option>
                  <option value="sessions">Sessions</option>
                </select>
              </div>
              <input
                type="date"
                value={draft.deadline}
                onChange={(e) => setDraft({ ...draft, deadline: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <button
              onClick={handleAddGoal}
              disabled={saving}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              <CheckCircle2 size={18} />
              {saving ? 'Saving...' : 'Add Goal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabButton({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)'
      }}
    >
      {label}
    </button>
  );
}