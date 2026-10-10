import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, Timer, Gamepad2, User } from 'lucide-react'

const navItems = [
  { to: '/sermons', icon: BookOpen, label: 'Word' },
  { to: '/prayer', icon: Timer, label: 'Prayer' },
  { to: '/', icon: Home, label: 'Home' },
  { to: '/game', icon: Gamepad2, label: 'Game' },
  { to: '/profile', icon: User, label: 'Me' }
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()

  const activeIndex = navItems.findIndex((item) => {
    if (item.to === '/') return pathname === '/'
    return pathname.startsWith(item.to)
  })
  const safeIndex = activeIndex === -1 ? 2 : activeIndex

  // width per tab as fraction of 375
  const tabWidth = 375 / navItems.length
  const notchCenter = tabWidth * safeIndex + tabWidth / 2
  const notchWidth = 66

  const left = notchCenter - notchWidth / 2
  const right = notchCenter + notchWidth / 2

  const navPath = `
    M0,20
    L${left},20
    Q${left + 8},20 ${left + 12},8
    Q${notchCenter},-14 ${right - 12},8
    Q${right - 8},20 ${right},20
    L375,20
    L375,72 L0,72 Z
  `

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 safe-bottom md:hidden">
      <div className="relative h-[72px]">
        {/* Curved bar with moving notch */}
        <svg
          viewBox="0 0 375 72"
          preserveAspectRatio="none"
          className="absolute inset-0 w-full h-full"
        >
          <path
            d={navPath}
            fill="var(--nav-bg)"
            style={{ transition: 'd 0.35s cubic-bezier(0.4, 0, 0.2, 1)' }}
          />
        </svg>

        {/* Tab buttons */}
        <div className="absolute inset-0 flex">
          {navItems.map((item, idx) => {
            const Icon = item.icon
            const isActive = idx === safeIndex

            return (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="flex-1 flex flex-col items-center justify-end pb-3 relative"
                style={{ paddingTop: isActive ? 0 : 12 }}
              >
                {/* Active floating circle */}
                <div
                  className="absolute transition-all duration-300"
                  style={{
                    top: isActive ? '-24px' : '8px',
                    width: isActive ? '48px' : '40px',
                    height: isActive ? '48px' : '40px',
                    borderRadius: '50%',
                    background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                    boxShadow: isActive
                      ? '0 8px 24px rgba(37, 99, 235, 0.5)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0,
                    transform: isActive ? 'scale(1)' : 'scale(0.6)'
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={2.4}
                    style={{ color: 'var(--nav-active-icon)' }}
                  />
                </div>

                {/* Inactive icon (only shown when not active) */}
                {!isActive && (
                  <Icon
                    size={22}
                    strokeWidth={1.9}
                    style={{ color: 'var(--nav-icon)' }}
                  />
                )}

                {/* Label */}
                <span
                  className="text-[10px] font-medium mt-1 transition-all duration-300"
                  style={{
                    color: isActive ? 'var(--nav-active-bg)' : 'var(--nav-icon)',
                    opacity: isActive ? 0 : 1,
                    transform: isActive ? 'translateY(4px)' : 'translateY(0)'
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </nav>
  )
}