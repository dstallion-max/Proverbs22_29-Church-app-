import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Wallet, TrendingUp, Bell, BookOpen, BarChart3,
  UserPlus, Calendar, Award, ArrowLeft, Crown, Shield, RefreshCw
} from 'lucide-react'
import HeroCard, { HeroIcon } from '../../components/common/HeroCard'
import { supabase } from '../../lib/supabaseClient'
import { friendlyError } from '../../utils/errors'

const quickActions = [
  { icon: BookOpen,  label: 'Upload Sermon', color: 'var(--primary)', to: '/admin/sermon-upload' },
  { icon: Crown,     label: 'Roles & Leads', color: '#a855f7',        to: '/admin/roles' },
  { icon: Bell,      label: 'Send Notice',   color: 'var(--accent)',  to: '/admin/notifications' },
  { icon: BarChart3, label: 'Reports',       color: 'var(--success)', to: '/admin/reports' },
  { icon: Calendar,  label: 'Events',        color: '#ec4899',        to: '/admin/events' },
  { icon: Shield,    label: 'Workers',       color: 'var(--primary)', to: '/worker' }
]

export default function PastorDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [departments, setDepartments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    setError('')

    const [statsRes, deptRes] = await Promise.all([
      supabase.rpc('get_church_stats'),
      supabase.rpc('get_department_stats'),
    ])

    setLoading(false)

    if (statsRes.error || deptRes.error) {
      setError(friendlyError(statsRes.error || deptRes.error))
      return
    }

    setStats(statsRes.data || {})
    setDepartments(deptRes.data || [])
  }

  const fmtMoney = (n) => {
    const num = Number(n) || 0
    if (num >= 1000000) return `N ${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `N ${(num / 1000).toFixed(0)}K`
    return `N ${num.toLocaleString()}`
  }

  const fmtChange = (current, previous) => {
    if (!previous || previous === 0) return 'No prior data'
    const diff = ((current - previous) / previous) * 100
    const sign = diff >= 0 ? '+' : ''
    return `${sign}${diff.toFixed(0)}% vs last`
  }

  const dateLabel = new Date().toLocaleDateString('en-NG', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  })

  return (
    <div className="anim-fade-up min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between px-5 pt-8 pb-4 safe-top">
        <button
          onClick={() => navigate('/profile')}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <ArrowLeft size={20} style={{ color: 'var(--text)' }} />
        </button>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Pastor's Dashboard</h1>
        <button
          onClick={loadAll}
          disabled={loading}
          className="w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition disabled:opacity-50"
          style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
        >
          <RefreshCw size={18} style={{ color: 'var(--text)' }} />
        </button>
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Pastor's Dashboard"
          title="Welcome, Pastor"
          subtitle={dateLabel}
          right={<HeroIcon icon={Crown} />}
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

      {!loading && stats && (
        <>
          <div className="px-5 mt-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Church Overview</h2>
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={Users}
                label="This Sunday"
                value={stats.attendance_this_sunday}
                trend={fmtChange(stats.attendance_this_sunday, stats.attendance_last_sunday)}
                color="var(--primary)"
              />
              <StatTile
                icon={Wallet}
                label="Offering (Month)"
                value={fmtMoney(stats.offering_this_month)}
                trend={fmtChange(stats.offering_this_month, stats.offering_last_month)}
                color="var(--success)"
              />
              <StatTile
                icon={UserPlus}
                label="First Timers"
                value={stats.first_timers_this_month}
                trend="This month"
                color="var(--accent)"
              />
              <StatTile
                icon={Award}
                label="Members"
                value={stats.total_members}
                trend="Registered"
                color="#a855f7"
              />
            </div>
          </div>

          <div className="px-5 mt-6">
            <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.to)}
                  className="rounded-2xl p-4 flex flex-col items-start gap-3 active:scale-95 transition text-left"
                  style={{ background: 'var(--card)', border: `1px solid ${action.color}40` }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background: `${action.color}15` }}
                  >
                    <action.icon size={20} style={{ color: action.color }} />
                  </div>
                  <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                    {action.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && departments.length > 0 && (
        <div className="px-5 mt-6 pb-6">
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Departments & Groups</h2>
          <div className="space-y-2">
            {departments.map((d) => (
              <div
                key={d.slug}
                className="rounded-2xl p-4 flex items-center gap-3"
                style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${d.color || 'var(--primary)'}20` }}
                >
                  <span
                    className="font-display text-lg"
                    style={{ color: d.color || 'var(--primary)' }}
                  >
                    {d.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{d.name}</p>
                  <p className="text-xs mt-0.5 capitalize" style={{ color: 'var(--text-dim)' }}>
                    {d.type} · {d.member_count} member{d.member_count === 1 ? '' : 's'}
                  </p>
                </div>
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ background: d.member_count > 0 ? 'var(--success)' : 'var(--text-dim)' }}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatTile({ icon: Icon, label, value, trend, color }) {
  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'var(--card)', border: `1px solid ${color}40` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
        style={{ background: `${color}15` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
      <p className="font-display text-2xl mt-0.5" style={{ color: 'var(--text)' }}>{value}</p>
      <p className="text-[10px] mt-1" style={{ color: 'var(--text-dim)' }}>{trend}</p>
    </div>
  )
}