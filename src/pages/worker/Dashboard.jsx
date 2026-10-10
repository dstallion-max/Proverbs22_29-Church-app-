import { useNavigate } from 'react-router-dom'
import {
  Wallet, Users, Calendar, ClipboardList, TrendingUp, Bell,
  ArrowLeft, MessageCircle, Target, Layers
} from 'lucide-react'
import HeroCard, { HeroIcon } from '../../components/common/HeroCard'

const quickActions = [
  { icon: Layers,        title: 'Departments', color: 'var(--primary)', to: '/worker/departments' },
  { icon: MessageCircle, title: 'Groups',      color: '#a855f7',        to: '/worker/groups' },
  { icon: Target,        title: 'Projects',    color: 'var(--success)', to: '/worker/projects' },
  { icon: Wallet,        title: 'Offering',    color: 'var(--primary)', to: '/worker/offering' },
  { icon: ClipboardList, title: 'Attendance',  color: 'var(--success)', to: '/worker/attendance' },
  { icon: Calendar,      title: 'Service Plan',color: 'var(--accent)',  to: '/worker/service-plan' },
  { icon: ClipboardList, title: 'My Tasks',    color: '#a855f7',        to: '/worker/tasks' }
]

const summary = [
  { icon: Wallet, label: 'Total Offering', value: 'N 245,500' },
  { icon: Users, label: 'Total Attendance', value: '312 people' },
  { icon: TrendingUp, label: 'First Timers', value: '18 people' }
]

const activity = [
  { text: 'Offering submitted for Sunday', time: '2 hours ago' },
  { text: 'Attendance recorded for Teens', time: '3 hours ago' },
  { text: 'Service plan updated by Pastor', time: 'Yesterday' }
]

export default function Dashboard() {
  const navigate = useNavigate()

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
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>Worker Dashboard</h1>
        <div className="w-10" />
      </div>

      <div className="px-5 mt-1">
        <HeroCard
          eyebrow="Worker Dashboard"
          title="Welcome, Worker"
          subtitle="Sunday, 12 January 2026"
          right={<HeroIcon icon={Users} />}
        />
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
              <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{action.title}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Today's Summary</h2>
        <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          {summary.map((row, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 p-4"
              style={{ borderBottom: idx < summary.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              <row.icon size={18} style={{ color: 'var(--primary)' }} />
              <span className="flex-1 text-sm" style={{ color: 'var(--text-muted)' }}>{row.label}</span>
              <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6">
        <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--text)' }}>Recent Activity</h2>
        <div className="space-y-2">
          {activity.map((a, idx) => (
            <div
              key={idx}
              className="rounded-2xl p-3.5"
              style={{ background: 'var(--card)', border: '1px solid var(--border)' }}
            >
              <p className="text-sm" style={{ color: 'var(--text)' }}>{a.text}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{a.time}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-5 mt-6 mb-6">
        <button
          className="w-full py-4 rounded-2xl font-medium flex items-center justify-center gap-2 active:scale-[0.98] transition text-white"
          style={{ background: 'var(--primary)', boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)' }}
        >
          <Bell size={18} />
          Notify Group
        </button>
      </div>
    </div>
  )
}