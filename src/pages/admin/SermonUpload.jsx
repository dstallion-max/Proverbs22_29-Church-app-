import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Plus, Trash2, Calendar, Sun, Moon,
  CheckCircle2, Upload, ArrowLeft, HelpCircle, Sparkles
} from 'lucide-react';
import HeroCard, { HeroIcon } from '../../components/common/HeroCard';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { friendlyError } from '../../utils/errors';

const GROUP_OPTIONS = [
  { id: 'teens', label: 'Teens' },
  { id: 'super_teens', label: 'Super Teens' },
  { id: 'adults', label: 'Adults' },
];

const emptyQuestion = () => ({
  question: '',
  options: ['', '', '', ''],
  answer_index: 0,
});

export default function SermonUpload() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [groupId, setGroupId] = useState('adults');
  const [title, setTitle] = useState('');
  const [teacher, setTeacher] = useState(profile?.full_name || '');
  const [scripture, setScripture] = useState('');
  const [startDate, setStartDate] = useState('');
  const [status, setStatus] = useState('published');

  const [points, setPoints] = useState([
    { day: 1, session: 'Morning', title: '', body: '', scripture: '' },
  ]);

  const [questions, setQuestions] = useState([emptyQuestion()]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [published, setPublished] = useState(false);

  // Points helpers
  const addPoint = () => {
    const last = points[points.length - 1];
    const sessions = ['Morning', 'Afternoon', 'Night'];
    const idx = sessions.indexOf(last.session);
    const nextSession = sessions[(idx + 1) % sessions.length];
    const nextDay = idx === 2 ? last.day + 1 : last.day;
    setPoints([
      ...points,
      { day: nextDay, session: nextSession, title: '', body: '', scripture: '' },
    ]);
  };

  const updatePoint = (i, field, value) =>
    setPoints(points.map((p, idx) => (idx === i ? { ...p, [field]: value } : p)));

  const removePoint = (i) => setPoints(points.filter((_, idx) => idx !== i));

  // Question helpers
  const addQuestion = () => setQuestions([...questions, emptyQuestion()]);

  const updateQuestion = (i, field, value) =>
    setQuestions(questions.map((q, idx) => (idx === i ? { ...q, [field]: value } : q)));

  const updateOption = (qi, oi, value) =>
    setQuestions(
      questions.map((q, idx) =>
        idx === qi
          ? { ...q, options: q.options.map((o, j) => (j === oi ? value : o)) }
          : q
      )
    );

  const removeQuestion = (i) => setQuestions(questions.filter((_, idx) => idx !== i));

  const inputStyle = {
    background: 'var(--card-soft)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  };

  const handlePublish = async () => {
    setError('');

    if (!title.trim()) return setError('Please enter a sermon title');
    if (!teacher.trim()) return setError('Please enter the teacher name');
    if (!startDate) return setError('Please select a start date');

    const validPoints = points.filter((p) => p.title.trim() && p.body.trim());
    if (validPoints.length === 0) return setError('Add at least one sermon point');

    const validQuestions = questions.filter(
      (q) => q.question.trim() && q.options.every((o) => o.trim())
    );

    setLoading(true);

    // 1. Insert sermon
    const { data: sermonData, error: sermonErr } = await supabase
      .from('sermons')
      .insert({
        group_id: groupId,
        title: title.trim(),
        teacher: teacher.trim(),
        scripture: scripture.trim() || null,
        taught_on: startDate,
        status,
        created_by: user?.id || null,
      })
      .select()
      .single();

    if (sermonErr) {
      setLoading(false);
      setError(friendlyError(sermonErr));
      return;
    }

    // 2. Insert points
    const pointsToInsert = validPoints.map((p) => ({
      sermon_id: sermonData.id,
      day: p.day,
      session: p.session,
      title: p.title.trim(),
      body: p.body.trim(),
      scripture: p.scripture.trim() || null,
    }));

    const { error: pointsErr } = await supabase
      .from('sermon_points')
      .insert(pointsToInsert);

    if (pointsErr) {
      setLoading(false);
      setError(friendlyError(pointsErr));
      return;
    }

    // 3. Insert questions (optional)
    if (validQuestions.length > 0) {
      const questionsToInsert = validQuestions.map((q) => ({
        sermon_id: sermonData.id,
        question: q.question.trim(),
        options: q.options.map((o) => o.trim()),
        answer_index: q.answer_index,
        points: 10,
      }));

      const { error: qErr } = await supabase
        .from('sermon_questions')
        .insert(questionsToInsert);

      if (qErr) {
        setLoading(false);
        setError(friendlyError(qErr));
        return;
      }
    }

    setLoading(false);
    setPublished(true);
    setTimeout(() => navigate('/admin'), 1500);
  };

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
          Upload Sermon
        </h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="New Sermon"
          title="Upload & Schedule"
          subtitle="Points drip + quiz questions"
          right={<HeroIcon icon={BookOpen} />}
        />
      </div>

      <div className="px-5 mt-5 space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Group
          </label>
          <select
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            {GROUP_OPTIONS.map((g) => (
              <option key={g.id} value={g.id}>{g.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Sermon Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Walking in Divine Favor"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Teacher
          </label>
          <input
            type="text"
            value={teacher}
            onChange={(e) => setTeacher(e.target.value)}
            placeholder="Pastor Adeyemi"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Main Scripture
          </label>
          <input
            type="text"
            value={scripture}
            onChange={(e) => setScripture(e.target.value)}
            placeholder="Psalm 5:12"
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full mt-2 p-3.5 rounded-2xl text-sm focus:outline-none"
            style={{ background: 'var(--card)', color: 'var(--text)', border: '1px solid var(--border)' }}
          >
            <option value="published">Published (live for members)</option>
            <option value="draft">Draft (hidden)</option>
          </select>
        </div>
      </div>

      {/* Points */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Sermon Points</h2>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{points.length}</span>
        </div>

        <div className="space-y-3">
          {points.map((p, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {p.session === 'Night' ? (
                    <Moon size={16} style={{ color: 'var(--primary)' }} />
                  ) : (
                    <Sun size={16} style={{ color: 'var(--accent)' }} />
                  )}
                  <span
                    className="text-xs font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    Day {p.day} • {p.session}
                  </span>
                </div>
                {points.length > 1 && (
                  <button onClick={() => removePoint(idx)} className="p-1" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={p.title}
                onChange={(e) => updatePoint(idx, 'title', e.target.value)}
                placeholder="Point title"
                className="w-full p-3 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              />
              <textarea
                value={p.body}
                onChange={(e) => updatePoint(idx, 'body', e.target.value)}
                placeholder="Point description..."
                rows={3}
                className="w-full mt-2 p-3 rounded-xl text-sm focus:outline-none resize-none"
                style={inputStyle}
              />
              <input
                type="text"
                value={p.scripture}
                onChange={(e) => updatePoint(idx, 'scripture', e.target.value)}
                placeholder="Scripture (e.g. Luke 16:10)"
                className="w-full mt-2 p-3 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              />
            </div>
          ))}
        </div>

        <button
          onClick={addPoint}
          className="mt-3 w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--primary)',
            color: 'var(--primary)',
          }}
        >
          <Plus size={18} />
          Add Next Point
        </button>
      </div>

      {/* Questions */}
      <div className="px-5 mt-7">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle size={18} style={{ color: 'var(--accent)' }} />
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            Quiz Questions
          </h2>
          <span className="text-xs ml-auto" style={{ color: 'var(--text-muted)' }}>
            {questions.length}
          </span>
        </div>

        <div className="space-y-3">
          {questions.map((q, qi) => (
            <div
              key={qi}
              className="rounded-2xl p-4"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className="text-xs font-semibold uppercase tracking-wide"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Question {qi + 1}
                </span>
                {questions.length > 1 && (
                  <button onClick={() => removeQuestion(qi)} className="p-1" style={{ color: 'var(--danger)' }}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(qi, 'question', e.target.value)}
                placeholder="Question text"
                className="w-full p-3 rounded-xl text-sm focus:outline-none"
                style={inputStyle}
              />

              <div className="space-y-2 mt-2">
                {q.options.map((opt, oi) => {
                  const isCorrect = q.answer_index === oi;
                  return (
                    <div key={oi} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuestion(qi, 'answer_index', oi)}
                        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition"
                        style={{
                          background: isCorrect ? 'var(--success)' : 'var(--card-soft)',
                          color: isCorrect ? '#ffffff' : 'var(--text-muted)',
                          border: `1px solid ${isCorrect ? 'var(--success)' : 'var(--border)'}`,
                        }}
                      >
                        {String.fromCharCode(65 + oi)}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qi, oi, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                        className="flex-1 p-3 rounded-xl text-sm focus:outline-none"
                        style={inputStyle}
                      />
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] mt-2" style={{ color: 'var(--text-dim)' }}>
                Tap the letter to mark the correct answer
              </p>
            </div>
          ))}
        </div>

        <button
          onClick={addQuestion}
          className="mt-3 w-full py-3 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition"
          style={{
            background: 'var(--card)',
            border: '1px solid var(--accent)',
            color: 'var(--accent)',
          }}
        >
          <Plus size={18} />
          Add Question
        </button>
      </div>

      <div className="px-5 mt-6">
        <div
          className="rounded-2xl p-4 flex items-start gap-3"
          style={{ background: 'var(--primary-soft)', border: '1px solid var(--primary)' }}
        >
          <Sparkles size={18} style={{ color: 'var(--primary)' }} className="mt-0.5" />
          <p className="text-xs leading-relaxed" style={{ color: 'var(--primary)' }}>
            Points drip automatically (morning + night). Quiz questions unlock the same day.
            Everything expires after 30 days.
          </p>
        </div>
      </div>

      {error && (
        <div className="px-5 mt-4">
          <p className="text-xs" style={{ color: 'var(--danger)' }}>{error}</p>
        </div>
      )}

      <div className="px-5 mt-6 pb-6">
        <button
          onClick={handlePublish}
          disabled={loading}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
          style={{ background: 'var(--primary)' }}
        >
          {published ? (
            <>
              <CheckCircle2 size={18} />
              Published
            </>
          ) : loading ? (
            'Publishing...'
          ) : (
            <>
              <Upload size={18} />
              Publish Sermon
            </>
          )}
        </button>
      </div>
    </div>
  );
}