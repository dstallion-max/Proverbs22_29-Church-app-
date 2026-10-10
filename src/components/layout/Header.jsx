import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()

  return (
    <div className="flex justify-end items-center gap-3 px-5 pt-6 pb-2 safe-top">
      <button
        onClick={() => navigate('/announcements')}
        className="w-11 h-11 rounded-full surface-card border border-theme flex items-center justify-center active:scale-95 transition relative"
      >
        <Bell size={20} className="text-theme" />
        <span
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ background: 'var(--accent)' }}
        />
      </button>

      <button
        onClick={() => navigate('/profile')}
        className="w-11 h-11 rounded-full surface-card flex items-center justify-center active:scale-95 transition"
        style={{ border: '2px solid var(--success)' }}
      >
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: 'var(--card-soft)' }}
        >
          <span className="text-xs font-semibold text-theme">D</span>
        </div>
      </button>
    </div>
  )
}