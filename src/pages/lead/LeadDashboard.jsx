import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Users, Search, CheckCircle2, XCircle, X,
  Clock, BookOpen, ChevronRight, Trash2, AlertCircle
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function LeadDashboard() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const leadGroupSlugs = profile?.groups || [];
  const [allGroups, setAllGroups] = useState([]);
  const [activeSlug, setActiveSlug] = useState(null);
  const [tab, setTab] = useState('requests');

  const [members, setMembers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (activeSlug) {
      loadMembers();
      loadRequests();
    }
  }, [activeSlug]);

  const loadGroups = async () => {
    const { data, error } = await supabase
      .from('groups')
      .select('*')
      .order('name');

    if (error) {
      setError(friendlyError(error));
      return;
    }

    const myGroups = (data || []).filter((g) => leadGroupSlugs.includes(g.slug));
    setAllGroups(myGroups);

    if (myGroups.length > 0) {
      setActiveSlug(myGroups[0].slug);
    } else {
      setLoading(false);
    }
  };

  const loadMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .contains('groups', [activeSlug])
      .order('full_name');

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }
    setMembers(data || []);
  };

  const loadRequests = async () => {
    const { data: reqData, error: reqErr } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (reqErr) {
      console.error('Failed to load requests:', reqErr.message);
      return;
    }

    const group = allGroups.find((g) => g.slug === activeSlug);
    if (!group) {
      setRequests([]);
      return;
    }

    const filtered = (reqData || []).filter((r) => r.group_id === group.id);

    if (filtered.length === 0) {
      setRequests([]);
      return;
    }

    const userIds = filtered.map((r) => r.user_id);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name, username')
      .in('id', userIds);

    const profileMap = {};
    (profilesData || []).forEach((p) => { profileMap[p.id] = p; });

    const merged = filtered.map((r) => ({
      ...r,
      user: profileMap[r.user_id] || null,
      group,
    }));

    setRequests(merged);
  };

  const approveRequest = async (req) => {
    setSaving(true);
    const { error } = await supabase.rpc('approve_join_request', { request_id: req.id });
    setSaving(false);

    if (error) {
      alert(friendlyError(error));
      return;
    }
    await loadMembers();
    await loadRequests();
  };

  const declineRequest = async (req) => {
    if (!confirm(`Decline ${req.user?.full_name}?`)) return;
    setSaving(true);
    const { error } = await supabase
      .from('group_join_requests')
      .update({
        status: 'declined',
        reviewed_at: new Date().toISOString(),
        reviewed_by: profile?.id,
      })
      .eq('id', req.id);
    setSaving(false);
    if (!error) await loadRequests();
  };

  const removeMember = async (userId) => {
    if (!confirm('Remove this member from the group?')) return;
    setSaving(true);

    const target = members.find((m) => m.id === userId);
    if (!target) {
      setSaving(false);
      return;
    }

    const nextGroups = (target.groups || []).filter((g) => g !== activeSlug);

    const { error } = await supabase
      .from('profiles')
      .update({ groups: nextGroups })
      .eq('id', userId);

    setSaving(false);

    if (error) {
      alert(friendlyError(error));
      return;
    }
    await loadMembers();
  };

  const activeGroup = allGroups.find((g) => g.slug === activeSlug);

  const filteredMembers = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (m.full_name || '').toLowerCase().includes(q) ||
      (m.username || '').toLowerCase().includes(q)
    );
  });

  if (allGroups.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
        <AlertCircle size={36} style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm mt-4 text-center" style={{ color: 'var(--text)' }}>
          You don't lead any group yet. Contact your admin.
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Lead Dashboard</h1>
        <div className="w-10" />
      </div>

      {allGroups.length > 1 && (
        <div className="px-5 mb-3 overflow-x-auto no-scrollbar">
          <div className="flex gap-2">
            {allGroups.map((g) => (
              <button
                key={g.id}
                onClick={() => setActiveSlug(g.slug)}
                className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
                style={{
                  background: activeSlug === g.slug ? 'var(--primary)' : 'var(--card)',
                  color: activeSlug === g.slug ? '#ffffff' : 'var(--text-muted)',
                  border: `1px solid ${activeSlug === g.slug ? 'var(--primary)' : 'var(--border)'}`,
                }}
              >
                {g.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Leading"
          title={activeGroup?.name || 'No group'}
          subtitle={`${members.length} member${members.length === 1 ? '' : 's'} • ${requests.length} pending`}
          right={<HeroIcon icon={Users} />}
        />
      </div>

      <div className="px-5 mt-4">
        <button
          onClick={() => navigate('/lead/lesson-upload')}
          className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition"
          style={{ background: 'var(--card)', border: '1px solid var(--primary)40' }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'var(--primary-soft)' }}
          >
            <BookOpen size={20} style={{ color: 'var(--primary)' }} />
          </div>
          <span className="flex-1 text-left text-sm font-medium" style={{ color: 'var(--text)' }}>
            Upload Lesson
          </span>
          <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
        </button>
      </div>

      <div className="px-5 mt-5">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <TabBtn
            active={tab === 'requests'}
            onClick={() => setTab('requests')}
            label={`Requests${requests.length ? ` (${requests.length})` : ''}`}
          />
          <TabBtn
            active={tab === 'members'}
            onClick={() => setTab('members')}
            label={`Members (${members.length})`}
          />
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
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

      {!loading && tab === 'requests' && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {requests.length === 0 ? (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Clock size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No pending requests</p>
            </div>
          ) : (
            requests.map((req) => (
              <div
                key={req.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--primary-soft)' }}
                  >
                    <span className="font-display text-base" style={{ color: 'var(--primary)' }}>
                      {(req.user?.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {req.user?.full_name || 'User'}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      @{req.user?.username || 'user'} • {new Date(req.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {req.note && (
                  <p
                    className="text-xs mt-3 p-3 rounded-xl"
                    style={{ background: 'var(--card-soft)', color: 'var(--text-muted)' }}
                  >
                    "{req.note}"
                  </p>
                )}

                <div className="grid grid-cols-2 gap-2 mt-3">
                  <button
                    onClick={() => declineRequest(req)}
                    disabled={saving}
                    className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                    style={{
                      background: 'var(--danger-soft)',
                      color: 'var(--danger)',
                      border: '1px solid var(--danger)40',
                    }}
                  >
                    <XCircle size={16} />
                    Decline
                  </button>
                  <button
                    onClick={() => approveRequest(req)}
                    disabled={saving}
                    className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 text-white disabled:opacity-50"
                    style={{ background: 'var(--success)' }}
                  >
                    <CheckCircle2 size={16} />
                    Approve
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {!loading && tab === 'members' && (
        <div className="px-5 mt-4 pb-6">
          <div className="relative mb-3">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search members..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>

          {filteredMembers.length === 0 ? (
            <p className="text-sm text-center py-12" style={{ color: 'var(--text-muted)' }}>
              No members yet
            </p>
          ) : (
            <div className="space-y-2">
              {filteredMembers.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl p-4 flex items-center gap-3"
                  style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'var(--card-soft)' }}
                  >
                    <span className="font-display text-base" style={{ color: 'var(--text)' }}>
                      {(m.full_name || 'U').charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {m.full_name || 'Unnamed'}
                    </p>
                    <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                      @{m.username || 'no-username'}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMember(m.id)}
                    disabled={saving}
                    className="w-9 h-9 rounded-full flex items-center justify-center disabled:opacity-50"
                    style={{ background: 'var(--danger-soft)' }}
                  >
                    <Trash2 size={16} style={{ color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}