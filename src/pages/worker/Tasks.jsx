import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2, Circle, Clock, ArrowLeft, ClipboardList, Plus, Trash2, X, Save
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const priorityMap = {
  high: { label: 'High', color: 'var(--danger)' },
  medium: { label: 'Medium', color: 'var(--accent)' },
  low: { label: 'Low', color: 'var(--primary)' },
};

export default function Tasks() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [draft, setDraft] = useState({
    title: '',
    description: '',
    priority: 'medium',
  });

  const canCreateTask = ['lead', 'admin'].includes(profile?.role);

  useEffect(() => {
    if (user) loadTasks();
  }, [user]);

  const loadTasks = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('assigned_to', user.id)
      .order('completed')
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    setTasks(data || []);
  };

  const toggleTask = async (task) => {
    const next = !task.completed;
    const { error } = await supabase
      .from('tasks')
      .update({
        completed: next,
        completed_at: next ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    loadTasks();
  };

  const handleAdd = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('tasks').insert({
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      priority: draft.priority,
      assigned_to: user.id,
      created_by: user.id,
    });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setDraft({ title: '', description: '', priority: 'medium' });
    setShowAdd(false);
    loadTasks();
  };

  const deleteTask = async (id) => {
    if (!confirm('Delete this task?')) return;
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) loadTasks();
  };

  const completed = tasks.filter((t) => t.completed).length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  const inputStyle = {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>My Tasks</h1>
        {canCreateTask ? (
          <button
            onClick={() => setShowAdd(true)}
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
          eyebrow="Today's Checklist"
          title={`${completed} of ${total} done`}
          subtitle={total === 0 ? 'No tasks yet' : `${pct}% complete`}
          right={<HeroIcon icon={ClipboardList} />}
          footer={
            total > 0 ? (
              <div
                className="w-full rounded-full h-2 overflow-hidden"
                style={{ background: 'rgba(255,255,255,0.2)' }}
              >
                <div
                  className="h-2 rounded-full transition-all"
                  style={{ width: `${pct}%`, background: '#ffffff' }}
                />
              </div>
            ) : null
          }
        />
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="px-5 mt-8">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <ClipboardList size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No tasks yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              {canCreateTask ? 'Tap + to add a task' : 'Your leader will assign tasks soon'}
            </p>
          </div>
        </div>
      )}

      {!loading && tasks.length > 0 && (
        <div className="px-5 mt-6 pb-6 space-y-2">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="rounded-2xl p-4 flex items-start gap-3"
              style={{
                background: t.completed ? 'var(--success-soft)' : 'var(--card)',
                border: `1px solid ${t.completed ? 'var(--success)' : 'var(--border)'}`,
              }}
            >
              <button onClick={() => toggleTask(t)} className="shrink-0 mt-0.5">
                {t.completed ? (
                  <CheckCircle2 size={22} style={{ color: 'var(--success)' }} />
                ) : (
                  <Circle size={22} style={{ color: 'var(--text-muted)' }} />
                )}
              </button>

              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-medium"
                  style={{
                    color: 'var(--text)',
                    textDecoration: t.completed ? 'line-through' : 'none',
                    opacity: t.completed ? 0.7 : 1,
                  }}
                >
                  {t.title}
                </p>
                {t.description && (
                  <p
                    className="text-xs mt-1"
                    style={{
                      color: 'var(--text-muted)',
                      textDecoration: t.completed ? 'line-through' : 'none',
                    }}
                  >
                    {t.description}
                  </p>
                )}
                <span
                  className="inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mt-2"
                  style={{
                    color: priorityMap[t.priority]?.color,
                    background: `${priorityMap[t.priority]?.color}20`,
                  }}
                >
                  {priorityMap[t.priority]?.label}
                </span>
              </div>

              {canCreateTask && (
                <button
                  onClick={() => deleteTask(t.id)}
                  className="p-1 shrink-0"
                  style={{ color: 'var(--danger)' }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add task sheet */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setShowAdd(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Task</h3>
              <button
                onClick={() => !saving && setShowAdd(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <input
                placeholder="Task title"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
              <textarea
                placeholder="Description (optional)"
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                rows={3}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
              <div>
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Priority
                </label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {['low', 'medium', 'high'].map((p) => {
                    const active = draft.priority === p;
                    return (
                      <button
                        key={p}
                        onClick={() => setDraft({ ...draft, priority: p })}
                        className="p-3 rounded-2xl text-xs font-medium capitalize transition"
                        style={{
                          background: active ? 'var(--primary)' : 'var(--card)',
                          color: active ? '#ffffff' : 'var(--text)',
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={saving || !draft.title.trim()}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              <Save size={18} />
              {saving ? 'Saving...' : 'Add Task'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}