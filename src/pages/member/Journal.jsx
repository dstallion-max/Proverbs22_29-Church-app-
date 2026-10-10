import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Lock, Plus, ShieldCheck, CheckCircle2, Target, BookOpen, X
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Journal() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [draft, setDraft] = useState({ struggle: '', plan: '', scripture: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) loadEntries();
  }, [user]);

  const loadEntries = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    setEntries(data || []);
  };

  const saveEntry = async () => {
    if (!draft.struggle.trim()) return;
    setSaving(true);

    const { error } = await supabase.from('journal_entries').insert({
      user_id: user.id,
      struggle: draft.struggle.trim(),
      plan: draft.plan.trim() || null,
      scripture: draft.scripture.trim() || null,
      progress: 0,
    });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setDraft({ struggle: '', plan: '', scripture: '' });
    setShowAdd(false);
    loadEntries();
  };

  const updateProgress = async (entry, delta) => {
    const next = Math.max(0, Math.min(100, entry.progress + delta));
    const { error } = await supabase
      .from('journal_entries')
      .update({ progress: next })
      .eq('id', entry.id);
    if (!error) loadEntries();
  };

  const deleteEntry = async (id) => {
    if (!confirm('Delete this entry?')) return;
    const { error } = await supabase.from('journal_entries').delete().eq('id', id);
    if (!error) loadEntries();
  };

  const inputStyle = {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)'
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/growth')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>My Journal</h1>
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Spiritual Growth"
          title="Private Journal"
          subtitle="Only you can see this — not even leaders"
          right={<HeroIcon icon={Lock} />}
        />
      </div>

      <div className="px-5 mt-4">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--card-soft)', border: '1px solid var(--border)' }}
        >
          <ShieldCheck size={18} style={{ color: 'var(--success)' }} className="mt-0.5 shrink-0" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Private and encrypted. Your struggles and plans stay between you and God.
          </p>
        </div>
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

      {!loading && entries.length === 0 && (
        <div className="px-5 mt-6">
          <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
            No entries yet. Tap + to start.
          </p>
        </div>
      )}

      {!loading && entries.length > 0 && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {entries.map((e) => (
            <div
              key={e.id}
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
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{e.struggle}</p>
                  {e.plan && (
                    <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Plan: {e.plan}</p>
                  )}
                  {e.scripture && (
                    <div className="flex items-center gap-1.5 mt-2 text-xs" style={{ color: 'var(--primary)' }}>
                      <BookOpen size={12} />
                      <span>{e.scripture}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {new Date(e.created_at).toLocaleDateString()}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--primary)' }}>{e.progress}%</span>
                  </div>
                  <div
                    className="w-full rounded-full h-2 mt-1.5 overflow-hidden"
                    style={{ background: 'var(--card-soft)' }}
                  >
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${e.progress}%`, background: 'var(--primary)' }}
                    />
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => updateProgress(e, 5)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--success-soft)', color: 'var(--success)' }}
                    >
                      +5%
                    </button>
                    <button
                      onClick={() => updateProgress(e, -5)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      -5%
                    </button>
                    <button
                      onClick={() => deleteEntry(e.id)}
                      className="px-3 py-2 rounded-lg text-xs font-medium"
                      style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

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
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>New Entry</h3>
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
                placeholder="What am I struggling with?"
                value={draft.struggle}
                onChange={(e) => setDraft({ ...draft, struggle: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="What's my plan?"
                value={draft.plan}
                onChange={(e) => setDraft({ ...draft, plan: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
              <input
                placeholder="Scripture"
                value={draft.scripture}
                onChange={(e) => setDraft({ ...draft, scripture: e.target.value })}
                className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>

            <button
              onClick={saveEntry}
              disabled={saving}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition flex items-center justify-center gap-2 disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              <CheckCircle2 size={18} />
              {saving ? 'Saving...' : 'Save Entry'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}