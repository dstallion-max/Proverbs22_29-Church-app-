import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Crown, Users, CheckCircle2, X, Plus,
  ChevronRight, Clock, XCircle, Layers
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const ROLES = [
  { id: 'member', label: 'Member' },
  { id: 'worker', label: 'Worker' },
  { id: 'lead', label: 'Lead' },
  { id: 'admin', label: 'Admin' },
];

export default function Roles() {
  const navigate = useNavigate();
  const { profile: adminProfile } = useAuth();
  const [tab, setTab] = useState('users');

  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [draftRole, setDraftRole] = useState('member');
  const [draftGroups, setDraftGroups] = useState([]);

  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', type: 'department', description: '' });
  const [creatingGroup, setCreatingGroup] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    setError('');

    const { data: usersData, error: usersErr } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name');

    const { data: groupsData, error: groupsErr } = await supabase
      .from('groups')
      .select('*')
      .order('type')
      .order('name');

    const { data: reqData, error: reqErr } = await supabase
      .from('group_join_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });

    if (usersErr || groupsErr || reqErr) {
      setLoading(false);
      setError(friendlyError(usersErr || groupsErr || reqErr));
      return;
    }

    setUsers(usersData || []);
    setGroups(groupsData || []);

    // Merge requests with user + group data
    const userIds = (reqData || []).map((r) => r.user_id);
    const { data: reqProfiles } = await supabase
      .from('profiles')
      .select('id, full_name, username, phone')
      .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000']);

    const profileMap = {};
    (reqProfiles || []).forEach((p) => { profileMap[p.id] = p; });

    const groupMap = {};
    (groupsData || []).forEach((g) => { groupMap[g.id] = g; });

    const mergedRequests = (reqData || []).map((r) => ({
      ...r,
      user: profileMap[r.user_id] || null,
      group: groupMap[r.group_id] || null,
    }));

    setRequests(mergedRequests);
    setLoading(false);
  };

  const openEditor = (u) => {
    setEditing(u);
    setDraftRole(u.role || 'member');
    setDraftGroups(u.groups || []);
  };

  const toggleGroup = (slug) => {
    setDraftGroups((prev) =>
      prev.includes(slug) ? prev.filter((g) => g !== slug) : [...prev, slug]
    );
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({ role: draftRole, groups: draftGroups })
      .eq('id', editing.id);

    setSaving(false);

    if (error) {
      alert(friendlyError(error));
      return;
    }

    setEditing(null);
    await loadAll();
  };

  const approveRequest = async (req) => {
    if (!confirm(`Approve ${req.user?.full_name} to join ${req.group?.name}?`)) return;

    const { error } = await supabase.rpc('approve_join_request', { request_id: req.id });

    if (error) {
      alert(friendlyError(error));
      return;
    }

    await loadAll();
  };

  const declineRequest = async (req) => {
    if (!confirm(`Decline ${req.user?.full_name}'s request?`)) return;

    const { error } = await supabase
      .from('group_join_requests')
      .update({
        status: 'declined',
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminProfile?.id,
      })
      .eq('id', req.id);

    if (error) {
      alert(friendlyError(error));
      return;
    }

    await loadAll();
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim()) return;

    const slug = newGroup.name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    if (!slug) return;

    setCreatingGroup(true);

    const { error } = await supabase.from('groups').insert({
      slug,
      name: newGroup.name.trim(),
      type: newGroup.type,
      description: newGroup.description.trim() || null,
      color: 'var(--primary)',
      icon: 'Users',
    });

    setCreatingGroup(false);

    if (error) {
      alert(friendlyError(error));
      return;
    }

    setNewGroup({ name: '', type: 'department', description: '' });
    setShowNewGroup(false);
    await loadAll();
  };

  const filteredUsers = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (u.full_name || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q) ||
      (u.phone || '').includes(q)
    );
  });

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/admin')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Roles & Groups</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Admin"
          title="Manage Users"
          subtitle={`${users.length} member${users.length === 1 ? '' : 's'} • ${groups.length} group${groups.length === 1 ? '' : 's'}`}
          right={<HeroIcon icon={Crown} />}
        />
      </div>

      <div className="px-5 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <TabBtn active={tab === 'users'} onClick={() => setTab('users')} label="Users" />
          <TabBtn
            active={tab === 'requests'}
            onClick={() => setTab('requests')}
            label={`Requests${requests.length ? ` (${requests.length})` : ''}`}
          />
          <TabBtn active={tab === 'groups'} onClick={() => setTab('groups')} label="Groups" />
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

      {/* USERS TAB */}
      {!loading && tab === 'users' && (
        <>
          <div className="px-5 mt-4">
            <div className="relative">
              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              />
            </div>
          </div>

          <div className="px-5 mt-4 pb-6 space-y-2">
            {filteredUsers.length === 0 && (
              <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>No users found</p>
            )}
            {filteredUsers.map((u) => (
              <button
                key={u.id}
                onClick={() => openEditor(u)}
                className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition text-left"
                style={{
                  background: 'var(--card)',
                  border: `1px solid ${u.id === adminProfile?.id ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--card-soft)' }}
                >
                  <span className="font-display text-base" style={{ color: 'var(--text)' }}>
                    {(u.full_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {u.full_name || 'Unnamed'}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    @{u.username || 'no-username'} • {u.role || 'member'}
                  </p>
                </div>
                <ChevronRight size={18} style={{ color: 'var(--text-muted)' }} />
              </button>
            ))}
          </div>
        </>
      )}

      {/* REQUESTS TAB */}
      {!loading && tab === 'requests' && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {requests.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Clock size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No pending requests</p>
            </div>
          )}

          {requests.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--primary-soft)' }}
                >
                  <span className="font-display text-base" style={{ color: 'var(--primary)' }}>
                    {(r.user?.full_name || 'U').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                    {r.user?.full_name || 'User'}
                  </p>
                  <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>
                    wants to join <strong>{r.group?.name}</strong>
                  </p>
                </div>
              </div>

              {r.note && (
                <p
                  className="text-xs mt-3 p-3 rounded-xl"
                  style={{ background: 'var(--card-soft)', color: 'var(--text-muted)' }}
                >
                  "{r.note}"
                </p>
              )}

              <div className="grid grid-cols-2 gap-2 mt-3">
                <button
                  onClick={() => declineRequest(r)}
                  className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5"
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
                  onClick={() => approveRequest(r)}
                  className="py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-1.5 text-white"
                  style={{ background: 'var(--success)' }}
                >
                  <CheckCircle2 size={16} />
                  Approve
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* GROUPS TAB */}
      {!loading && tab === 'groups' && (
        <>
          <div className="px-5 mt-4 flex items-center justify-between">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
              {groups.length} groups
            </p>
            <button
              onClick={() => setShowNewGroup(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5"
              style={{ background: 'var(--primary)', color: '#ffffff' }}
            >
              <Plus size={12} />
              New Group
            </button>
          </div>

          <div className="px-5 mt-3 pb-6 space-y-3">
            {['ministry', 'department'].map((type) => (
              <div key={type}>
                <p
                  className="text-[11px] uppercase tracking-widest mb-2 mt-2"
                  style={{ color: 'var(--text-dim)' }}
                >
                  {type === 'ministry' ? 'Ministries' : 'Departments'}
                </p>
                <div className="space-y-2">
                  {groups.filter((g) => g.type === type).map((g) => (
                    <div
                      key={g.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${g.color}20` }}
                      >
                        <Layers size={18} style={{ color: g.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                          {g.name}
                        </p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-dim)' }}>
                          {g.slug} {g.description ? '• ' + g.description : ''}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* User edit sheet */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setEditing(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)', maxHeight: '85vh', overflowY: 'auto' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                {editing.full_name || 'User'}
              </h3>
              <button
                onClick={() => !saving && setEditing(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <p className="text-xs mb-5" style={{ color: 'var(--text-muted)' }}>
              @{editing.username || 'no-username'} • {editing.phone || 'no phone'}
            </p>

            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Role
            </p>
            <div className="grid grid-cols-2 gap-2 mb-5">
              {ROLES.map((r) => {
                const active = draftRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => setDraftRole(r.id)}
                    className="p-3 rounded-2xl text-sm font-medium transition"
                    style={{
                      background: active ? 'var(--primary)' : 'var(--card)',
                      color: active ? '#ffffff' : 'var(--text)',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    }}
                  >
                    {r.label}
                  </button>
                );
              })}
            </div>

            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--text-muted)' }}>
              Groups
            </p>

            {['ministry', 'department'].map((type) => (
              <div key={type} className="mb-4">
                <p className="text-[11px] mb-2" style={{ color: 'var(--text-dim)' }}>
                  {type === 'ministry' ? 'Ministry' : 'Departments'}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {groups.filter((g) => g.type === type).map((g) => {
                    const active = draftGroups.includes(g.slug);
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGroup(g.slug)}
                        className="p-3 rounded-2xl text-xs font-medium transition truncate"
                        style={{
                          background: active ? 'var(--primary)' : 'var(--card)',
                          color: active ? '#ffffff' : 'var(--text)',
                          border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                        }}
                      >
                        {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60"
              style={{ background: 'var(--primary)' }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* New group sheet */}
      {showNewGroup && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !creatingGroup && setShowNewGroup(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Create Group</h3>
              <button
                onClick={() => !creatingGroup && setShowNewGroup(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Name
                </label>
                <input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="e.g. Prayer Warriors"
                  className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Type
                </label>
                <select
                  value={newGroup.type}
                  onChange={(e) => setNewGroup({ ...newGroup, type: e.target.value })}
                  className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  <option value="ministry">Ministry</option>
                  <option value="department">Department</option>
                </select>
              </div>

              <div>
                <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                  Description (optional)
                </label>
                <input
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </div>
            </div>

            <button
              onClick={handleCreateGroup}
              disabled={creatingGroup || !newGroup.name.trim()}
              className="w-full mt-4 py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'var(--primary)' }}
            >
              <Plus size={18} />
              {creatingGroup ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function TabBtn({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all truncate"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? '#ffffff' : 'var(--text-muted)',
      }}
    >
      {label}
    </button>
  );
}