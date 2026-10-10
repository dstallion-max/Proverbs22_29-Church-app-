import { useState, useEffect } from 'react';
import {
  Trophy, Zap, CheckCircle2, XCircle, Flame, Crown,
  Clock, CalendarX, Users, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { getUserGroup } from '../../utils/groups';
import { friendlyError } from '../../utils/errors';

export default function Game() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState('quiz');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sermon, setSermon] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [existingScore, setExistingScore] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [streak, setStreak] = useState(0);

  const groupId = getUserGroup(profile);

  useEffect(() => {
    if (profile) loadGame();
  }, [profile]);

  const loadGame = async () => {
    setLoading(true);
    setError('');

    // 1. Latest published sermon for the group
    const { data: sermonData, error: sermonErr } = await supabase
      .from('sermons')
      .select('*')
      .eq('group_id', groupId)
      .eq('status', 'published')
      .order('taught_on', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sermonErr) {
      setError(friendlyError(sermonErr));
      setLoading(false);
      return;
    }

    if (!sermonData) {
      setSermon(null);
      setQuestions([]);
      setLoading(false);
      return;
    }

    // 2. Load questions
    const { data: questionsData, error: qErr } = await supabase
      .from('sermon_questions')
      .select('*')
      .eq('sermon_id', sermonData.id)
      .order('created_at', { ascending: true });

    if (qErr) {
      setError(friendlyError(qErr));
      setLoading(false);
      return;
    }

    setSermon(sermonData);
    setQuestions(questionsData || []);

    // 3. Existing score for this user + sermon
    if (user) {
      const { data: scoreData } = await supabase
        .from('game_scores')
        .select('*')
        .eq('user_id', user.id)
        .eq('sermon_id', sermonData.id)
        .maybeSingle();

      setExistingScore(scoreData || null);
    }

    // 4. Leaderboard
    const { data: leaders } = await supabase
      .from('game_scores')
      .select('user_id, score, played_on')
      .eq('group_id', groupId)
      .order('score', { ascending: false })
      .limit(5);

    if (leaders && leaders.length > 0) {
      // Fetch profiles for those users
      const userIds = leaders.map((l) => l.user_id);
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name, username')
        .in('id', userIds);

      const profileMap = {};
      (profilesData || []).forEach((p) => { profileMap[p.id] = p; });

      setLeaderboard(
        leaders.map((l) => ({
          id: l.user_id,
          name: profileMap[l.user_id]?.full_name || 'Anonymous',
          score: l.score,
          played_on: l.played_on,
          isYou: l.user_id === user?.id,
        }))
      );
    } else {
      setLeaderboard([]);
    }

    setLoading(false);
  };

  const handleSaveScore = async (score, correctCount, answeredCount) => {
    if (!user || !sermon) return;

    const payload = {
      user_id: user.id,
      sermon_id: sermon.id,
      group_id: groupId,
      score,
      answered_count: answeredCount,
      correct_count: correctCount,
      played_on: new Date().toISOString().split('T')[0],
    };

    const { error } = await supabase
      .from('game_scores')
      .upsert(payload, { onConflict: 'user_id,sermon_id' });

    if (error) {
      setError(friendlyError(error));
      return;
    }

    // Reload leaderboard
    await loadGame();
  };

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="px-5 pt-8 pb-4 safe-top">
        <h1 className="font-display text-3xl" style={{ color: 'var(--text)' }}>Game</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {groupId.charAt(0).toUpperCase() + groupId.slice(1).replace('_', ' ')} • Grow in the Word
        </p>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--border)', borderTopColor: 'var(--primary)' }}
          />
        </div>
      )}

      {!loading && error && (
        <div className="px-5">
          <div
            className="rounded-2xl p-4"
            style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)' }}
          >
            <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="px-5">
            <StatCard streak={streak} existingScore={existingScore} />
          </div>

          <div className="px-5 mt-4">
            <Tabs active={tab} onChange={setTab} />
          </div>

          <div className="px-5 mt-4 pb-8">
            {tab === 'quiz' && (
              <QuizTab
                sermon={sermon}
                questions={questions}
                existingScore={existingScore}
                onSave={handleSaveScore}
                onRefresh={loadGame}
              />
            )}
            {tab === 'leaderboard' && (
              <LeaderboardTab leaderboard={leaderboard} />
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================
// STAT CARD
// ============================================
function StatCard({ existingScore }) {
  const pts = existingScore?.score || 0;

  return (
    <div
      className="relative rounded-3xl p-5 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--primary) 0%, #1d4ed8 100%)',
        boxShadow: '0 8px 32px rgba(37, 99, 235, 0.35)'
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
            Weekly Bible Challenge
          </p>
          <p className="font-display text-4xl text-white mt-2">{pts} pts</p>
          <p className="text-xs text-white/70 mt-1">
            {existingScore ? 'Score this week' : 'Not yet played'}
          </p>
        </div>
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}
        >
          <Trophy size={26} className="text-white" strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// ============================================
// TABS
// ============================================
function Tabs({ active, onChange }) {
  const items = [
    { id: 'quiz', label: 'Quiz' },
    { id: 'leaderboard', label: 'Leaderboard' }
  ];

  return (
    <div className="flex rounded-2xl p-1" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {items.map((item) => {
        const isActive = active === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-all"
            style={{
              background: isActive ? 'var(--primary)' : 'transparent',
              color: isActive ? '#ffffff' : 'var(--text-muted)'
            }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// QUIZ
// ============================================
function QuizTab({ sermon, questions, existingScore, onSave, onRefresh }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [finished, setFinished] = useState(false)

  // --- No lesson this week ---
  if (!sermon) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--card-soft)' }}
        >
          <CalendarX size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <h3 className="font-display text-xl mt-4" style={{ color: 'var(--text)' }}>
          No lesson this week
        </h3>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Your teacher hasn't uploaded a quiz yet. Check back soon.
        </p>
      </div>
    )
  }

  // --- No questions yet ---
  if (!questions || questions.length === 0) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--card-soft)' }}
        >
          <Clock size={28} style={{ color: 'var(--text-muted)' }} />
        </div>
        <h3 className="font-display text-xl mt-4" style={{ color: 'var(--text)' }}>
          Quiz isn't ready yet
        </h3>
        <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
          Your teacher hasn't uploaded questions for this week. Check back soon.
        </p>
      </div>
    )
  }

  // --- Already played ---
  if (existingScore && !finished) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Trophy size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h3 className="font-display text-2xl mt-4" style={{ color: 'var(--text)' }}>
          You already played
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          You scored {existingScore.score} points
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
          Come back next week for new questions
        </p>
        <button
          onClick={onRefresh}
          className="mt-5 px-5 py-3 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 mx-auto"
          style={{ background: 'var(--card-soft)', color: 'var(--text)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>
    )
  }

  const question = questions[current]

  const handleAnswer = (idx) => {
    if (answered) return
    setSelected(idx)
    setAnswered(true)
    const isCorrect = idx === question.answer_index
    if (isCorrect) {
      setScore((s) => s + (question.points || 10))
      setCorrectCount((c) => c + 1)
    }
    setAnsweredCount((c) => c + 1)
  }

  const next = async () => {
    if (current + 1 < questions.length) {
      setCurrent(current + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      // Save score
      await onSave(score, correctCount, answeredCount)
      setFinished(true)
    }
  }

  if (finished) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ background: 'var(--accent-soft)' }}
        >
          <Trophy size={28} style={{ color: 'var(--accent)' }} />
        </div>
        <h3 className="font-display text-2xl mt-4" style={{ color: 'var(--text)' }}>
          Well done
        </h3>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          You scored {score} points today
        </p>
        <p className="text-xs mt-3" style={{ color: 'var(--text-dim)' }}>
          Come back tomorrow for new questions
        </p>
      </div>
    )
  }

  return (
    <div>
      <div
        className="rounded-2xl p-4 mb-3"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <h3 className="font-display text-lg" style={{ color: 'var(--text)' }}>
          {sermon.title}
        </h3>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          {sermon.teacher} • {sermon.scripture || ''}
        </p>
      </div>

      <div
        className="rounded-3xl p-5"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            Question {current + 1} of {questions.length}
          </span>
          <div className="flex items-center gap-1" style={{ color: 'var(--accent)' }}>
            <Zap size={14} fill="currentColor" />
            <span className="text-xs font-semibold">+{question.points || 10}</span>
          </div>
        </div>

        <h3 className="font-display text-xl mb-5 leading-snug" style={{ color: 'var(--text)' }}>
          {question.question}
        </h3>

        <div className="space-y-2.5">
          {question.options.map((opt, idx) => {
            const isCorrect = idx === question.answer_index
            const isPicked = idx === selected

            let bg = 'var(--card-soft)'
            let border = 'var(--border)'
            let color = 'var(--text)'

            if (answered && isCorrect) {
              bg = 'var(--success-soft)'
              border = 'var(--success)'
              color = 'var(--success)'
            } else if (answered && isPicked && !isCorrect) {
              bg = 'var(--danger-soft)'
              border = 'var(--danger)'
              color = 'var(--danger)'
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className="w-full text-left p-4 rounded-2xl flex items-center justify-between transition-all active:scale-[0.99]"
                style={{ background: bg, border: `1px solid ${border}` }}
              >
                <span className="text-sm font-medium" style={{ color }}>{opt}</span>
                {answered && isCorrect && <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />}
                {answered && isPicked && !isCorrect && <XCircle size={18} style={{ color: 'var(--danger)' }} />}
              </button>
            )
          })}
        </div>

        {answered && (
          <button
            onClick={next}
            className="mt-5 w-full py-3.5 rounded-2xl font-medium text-white active:scale-[0.98] transition"
            style={{ background: 'var(--primary)' }}
          >
            {current + 1 < questions.length ? 'Next Question' : 'Finish'}
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// LEADERBOARD
// ============================================
function LeaderboardTab({ leaderboard }) {
  if (!leaderboard || leaderboard.length === 0) {
    return (
      <div
        className="rounded-3xl p-6 text-center"
        style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
      >
        <Users size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
        <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No scores yet</p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          Be the first to play this week's quiz
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {leaderboard.map((player, idx) => {
        const isTop = idx === 0
        const isYou = player.isYou

        return (
          <div
            key={player.id}
            className="flex items-center gap-3 p-4 rounded-2xl"
            style={{
              background: isYou ? 'var(--primary)' : 'var(--card)',
              border: `1px solid ${isYou ? 'var(--primary)' : 'var(--border)'}`
            }}
          >
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: isTop ? 'var(--accent-soft)' : isYou ? 'rgba(255,255,255,0.2)' : 'var(--card-soft)'
              }}
            >
              {isTop ? (
                <Crown size={18} style={{ color: 'var(--accent)' }} />
              ) : (
                <span className="text-sm font-bold" style={{ color: isYou ? '#ffffff' : 'var(--text)' }}>
                  {idx + 1}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: isYou ? '#ffffff' : 'var(--text)' }}>
                {player.name}
              </p>
              <div
                className="flex items-center gap-1 text-xs mt-0.5"
                style={{ color: isYou ? 'rgba(255,255,255,0.7)' : 'var(--text-dim)' }}
              >
                <Flame size={12} />
                <span>Played {player.played_on}</span>
              </div>
            </div>

            <p className="font-display text-lg" style={{ color: isYou ? '#ffffff' : 'var(--primary)' }}>
              {player.score}
            </p>
          </div>
        )
      })}

      <div
        className="rounded-2xl p-4 mt-4 text-center"
        style={{ background: 'var(--accent-soft)', border: '1px solid var(--accent)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>
          Top scorer this week wins 500 Naira
        </p>
      </div>
    </div>
  )
}