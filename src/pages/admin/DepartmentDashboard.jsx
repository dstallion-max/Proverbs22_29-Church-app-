import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Music, Camera, Baby, Shield, Sparkles, Heart,
  CheckCircle2, Circle, Plus, Wallet, ClipboardList, Calendar,
  MessageCircle, RefreshCw, Layers, ShieldAlert
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const ICON_MAP = { Users, Music, Camera, Baby, Shield, Sparkles, Heart, Layers };

export default function DepartmentDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [group, setGroup] = useState(null);
  const [memberCount, setMemberCount] = useState(0);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const isAdmin = profile?.role === 'admin';
  const isMember = profile?.groups?.includes(id) || isAdmin;

  useEffect(() => {
    if (id && isMember) loadAll();
    else if (!isMember && profile) setLoading(false);
  }, [id, isMember]);

  const loadAll = async () => {
    setLoading(true);
    setError('');

    const [groupRes, membersRes, tasksRes] = await Promise.all([
      supabase.from('groups').select('*').eq('slug', id).maybeSingle(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).contains('groups', [id]),
      supabase.from('tasks').select('*').eq('department_slug', id).order('completed', { ascending: true }).order('created_at', { ascending: false }).limit(30),
    ]);

    setLoading(false);

    if (groupRes.error) {
      setError(friendlyError(groupRes.error));
      return;
    }

    setGroup(groupRes.data);
    setMemberCount(membersRes.count || 0);
    setTasks(tasksRes.data || []);
  };

  const toggleTask = async (t) => {
    const next = !t.completed;
    const { error } = await supabase.from('tasks').update({ completed: next, completed_at: next ? new Date().toISOString() : null }).eq('id', t.id);
    if (!error) loadAll();
  };

  const addQuickTask = async () => {
    const title = prompt('Task title');
    if (!title || !title.trim()) return;
    setSaving(true);
    await supabase.from('tasks').insert({ title: title.trim(), department_slug: id, created_by: user?.id || null, assigned_to: user?.id || null });
    setSaving(false);
    loadAll();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}><div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }} /></div>;
  }

  if (!isMember) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <ShieldAlert size={48} style={{ color: 'var(--danger)' }} />
        <h2 className="font-display text-xl mt-4 text-center" style={{ color: 'var(--text)' }}>Access Denied</h2>
        <p className="text-sm mt-2 text-center" style={{ color: 'var(--text-muted)' }}>You do not belong to this department. Please request access from a leader.</p>
        <button onClick={() => navigate('/worker/departments')} className="mt-6 px-6 py-3 rounded-xl font-medium text-white" style={{ background: 'var(--primary)' }}>Go Back</button>
      </div>
    );
  }

  const Icon = ICON_MAP[group?.icon] || Users;
  const color = group?.color || 'var(--primary)';
  const doneCount = tasks.filter((t) => t.completed).length;
  const pct = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button onClick={() => navigate('/worker/departments')} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>{group?.name || 'Department'}</h1>
        <button onClick={loadAll} className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard eyebrow="Department" title={group?.name || 'Department'} subtitle={`${memberCount} member${memberCount === 1 ? '' : 's'}`} right={<HeroIcon icon={Icon} />} footer={tasks.length > 0 ? <div className="w-full rounded-full h-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}><div className="h-2 rounded-full" style={{ width: `${pct}%`, background: '#ffffff' }} /></div> : null} />
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Tools</h2>
        <div className="grid grid-cols-2 gap-3">
          <ToolBtn icon={ClipboardList} label="Attendance" color={color} onClick={() => navigate('/worker/attendance')} />
          <ToolBtn icon={Wallet} label="Offering" color="var(--success)" onClick={() => navigate('/worker/offering')} />
          <ToolBtn icon={Calendar} label="Service Plan" color="var(--accent)" onClick={() => navigate('/worker/service-plan')} />
          <ToolBtn icon={MessageCircle} label="Group Chat" color="#a855f7" onClick={() => navigate(`/groups/${id}`)} />
        </div>
      </div>

      <div className="px-5 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Tasks</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{doneCount}/{tasks.length}</span>
        </div>
        {tasks.length === 0 ? (
          <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}><ClipboardList size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} /><p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>No tasks yet</p></div>
        ) : (
          <div className="space-y-2">
            {tasks.map((t) => (
              <div key={t.id} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: t.completed ? 'var(--success-soft)' : 'var(--card)', border: `1px solid ${t.completed ? 'var(--success)' : 'var(--border)'}` }}>
                <button onClick={() => toggleTask(t)} className="shrink-0">{t.completed ? <CheckCircle2 size={20} style={{ color: 'var(--success)' }} /> : <Circle size={20} style={{ color: 'var(--text-muted)' }} />}</button>
                <span className="text-sm flex-1" style={{ color: 'var(--text)', textDecoration: t.completed ? 'line-through' : 'none', opacity: t.completed ? 0.7 : 1 }}>{t.title}</span>
              </div>
            ))}
          </div>
        )}
        {['worker', 'lead', 'admin'].includes(profile?.role) && (
          <button onClick={addQuickTask} disabled={saving} className="w-full mt-3 py-3 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-60" style={{ background: 'var(--card)', border: '1px solid var(--primary)', color: 'var(--primary)' }}>
            <Plus size={18} /> Add Task
          </button>
        )}
      </div>

      <div className="px-5 mt-6 pb-6">
        <button onClick={() => navigate(`/groups/${id}`)} className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition" style={{ background: color }}>
          <MessageCircle size={18} /> Open {group?.name} Group Chat
        </button>
      </div>
    </div>
  );
}

function ToolBtn({ icon: Icon, label, color, onClick }) {
  return (
    <button onClick={onClick} className="rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition text-left" style={{ background: 'var(--card)', border: `1px solid ${color}40` }}>
      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}20` }}><Icon size={20} style={{ color }} /></div>
      <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{label}</span>
    </button>
  );
}