import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Clock, User, Plus, Edit3, ArrowLeft, Trash2, Save,
  CheckCircle2, X
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const defaultLineup = [
  { time: '8:00 AM', title: 'Opening Prayer', person: 'Bro. Samuel', duration: '5 min' },
  { time: '8:05 AM', title: 'Praise & Worship', person: 'Choir Team', duration: '20 min' },
  { time: '8:25 AM', title: 'Welcome & Announcements', person: 'Sis. Grace', duration: '5 min' },
  { time: '8:30 AM', title: 'Scripture Reading', person: 'Bro. David', duration: '5 min' },
  { time: '8:35 AM', title: 'Offering', person: 'Usher Team', duration: '10 min' },
  { time: '8:45 AM', title: 'Sermon', person: 'Pastor Adeyemi', duration: '45 min', highlight: true },
  { time: '9:30 AM', title: 'Closing Prayer', person: 'Pastor Adeyemi', duration: '5 min' },
];

export default function ServicePlan() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [title, setTitle] = useState('Sunday Service');
  const [lineup, setLineup] = useState(defaultLineup);
  const [existingId, setExistingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const canEdit = ['worker', 'lead', 'admin'].includes(profile?.role);

  useEffect(() => {
    loadPlan();
  }, [serviceDate]);

  const loadPlan = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('service_plans')
      .select('*')
      .eq('service_date', serviceDate)
      .maybeSingle();

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    if (data) {
      setExistingId(data.id);
      setTitle(data.title || 'Sunday Service');
      setLineup(data.lineup && data.lineup.length ? data.lineup : defaultLineup);
    } else {
      setExistingId(null);
      setTitle('Sunday Service');
      setLineup(defaultLineup);
    }
  };

  const updateItem = (idx, field, value) => {
    setLineup(lineup.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  };

  const addItem = () => setLineup([...lineup, { time: '', title: '', person: '', duration: '' }]);

  const removeItem = (idx) => setLineup(lineup.filter((_, i) => i !== idx));

  const handleSave = async () => {
    setError('');
    setSaving(true);

    const payload = {
      service_date: serviceDate,
      title: title.trim() || 'Sunday Service',
      lineup,
      created_by: user?.id || null,
    };

    let err;
    if (existingId) {
      ({ error: err } = await supabase
        .from('service_plans')
        .update({ title: payload.title, lineup: payload.lineup })
        .eq('id', existingId));
    } else {
      ({ error: err } = await supabase.from('service_plans').insert(payload));
    }

    setSaving(false);

    if (err) {
      setError(friendlyError(err));
      return;
    }

    setSaved(true);
    await loadPlan();
    setTimeout(() => {
      setSaved(false);
      setEditorOpen(false);
    }, 1500);
  };

  const formattedDate = new Date(serviceDate).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/worker')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Service Plan
        </h1>
        {canEdit ? (
          <button
            onClick={() => setEditorOpen(true)}
            className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Edit3 size={18} style={{ color: 'var(--text)' }} />
          </button>
        ) : (
          <div className="w-10" />
        )}
      </div>

      {/* Hero */}
      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Sunday Service Plan"
          title={formattedDate}
          subtitle="Service starts 8:00 AM"
          right={<HeroIcon icon={Calendar} />}
        />
      </div>

      {/* Lineup */}
      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Lineup
        </h2>

        {loading ? (
          <div className="flex justify-center py-10">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {lineup.map((item, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4 flex items-start gap-3"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${item.highlight ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="px-2.5 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap"
                  style={{
                    background: item.highlight ? 'var(--accent)' : 'var(--primary-soft)',
                    color: item.highlight ? '#ffffff' : 'var(--primary)',
                  }}
                >
                  {item.time}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-base" style={{ color: 'var(--text)' }}>
                    {item.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    {item.person && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <User size={12} />
                        <span>{item.person}</span>
                      </div>
                    )}
                    {item.duration && (
                      <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                        <Clock size={12} />
                        <span>{item.duration}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="px-5 mt-5">
        <div
          className="rounded-2xl p-4"
          style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
        >
          <p className="text-xs text-center font-medium" style={{ color: 'var(--accent)' }}>
            All workers should arrive 30 minutes before service
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
          onClick={() => canEdit && setEditorOpen(true)}
          disabled={!canEdit}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-50"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={18} />
          {canEdit ? 'Edit Plan' : 'View Only'}
        </button>
      </div>

      {/* Editor sheet */}
      {editorOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setEditorOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl safe-bottom anim-slide-up flex flex-col"
            style={{ background: 'var(--bg-soft)', maxHeight: '90vh' }}
          >
            {/* Sheet header */}
            <div className="p-5 pb-3">
              <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  Edit Plan
                </h3>
                <button
                  onClick={() => !saving && setEditorOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--card)' }}
                >
                  <X size={16} style={{ color: 'var(--text)' }} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={serviceDate}
                  onChange={(e) => setServiceDate(e.target.value)}
                  className="p-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Service title"
                  className="p-3 rounded-xl text-sm focus:outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            {/* Editable list */}
            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-3 space-y-3">
              {lineup.map((item, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl p-4"
                  style={{
                    background: 'var(--card)',
                    border: `1px solid ${item.highlight ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                      #{idx + 1}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateItem(idx, 'highlight', !item.highlight)}
                        className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
                        style={{
                          background: item.highlight ? 'var(--accent)' : 'var(--card-soft)',
                          color: item.highlight ? '#ffffff' : 'var(--text-muted)',
                        }}
                      >
                        {item.highlight ? 'Main' : 'Mark Main'}
                      </button>
                      {lineup.length > 1 && (
                        <button onClick={() => removeItem(idx)} className="p-1" style={{ color: 'var(--danger)' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={item.time}
                      onChange={(e) => updateItem(idx, 'time', e.target.value)}
                      placeholder="Time"
                      className="p-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    />
                    <input
                      type="text"
                      value={item.duration}
                      onChange={(e) => updateItem(idx, 'duration', e.target.value)}
                      placeholder="Duration"
                      className="p-2.5 rounded-xl text-sm focus:outline-none"
                      style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => updateItem(idx, 'title', e.target.value)}
                    placeholder="Activity title"
                    className="w-full mt-2 p-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                  <input
                    type="text"
                    value={item.person}
                    onChange={(e) => updateItem(idx, 'person', e.target.value)}
                    placeholder="Person in charge"
                    className="w-full mt-2 p-2.5 rounded-xl text-sm focus:outline-none"
                    style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
                  />
                </div>
              ))}

              <button
                onClick={addItem}
                className="w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
                style={{ background: 'var(--card)', border: '1px solid var(--primary)', color: 'var(--primary)' }}
              >
                <Plus size={18} />
                Add Item
              </button>
            </div>

            {/* Sheet footer */}
            <div className="p-5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
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
                  <><Save size={18} />Save Plan</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}