import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wallet, FileDown, CheckCircle2, ArrowLeft, Users, Save } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const denominations = [
  { key: 'denom_1000', value: 1000 },
  { key: 'denom_500', value: 500 },
  { key: 'denom_200', value: 200 },
  { key: 'denom_100', value: 100 },
  { key: 'denom_50', value: 50 },
  { key: 'denom_20', value: 20 },
  { key: 'denom_10', value: 10 },
];

const offeringTypes = [
  'Sunday Offering', 'Tithe', 'Building Fund',
  'Missions', 'Thanksgiving', 'Special Seed',
];

export default function Offering() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [serviceDate, setServiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [offeringType, setOfferingType] = useState('Sunday Offering');
  const [counts, setCounts] = useState({});
  const [attendance, setAttendance] = useState({
    adults_male: '', adults_female: '', teens: '', children: '', first_timers: '',
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
      .from('offering_records')
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

  const total = denominations.reduce((sum, d) => {
    const qty = parseInt(counts[d.key]) || 0;
    return sum + d.value * qty;
  }, 0);

  const totalAttendance = Object.values(attendance).reduce(
    (sum, v) => sum + (parseInt(v) || 0), 0
  );

  const fmt = (n) => `N ${n.toLocaleString()}`;

  const handleSave = async () => {
    setError('');

    if (total === 0 && totalAttendance === 0) {
      setError('Enter at least one amount or attendance count');
      return;
    }

    setLoading(true);

    // Save offering record
    const offeringPayload = {
      service_date: serviceDate,
      offering_type: offeringType,
      denom_1000: parseInt(counts.denom_1000) || 0,
      denom_500: parseInt(counts.denom_500) || 0,
      denom_200: parseInt(counts.denom_200) || 0,
      denom_100: parseInt(counts.denom_100) || 0,
      denom_50: parseInt(counts.denom_50) || 0,
      denom_20: parseInt(counts.denom_20) || 0,
      denom_10: parseInt(counts.denom_10) || 0,
      submitted: true,
      recorded_by: user?.id || null,
    };

    const { error: offErr } = await supabase
      .from('offering_records')
      .insert(offeringPayload);

    if (offErr) {
      setLoading(false);
      setError(friendlyError(offErr));
      return;
    }

    // Save attendance (only if any value entered)
    if (totalAttendance > 0) {
      const attendancePayload = {
        service_date: serviceDate,
        group_name: 'Adults',
        adults_male: parseInt(attendance.adults_male) || 0,
        adults_female: parseInt(attendance.adults_female) || 0,
        teens: parseInt(attendance.teens) || 0,
        children: parseInt(attendance.children) || 0,
        first_timers: parseInt(attendance.first_timers) || 0,
        recorded_by: user?.id || null,
      };

      const { error: attErr } = await supabase
        .from('attendance_records')
        .insert(attendancePayload);

      if (attErr) {
        setLoading(false);
        setError(friendlyError(attErr));
        return;
      }
    }

    setLoading(false);
    setSaved(true);
    setCounts({});
    setAttendance({ adults_male: '', adults_female: '', teens: '', children: '', first_timers: '' });
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Offering</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Today's Collection"
          title={fmt(total)}
          subtitle={offeringType}
          right={<HeroIcon icon={Wallet} />}
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
            Type
          </label>
          <select
            value={offeringType}
            onChange={(e) => setOfferingType(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {offeringTypes.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Denomination Count
        </h2>

        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          {denominations.map((d, idx) => (
            <div
              key={d.key}
              className="flex items-center gap-3 p-3"
              style={{
                borderBottom: idx < denominations.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <span className="w-20 text-sm font-semibold" style={{ color: 'var(--text)' }}>
                {fmt(d.value)}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-dim)' }}>x</span>
              <input
                type="number"
                inputMode="numeric"
                value={counts[d.key] || ''}
                onChange={(e) => setCounts({ ...counts, [d.key]: e.target.value })}
                placeholder="0"
                className="flex-1 p-2 rounded-lg text-center text-sm focus:outline-none"
                style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
              <span className="w-20 text-right text-sm font-medium" style={{ color: 'var(--primary)' }}>
                {fmt(d.value * (parseInt(counts[d.key]) || 0))}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Users size={18} style={{ color: 'var(--primary)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Attendance</h2>
        </div>

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
              className="flex items-center gap-3 p-3"
              style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <span className="flex-1 text-sm" style={{ color: 'var(--text)' }}>{label}</span>
              <input
                type="number"
                inputMode="numeric"
                value={attendance[key]}
                onChange={(e) => setAttendance({ ...attendance, [key]: e.target.value })}
                placeholder="0"
                className="w-20 p-2 rounded-lg text-center text-sm focus:outline-none"
                style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          ))}
        </div>

        <div
          className="mt-3 p-3 rounded-xl flex items-center justify-between"
          style={{ background: 'var(--card-soft)' }}
        >
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Total Attendance</span>
          <span className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
            {totalAttendance} people
          </span>
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6 space-y-2">
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
            <><Save size={18} />Save Offering</>
          )}
        </button>
      </div>

      {/* History */}
      <div className="px-5 mt-6 pb-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>
          Recent Submissions
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
            No submissions yet
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
                  <Wallet size={16} style={{ color: 'var(--primary)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {h.offering_type}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(h.service_date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
                <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                  {fmt(h.total || 0)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}