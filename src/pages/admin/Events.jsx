import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, MapPin, Clock, Plus, Users, ArrowLeft, X,
  Trash2, Edit3, CheckCircle2, Save, RefreshCw
} from 'lucide-react'
import HeroCard, { HeroIcon } from '../../components/common/HeroCard'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import { friendlyError } from '../../utils/errors'

const CATEGORIES = ['Service', 'Retreat', 'Youth', 'Outreach', 'Special', 'General']

const emptyDraft = {
  title: '',
  description: '',
  event_date: '',
  start_time: '',
  end_time: '',
  location: '',
  category: 'Service',
  expected_attendance: '',
}

export default function Events() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [draft, setDraft] = useState(emptyDraft)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    setLoading(true)
    setError('')

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('event_date', { ascending: true })

    setLoading(false)

    if (error) {
      setError(friendlyError(error))
      return
    }
    setEvents(data || [])
  }

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyDraft)
    setSheetOpen(true)
  }

  const openEdit = (ev) => {
    setEditingId(ev.id)
    setDraft({
      title: ev.title || '',
      description: ev.description || '',
      event_date: ev.event_date || '',
      start_time: ev.start_time || '',
      end_time: ev.end_time || '',
      location: ev.location || '',
      category: ev.category || 'Service',
      expected_attendance: ev.expected_attendance ? String(ev.expected_attendance) : '',
    })
    setSheetOpen(true)
  }

  const handleSave = async () => {
    setError('')

    if (!draft.title.trim()) return setError('Please enter a title')
    if (!draft.event_date) return setError('Please pick a date')

    setSaving(true)

    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      event_date: draft.event_date,
      start_time: draft.start_time.trim() || null,
      end_time: draft.end_time.trim() || null,
      location: draft.location.trim() || null,
      category: draft.category,
      expected_attendance: parseInt(draft.expected_attendance) || 0,
    }

    let err
    if (editingId) {
      ({ error: err } = await supabase.from('events').update(payload).eq('id', editingId))
    } else {
      ({ error: err } = await supabase.from('events').insert({
        ...payload,
        created_by: user?.id || null,
      }))
    }

    setSaving(false)

    if (err) {
      setError(friendlyError(err))
      return
    }

    setSheetOpen(false)
    setDraft(emptyDraft)
    setEditingId(null)
    await loadEvents()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this event?')) return
    const { error } = await supabase.from('events').delete().eq('id', id)
    if (error) {
      setError(friendlyError(error))
      return
    }
    loadEvents()
  }

  const today = new Date().toISOString().split('T')[0]
  const upcoming = events.filter((e) => e.event_date >= today)
  const past = events.filter((e) => e.event_date < today)

  const inputStyle = {
    background: 'var(--card-soft)',
    color: 'var(--text)',
    border: '1px solid var(--border)',
  }

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Events</h1>
        <button
          onClick={loadEvents}
          disabled={loading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Events"
          title="Church Calendar"
          subtitle={`${upcoming.length} upcoming event${upcoming.length === 1 ? '' : 's'}`}
          right={<HeroIcon icon={Calendar} />}
        />
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

      {!loading && events.length === 0 && (
        <div className="px-5 mt-6">
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
          >
            <Calendar size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--text)' }}>No events yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
              Tap + to create the first one
            </p>
          </div>
        </div>
      )}

      {!loading && upcoming.length > 0 && (
        <div className="px-5 mt-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Upcoming</h2>
          <div className="space-y-3">
            {upcoming.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                onEdit={() => openEdit(e)}
                onDelete={() => handleDelete(e.id)}
              />
            ))}
          </div>
        </div>
      )}

      {!loading && past.length > 0 && (
        <div className="px-5 mt-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Past Events</h2>
          <div className="space-y-3">
            {past.map((e) => (
              <EventCard
                key={e.id}
                event={e}
                faded
                onEdit={() => openEdit(e)}
                onDelete={() => handleDelete(e.id)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="px-5 mt-6 pb-6">
        <button
          onClick={openCreate}
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition"
          style={{ background: 'var(--primary)' }}
        >
          <Plus size={18} />
          Create Event
        </button>
      </div>

      {sheetOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            style={{ background: 'rgba(0,0,0,0.5)' }}
            onClick={() => !saving && setSheetOpen(false)}
          />

          <div
            className="relative w-full max-w-md rounded-t-3xl safe-bottom anim-slide-up flex flex-col"
            style={{ background: 'var(--bg-soft)', maxHeight: '90vh' }}
          >
            <div className="p-5 pb-3">
              <div
                className="w-12 h-1 rounded-full mx-auto mb-4"
                style={{ background: 'var(--text-dim)' }}
              />

              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
                  {editingId ? 'Edit Event' : 'New Event'}
                </h3>
                <button
                  onClick={() => !saving && setSheetOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: 'var(--card)' }}
                >
                  <X size={16} style={{ color: 'var(--text)' }} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar px-5 pb-3 space-y-3">
              <Field label="Title">
                <input
                  type="text"
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  placeholder="e.g. Annual Thanksgiving Service"
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description (optional)">
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Brief description"
                  rows={3}
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none resize-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="Date">
                <input
                  type="date"
                  value={draft.event_date}
                  onChange={(e) => setDraft({ ...draft, event_date: e.target.value })}
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </Field>

              <div className="grid grid-cols-2 gap-2">
                <Field label="Start Time">
                  <input
                    type="text"
                    value={draft.start_time}
                    onChange={(e) => setDraft({ ...draft, start_time: e.target.value })}
                    placeholder="8:00 AM"
                    className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </Field>
                <Field label="End Time">
                  <input
                    type="text"
                    value={draft.end_time}
                    onChange={(e) => setDraft({ ...draft, end_time: e.target.value })}
                    placeholder="11:00 AM"
                    className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                    style={inputStyle}
                  />
                </Field>
              </div>

              <Field label="Location">
                <input
                  type="text"
                  value={draft.location}
                  onChange={(e) => setDraft({ ...draft, location: e.target.value })}
                  placeholder="Main Auditorium"
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </Field>

              <Field label="Category">
                <select
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </Field>

              <Field label="Expected Attendance (optional)">
                <input
                  type="number"
                  inputMode="numeric"
                  value={draft.expected_attendance}
                  onChange={(e) => setDraft({ ...draft, expected_attendance: e.target.value })}
                  placeholder="e.g. 300"
                  className="w-full p-3.5 rounded-2xl text-sm focus:outline-none"
                  style={inputStyle}
                />
              </Field>
            </div>

            <div className="p-5 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 text-white active:scale-[0.98] transition disabled:opacity-60"
                style={{ background: 'var(--primary)' }}
              >
                {saving ? 'Saving...' : (
                  <>
                    <Save size={18} />
                    {editingId ? 'Save Changes' : 'Create Event'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        {label}
      </label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function EventCard({ event, faded, onEdit, onDelete }) {
  const d = new Date(event.event_date)
  const month = d.toLocaleDateString('en-NG', { month: 'short' })
  const day = d.getDate()

  return (
    <div
      className="rounded-2xl p-4 flex items-start gap-3"
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        opacity: faded ? 0.6 : 1,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0"
        style={{ background: 'var(--primary)' }}
      >
        <span className="text-[9px] uppercase font-semibold text-white/80">{month}</span>
        <span className="font-display text-lg text-white leading-none">{day}</span>
      </div>

      <div className="flex-1 min-w-0">
        <h4 className="font-display text-base" style={{ color: 'var(--text)' }}>
          {event.title}
        </h4>

        <div className="flex flex-wrap gap-3 mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          {event.start_time && (
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{event.start_time}{event.end_time ? ` – ${event.end_time}` : ''}</span>
            </div>
          )}
          {event.location && (
            <div className="flex items-center gap-1">
              <MapPin size={12} />
              <span>{event.location}</span>
            </div>
          )}
        </div>

        {event.expected_attendance > 0 && (
          <div
            className="flex items-center gap-1 mt-2 text-xs font-medium"
            style={{ color: 'var(--primary)' }}
          >
            <Users size={12} />
            <span>{event.expected_attendance} expected</span>
          </div>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onEdit}
            className="flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
            style={{ background: 'var(--primary-soft)', color: 'var(--primary)' }}
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center"
            style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}