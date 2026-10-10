import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Save, CheckCircle2, Clock } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Attendance() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [groupName, setGroupName] = useState('Adults');
  const [counts, setCounts] = useState({
    adults_male: '',
    adults_female: '',
    teens: '',
    children: '',
    first_timers: '',
  });
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistoryLoading(true);
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .order('service_date', { ascending: false })
      .limit(5);

    setHistoryLoading(false);
    if (error) {
      setError(friendlyError(error));
      return;
    }
    setHistory(data || []);
  };

  const total =
    (parseInt(counts.adults_male) || 0) +
    (parseInt(counts.adults_female) || 0) +
    (parseInt(counts.teens) || 0) +
    (parseInt(counts.children) || 0);

  const handleSave = async () => {
    setError('');

    if (total === 0 && !counts.first_timers) {
      setError('Enter at least one attendance count');
      return;
    }

    setLoading(true);

    const payload = {
      service_date: serviceDate,
      group_name: groupName,
      adults_male: parseInt(counts.adults_male) || 0,
      adults_female: parseInt(counts.adults_female) || 0,
      teens: parseInt(counts.teens) || 0,
      children: parseInt(counts.children) || 0,
      first_timers: parseInt(counts.first_timers) || 0,
      recorded_by: user?.id || null,
    };

    const { error } = await supabase.from('attendance_records').insert(payload);

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setSaved(true);
    setCounts({
      adults_male: '',
      adults_female: '',
      teens: '',
      children: '',
      first_timers: '',
    });
    await loadHistory();
    setTimeout(() => setSaved(false), 2500);
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Attendance</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Total Present"
          title={`${total}`}
          subtitle={`${groupName} group`}
          right={<HeroIcon icon={Users} />}
        />
      </div>

      <div className="px-5 mt-5 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Date
          </label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Group
          </label>
          <select
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {['Adults', 'Teens', 'Super Teens', 'Children', 'Youth'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Counts</h2>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {[
            ['adults_male', 'Adult Males'],
            ['adults_female', 'Adult Females'],
            ['teens', 'Teens'],
            ['children', 'Children'],
            ['first_timers', 'First Timers'],
          ].map(([key, label], idx, arr) => (
            <div
              key={key}
              className="flex items-center gap-3 p-4"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{label}</span>
              <input
                type="number"
                inputMode="numeric"
                value={counts[key]}
                onChange={(e) => setCounts({ ...counts, [key]: e.target.value })}
                placeholder="0"
                className="w-24 p-2.5 rounded-lg text-center text-sm focus:outline-none"
                style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6">
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {saved ? (
            <><CheckCircle2 size={18} />Saved</>
          ) : loading ? (
            'Saving...'
          ) : (
            <><Save size={18} />Save Attendance</>
          )}
        </button>
      </div>

      <div className="px-5 mt-6 pb-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Recent Records
        </h2>

        {historyLoading ? (
          <div className="flex justify-center py-6">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
            />
          </div>
        ) : history.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: 'var(--text-muted)' }}>
            No attendance records yet
          </p>
        ) : (
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.id}
                className="rounded-2xl p-3.5 flex items-center gap-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'var(--primary-soft)' }}
                >
                  <Clock size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {h.group_name}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(h.service_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {h.total || 0}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}