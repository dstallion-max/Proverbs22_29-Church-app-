import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Search, Users, Music, Camera, Shield, Sparkles, Heart,
  Star, CheckCircle2, Clock, Plus, Send, AlertCircle, X
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const ICONS = { Users, Music, Camera, Shield, Sparkles, Heart, Star, Baby: Users };

export default function MyGroups() {
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState('mine');
  const [search, setSearch] = useState('');
  const [allGroups, setAllGroups] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showConfirm, setShowConfirm] = useState(null);
  const [sending, setSending] = useState(false);
  const [note, setNote] = useState('');

  const myGroupIds = profile?.groups || [];
  const requestedGroupIds = myRequests.map((r) => r.group_id);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');

    const [groupsRes, reqRes] = await Promise.all([
      supabase.from('groups').select('*').order('type').order('name'),
      supabase
        .from('group_join_requests')
        .select('*')
        .eq('user_id', profile.id)
        .order('requested_at', { ascending: false }),
    ]);

    setLoading(false);

    if (groupsRes.error || reqRes.error) {
      setError(friendlyError(groupsRes.error || reqRes.error));
      return;
    }

    const groupsData = groupsRes.data || [];
    const reqData = reqRes.data || [];

    // Manually attach group data to requests
    const groupMap = {};
    groupsData.forEach((g) => { groupMap[g.id] = g; });

    const mergedRequests = reqData.map((r) => ({
      ...r,
      group: groupMap[r.group_id] || null,
    }));

    setAllGroups(groupsData);
    setMyRequests(mergedRequests);
  };

  const handleRequest = async () => {
    if (!showConfirm) return;
    setSending(true);

    const { error } = await supabase
      .from('group_join_requests')
      .insert({
        user_id: profile.id,
        group_id: showConfirm.id,
        note: note.trim() || null,
      });

    setSending(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    setShowConfirm(null);
    setNote('');
    await loadData();
    await refreshProfile();
  };

  const cancelRequest = async (requestId) => {
    if (!confirm('Cancel this request?')) return;
    await supabase.from('group_join_requests').delete().eq('id', requestId);
    loadData();
  };

  const myGroups = allGroups.filter((g) => myGroupIds.includes(g.slug));

  const availableGroups = allGroups.filter(
    (g) => !myGroupIds.includes(g.slug) && !requestedGroupIds.includes(g.id)
  );

  const searchResults = search
    ? allGroups.filter((g) => g.name.toLowerCase().includes(search.toLowerCase()))
    : [];

  const statusLabel = (status) => {
    if (status === 'approved') return { label: 'Approved', color: 'var(--success)' };
    if (status === 'declined') return { label: 'Declined', color: 'var(--danger)' };
    return { label: 'Pending', color: 'var(--accent)' };
  };

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Groups</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Community"
          title={`${myGroups.length} group${myGroups.length === 1 ? '' : 's'}`}
          subtitle="Request to join a group"
          right={<HeroIcon icon={Users} />}
        />
      </div>

      <div className="px-5 mt-4">
        <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <TabBtn active={tab === 'mine'} onClick={() => setTab('mine')} label="My Groups" />
          <TabBtn active={tab === 'browse'} onClick={() => setTab('browse')} label="Browse" />
          <TabBtn
            active={tab === 'requests'}
            onClick={() => setTab('requests')}
            label={`Requests${myRequests.length ? ` (${myRequests.length})` : ''}`}
          />
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <div
            className="rounded-2xl p-3 flex items-center gap-2"
            style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}
          >
            <AlertCircle size={16} style={{ color: 'var(--danger)' }} />
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-16">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {!loading && tab === 'mine' && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {myGroups.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Users size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>
                You're not in any group yet
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Browse to request to join one
              </p>
            </div>
          )}

          {myGroups.map((g) => {
            const Icon = ICONS[g.icon] || Users;
            return (
              <div
                key={g.id}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'var(--card)', border: `1px solid ${g.color}40` }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${g.color}20` }}
                >
                  <Icon size={22} style={{ color: g.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{g.description}</p>
                </div>
                <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
              </div>
            );
          })}
        </div>
      )}

      {!loading && tab === 'browse' && (
        <div className="px-5 mt-4 pb-6">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--text-muted)' }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search groups..."
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl text-sm focus:outline-none"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
          </div>

          {!search && (
            <div className="space-y-3 mt-5">
              {availableGroups.length === 0 && (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No new groups to join
                </p>
              )}
              {availableGroups.map((g) => (
                <BrowseRow key={g.id} group={g} onRequest={() => setShowConfirm(g)} />
              ))}
            </div>
          )}

          {search && (
            <div className="space-y-3 mt-4">
              {searchResults.length === 0 ? (
                <p className="text-sm text-center py-8" style={{ color: 'var(--text-muted)' }}>
                  No groups found
                </p>
              ) : (
                searchResults.map((g) => {
                  const alreadyIn = myGroupIds.includes(g.slug);
                  const alreadyReq = requestedGroupIds.includes(g.id);
                  const Icon = ICONS[g.icon] || Users;

                  if (alreadyIn) {
                    return (
                      <div
                        key={g.id}
                        className="rounded-2xl p-4 flex items-center gap-3"
                        style={{ background: 'var(--card)', border: `1px solid ${g.color}40` }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: `${g.color}20` }}
                        >
                          <Icon size={22} style={{ color: g.color }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--success)' }}>You're a member</p>
                        </div>
                        <CheckCircle2 size={20} style={{ color: 'var(--success)' }} />
                      </div>
                    );
                  }
                  if (alreadyReq) {
                    return (
                      <div
                        key={g.id}
                        className="rounded-2xl p-4 flex items-center gap-3"
                        style={{
                          background: 'var(--card)',
                          border: '1px solid var(--border)',
                          opacity: 0.7,
                        }}
                      >
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                          style={{ background: 'var(--card-soft)' }}
                        >
                          <Icon size={22} style={{ color: 'var(--text-muted)' }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{g.name}</p>
                          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Request pending</p>
                        </div>
                        <Clock size={18} style={{ color: 'var(--accent)' }} />
                      </div>
                    );
                  }
                  return <BrowseRow key={g.id} group={g} onRequest={() => setShowConfirm(g)} />;
                })
              )}
            </div>
          )}
        </div>
      )}

      {!loading && tab === 'requests' && (
        <div className="px-5 mt-4 pb-6 space-y-3">
          {myRequests.length === 0 && (
            <div
              className="rounded-2xl p-6 text-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Clock size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No requests yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                Browse groups and request to join
              </p>
            </div>
          )}

          {myRequests.map((r) => {
            const s = statusLabel(r.status);
            const Icon = ICONS[r.group?.icon] || Users;
            return (
              <div
                key={r.id}
                className="rounded-2xl p-4"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: 'var(--card-soft)' }}
                  >
                    <Icon size={20} style={{ color: 'var(--primary)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                      {r.group?.name || 'Unknown group'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      Requested {new Date(r.requested_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded"
                    style={{ background: `${s.color}20`, color: s.color }}
                  >
                    {s.label}
                  </span>
                </div>

                {r.status === 'pending' && (
                  <button
                    onClick={() => cancelRequest(r.id)}
                    className="w-full mt-3 py-2 rounded-xl text-xs font-medium"
                    style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !sending && setShowConfirm(null)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Request to join {showConfirm.name}?
              </h3>
              <button
                onClick={() => !sending && setShowConfirm(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              The group leader will review your request.
            </p>

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional: say why you want to join"
              rows={3}
              className="w-full p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
              style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />

            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowConfirm(null)}
                disabled={sending}
                className="flex-1 py-3.5 rounded-2xl font-medium disabled:opacity-60"
                style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                disabled={sending}
                className="flex-1 py-3.5 rounded-2xl font-medium flex items-center justify-center gap-2 text-white disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                <Send size={16} />
                {sending ? 'Sending...' : 'Send Request'}
              </button>
            </div>
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

function BrowseRow({ group, onRequest }) {
  const Icon = ICONS[group.icon] || Users;
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
    >
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${group.color}20` }}
      >
        <Icon size={22} style={{ color: group.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: 'var(--text)' }}>{group.name}</p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{group.description}</p>
      </div>
      <button
        onClick={onRequest}
        className="px-3 py-2 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1"
        style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
      >
        <Plus size={12} />
        Request
      </button>
    </div>
  );
}