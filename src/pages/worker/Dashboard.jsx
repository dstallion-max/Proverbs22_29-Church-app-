import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, Users, Calendar, ClipboardList, TrendingUp, Bell,
  ArrowLeft, MessageCircle, Target, Layers, RefreshCw
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const myGroups = profile?.groups || [];
  const isAdmin = profile?.role === 'admin';
  const isUsher = myGroups.includes('ushers');

  const quickActions = [
    { icon: Layers, title: 'Departments', color: 'var(--primary)', to: '/worker/departments' },
    { icon: MessageCircle, title: 'Groups', color: '#a855f7', to: '/worker/groups' },
    { icon: Target, title: 'Projects', color: 'var(--success)', to: '/worker/projects' },
    { icon: Calendar, title: 'Service Plan', color: 'var(--accent)', to: '/worker/service-plan' },
    { icon: ClipboardList, title: 'My Tasks', color: '#a855f7', to: '/worker/tasks' },
  ];

  if (isUsher || isAdmin) {
    quickActions.push({ icon: Wallet, title: 'Offering', color: 'var(--primary)', to: '/worker/offering' });
    quickActions.push({ icon: ClipboardList, title: 'Attendance', color: 'var(--success)', to: '/worker/attendance' });
  }

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_church_stats');
    setLoading(false);
    if (error) setError(friendlyError(error));
    else setStats(data || {});
  };

  const firstName = (profile?.full_name || 'Worker').split(' ')[0];
  const fmtMoney = (n) => `N ${Number(n || 0).toLocaleString()}`;
  const dateLabel = new Date().toLocaleDateString('en-NG', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button onClick={() => navigate('/profile')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Worker Dashboard</h1>
        <button onClick={loadStats} disabled={loading} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard eyebrow="Worker Dashboard" title={`Welcome, ${firstName}`} subtitle={dateLabel} right={<HeroIcon icon={Users} />} />
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, idx) => (
            <button key={idx} onClick={() => navigate(action.to)} className="rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition text-left" style={{ background: 'var(--card)', border: `1px solid ${action.color}40` }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${action.color}15` }}>
                <action.icon size={20} style={{ color: action.color }} />
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      {!loading && stats && (isUsher || isAdmin) && (
        <div className="px-5 mt-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Today's Summary</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
            {[
              { icon: Wallet, label: 'Offering (Month)', value: fmtMoney(stats.offering_this_month) },
              { icon: Users, label: 'This Sunday', value: `${stats.attendance_this_sunday} people` },
              { icon: TrendingUp, label: 'First Timers (Month)', value: `${stats.first_timers_this_month} people` },
            ].map((row, idx, arr) => (
              <div key={idx} className="flex items-center gap-3 p-4" style={{ borderBottom: idx < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <row.icon size={18} style={{ color: 'var(--primary)' }} />
                <span className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
                <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-6 mb-6">
        <button onClick={() => navigate('/admin/notifications')} className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition text-white" style={{ background: 'var(--primary)', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)' }}>
          <Bell size={18} /> Notify Group
        </button>
      </div>
    </div>
  );
}