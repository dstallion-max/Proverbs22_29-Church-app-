import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Sparkles, Save, CheckCircle2, Heart } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Reflection() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [point, setPoint] = useState(null);
  const [sermon, setSermon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reflection, setReflection] = useState('');
  const [prayer, setPrayer] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (id && user) loadPoint();
  }, [id, user]);

  const loadPoint = async () => {
    setLoading(true);

    const { data: pointData, error: pointErr } = await supabase
      .from('sermon_points')
      .select('*, sermons(title, teacher, scripture)')
      .eq('id', id)
      .maybeSingle();

    if (pointErr) {
      setError(friendlyError(pointErr));
      setLoading(false);
      return;
    }

    if (!pointData) {
      setError('Point not found');
      setLoading(false);
      return;
    }

    setPoint(pointData);
    setSermon(pointData.sermons);

    // Load existing reflection if any
    const { data: existing } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .eq('sermon_point_id', id)
      .maybeSingle();

    if (existing) {
      setReflection(existing.reflection || '');
      setPrayer(existing.prayer || '');
    }

    setLoading(false);
  };

  const handleSave = async () => {
    if (!user || !point) return;
    setSaving(true);
    setError('');

    const payload = {
      user_id: user.id,
      sermon_point_id: point.id,
      reflection: reflection.trim() || null,
      prayer: prayer.trim() || null,
    };

    const { error } = await supabase
      .from('reflections')
      .upsert(payload, { onConflict: 'user_id,sermon_point_id' });

    setSaving(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const inputStyle = {
    background: 'var(--card)',
    color: 'var(--text)',
    border: '1px solid var(--border)'
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

  if (error || !point) {
    return (
      <div className="min-h-screen max-w-md mx-auto p-5" style={{ background: 'var(--bg)' }}>
        <p className="text-sm mt-20 text-center" style={{ color: 'var(--danger)' }}>
          {error || 'Point not found'}
        </p>
      </div>
    );
  }

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Reflection</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow={`Day ${point.day} • ${point.session}`}
          title={point.title}
          subtitle={point.body}
          right={<HeroIcon icon={BookOpen} />}
          footer={
            point.scripture ? (
              <p className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.9)' }}>
                {point.scripture}
              </p>
            ) : null
          }
        />
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} style={{ color: 'var(--accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>
            What is God saying to you about this?
          </p>
        </div>
        <textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder="Write your thoughts..."
          rows={5}
          className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-none"
          style={inputStyle}
        />
      </div>

      <div className="px-5 mt-5">
        <div className="flex items-center gap-2 mb-2">
          <Heart size={16} style={{ color: 'var(--danger)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>My prayer response</p>
        </div>
        <textarea
          value={prayer}
          onChange={(e) => setPrayer(e.target.value)}
          placeholder="Lord, I pray..."
          rows={3}
          className="w-full p-4 rounded-2xl text-sm focus:outline-none resize-none"
          style={inputStyle}
        />
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6 pb-6 space-y-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {saved ? (
            <><CheckCircle2 size={18} />Saved</>
          ) : saving ? (
            'Saving...'
          ) : (
            <><Save size={18} />Save Reflection</>
          )}
        </button>

        <button
          onClick={() => navigate('/sermons')}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)', color: 'var(--text)' }}
        >
          Back to Sermon Points
        </button>
      </div>
    </div>
  );
}