import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Hash, Send, UserPlus, Paperclip, Users, Info, Trash2, X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

export default function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [sending, setSending] = useState(false);

  const bottomRef = useRef(null);

  useEffect(() => {
    if (id) {
      loadGroup();
      loadMessages();
      subscribeToMessages();
    }

    return () => {
      const channel = supabase.channel(`group-${id}`);
      channel.unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadGroup = async () => {
    const { data } = await supabase
      .from('groups')
      .select('*')
      .eq('slug', id)
      .maybeSingle();

    if (data) setGroup(data);
  };

  const loadMessages = async () => {
    setLoading(true);
    setError('');

    const { data, error } = await supabase
      .from('group_messages')
      .select('*')
      .eq('group_slug', id)
      .order('created_at', { ascending: true })
      .limit(100);

    setLoading(false);

    if (error) {
      setError(friendlyError(error));
      return;
    }

    // Fetch author profiles
    const userIds = [...new Set((data || []).map((m) => m.user_id))];
    let profileMap = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      (profiles || []).forEach((p) => { profileMap[p.id] = p; });
    }

    setMessages(
      (data || []).map((m) => ({
        ...m,
        author: profileMap[m.user_id] || null,
        isMe: m.user_id === user?.id,
      }))
    );
  };

  const subscribeToMessages = () => {
    const channel = supabase
      .channel(`group-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_slug=eq.${id}`,
        },
        async (payload) => {
          // Skip if it's our own message (we already added it)
          if (payload.new.user_id === user?.id) return;

          // Fetch author
          const { data: author } = await supabase
            .from('profiles')
            .select('id, full_name, username')
            .eq('id', payload.new.user_id)
            .maybeSingle();

          setMessages((prev) => [
            ...prev,
            { ...payload.new, author, isMe: false },
          ]);
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!text.trim() || !user) return;

    const body = text.trim();
    setText('');
    setSending(true);

    const optimistic = {
      id: `temp-${Date.now()}`,
      group_slug: id,
      user_id: user.id,
      body,
      created_at: new Date().toISOString(),
      author: {
        id: profile?.id,
        full_name: profile?.full_name,
        username: profile?.username,
      },
      isMe: true,
    };

    setMessages((prev) => [...prev, optimistic]);

    const { error } = await supabase.from('group_messages').insert({
      group_slug: id,
      user_id: user.id,
      body,
    });

    setSending(false);

    if (error) {
      setError(friendlyError(error));
      // Remove optimistic message
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      return;
    }
  };

  const deleteMessage = async (messageId) => {
    if (!confirm('Delete this message?')) return;
    const { error } = await supabase.from('group_messages').delete().eq('id', messageId);
    if (error) {
      alert(friendlyError(error));
      return;
    }
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
  };

  const formatTime = (iso) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return d.toLocaleTimeString('en-NG', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
  };

  const color = group?.color || 'var(--primary)';
  const initials = (name) => (name || 'U').split(' ').map((n) => n.charAt(0)).slice(0, 2).join('').toUpperCase();

  return (
    <div className="anim-fade-up min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <div
        className="flex items-center gap-3 px-5 pt-8 pb-4 safe-top"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <button
          onClick={() => navigate('/worker/groups')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition shrink-0"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>

        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${color}20` }}
        >
          <Hash size={20} style={{ color }} />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text)' }}>
            {group?.name || 'Group'}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
            {messages.length} message{messages.length === 1 ? '' : 's'}
          </p>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--card)' }}
        >
          <Info size={16} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      {/* Info banner */}
      {showInfo && (
        <div
          className="px-5 py-3 anim-fade-up"
          style={{ background: 'var(--card-soft)', borderBottom: '1px solid var(--border)' }}
        >
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            This is the {group?.name} group chat. Only group members can post.
            Messages auto-delete after 30 days.
          </p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-4 space-y-3">
        {loading && (
          <div className="flex justify-center py-12">
            <div
              className="w-10 h-10 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
            />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <Users size={24} style={{ color: 'var(--text-muted)' }} />
            </div>
            <p className="text-sm mt-4" style={{ color: 'var(--text-muted)' }}>
              No messages yet
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
              Say hello to your group
            </p>
          </div>
        )}

        {!loading && messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2 ${m.isMe ? 'justify-end' : 'justify-start'}`}
          >
            {!m.isMe && (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1"
                style={{ background: `${color}20` }}
              >
                <span className="text-[10px] font-bold" style={{ color }}>
                  {initials(m.author?.full_name)}
                </span>
              </div>
            )}

            <div className={`max-w-[78%] ${m.isMe ? 'items-end' : 'items-start'} flex flex-col`}>
              {!m.isMe && (
                <p
                  className="text-[10px] font-semibold uppercase tracking-wide mb-1 ml-1"
                  style={{ color }}
                >
                  {m.author?.full_name || 'Member'}
                </p>
              )}

              <div className="group relative">
                <div
                  className="rounded-2xl px-4 py-3"
                  style={{
                    background: m.isMe ? 'var(--primary)' : 'var(--card)',
                    border: m.isMe ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <p
                    className="text-sm whitespace-pre-wrap break-words"
                    style={{ color: m.isMe ? '#ffffff' : 'var(--text)' }}
                  >
                    {m.body}
                  </p>
                </div>

                {m.isMe && (
                  <button
                    onClick={() => deleteMessage(m.id)}
                    className="absolute -left-8 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center hidden group-hover:flex"
                    style={{ background: 'var(--danger-soft)' }}
                  >
                    <Trash2 size={12} style={{ color: 'var(--danger)' }} />
                  </button>
                )}
              </div>

              <p
                className="text-[10px] mt-1 mx-1"
                style={{ color: 'var(--text-dim)' }}
              >
                {formatTime(m.created_at)}
              </p>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="px-5 pb-2">
          <p className="text-xs text-center" style={{ color: 'var(--danger)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Composer */}
      <div
        className="px-5 py-3 safe-bottom"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--bg)' }}
      >
        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--card)' }}
          >
            <Paperclip size={18} style={{ color: 'var(--text-muted)' }} />
          </button>

          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Type a message..."
            className="flex-1 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />

          <button
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 active:scale-95 transition disabled:opacity-50"
            style={{ background: 'var(--primary)' }}
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}