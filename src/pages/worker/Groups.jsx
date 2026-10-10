import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Hash, ChevronRight, Users, X } from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function Groups() {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [groups, setGroups] = useState([]);
  const [lastMessages, setLastMessages] = useState({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showJoin, setShowJoin] = useState(false);
  const [username, setUsername] = useState('');

  const mySlugs = profile?.groups || [];

  useEffect(() => {
    if (profile) loadGroups();
  }, [profile]);

  const loadGroups = async () => {
    setLoading(true);
    setError('');

    // Get groups the user is a member of
    const { data: groupData, error: groupErr } = await supabase
      .from('groups')
      .select('*')
      .in('slug', mySlugs.length ? mySlugs : ['__none__'])
      .order('name');

    if (groupErr) {
      setLoading(false);
      setError(friendlyError(groupErr));
      return;
    }

    // Get last message per group
    const lastMessagesMap = {};
    for (const g of groupData || []) {
      const { data: msgs } = await supabase
        .from('group_messages')
        .select('body, created_at')
        .eq('group_slug', g.slug)
        .order('created_at', { ascending: false })
        .limit(1);

      if (msgs && msgs.length > 0) {
        lastMessagesMap[g.slug] = msgs[0];
      }
    }

    setGroups(groupData || []);
    setLastMessages(lastMessagesMap);
    setLoading(false);
  };

  const filtered = groups.filter((g) =>
    g.name.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'now';
    if (mins < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>My Groups</h1>
        <button
          onClick={() => setShowJoin(true)}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={20} className="text-white" />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Groups"
          title={`${groups.length} group${groups.length === 1 ? '' : 's'}`}
          subtitle="Chat with your ministry and departments"
          right={<HeroIcon icon={Users} />}
        />
      </div>

      <div className="px-5 mt-5">
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

      {!loading && filtered.length === 0 && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Users size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>
              {search ? 'No matching groups' : 'You are not in any group yet'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Request to join a group from My Groups page
            </p>
            <button
              onClick={() => navigate('/my-groups')}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-medium"
              style={{ background: 'var(--primary)', color: '#ffffff' }}
            >
              Browse Groups
            </button>
          </div>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="px-5 mt-4 pb-6 space-y-2">
          {filtered.map((g) => {
            const last = lastMessages[g.slug];
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/worker/groups/${g.slug}`)}
                className="w-full rounded-2xl p-4 flex items-center gap-3 active:scale-[0.98] transition text-left"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${g.color}20` }}
                >
                  <Hash size={20} style={{ color: g.color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
                    {g.name}
                  </p>
                  <p
                    className="text-xs mt-0.5 truncate"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {last ? last.body : 'No messages yet'}
                  </p>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-1">
                  {last && (
                    <span className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
                      {formatTime(last.created_at)}
                    </span>
                  )}
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }} />
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Join modal */}
      {showJoin && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => setShowJoin(false)}
          />
          <div
            className="relative w-full max-w-md rounded-t-3xl p-5 safe-bottom anim-slide-up"
            style={{ background: 'var(--bg-soft)' }}
          >
            <div className="w-12 h-1 rounded-full mx-auto mb-4" style={{ background: 'var(--text-dim)' }} />

            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                Add to a Group
              </h3>
              <button
                onClick={() => setShowJoin(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'var(--card)' }}
              >
                <X size={16} style={{ color: 'var(--text)' }} />
              </button>
            </div>

            <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
              Group leaders can add members directly. As a member, request to join from the Browse page.
            </p>

            <button
              onClick={() => {
                setShowJoin(false);
                navigate('/my-groups');
              }}
              className="w-full py-4 rounded-2xl font-medium text-white active:scale-[0.98] transition"
              style={{ background: 'var(--primary)' }}
            >
              Browse Groups
            </button>
          </div>
        </div>
      )}
    </div>
  );
}