import { Outlet, useLocation } from 'react-router-dom'
import BottomNav from './BottomNav'
import Sidebar from './Sidebar'

export default function AppShell() {
  const location = useLocation()

  // Bottom nav shows on: Home, Word, Prayer, Game, Profile (the 5 main tabs)
  const mainTabs = ['/', '/sermons', '/prayer', '/game', '/profile']
  const showBottomNav = mainTabs.includes(location.pathname)

  return (
    <div
      className="min-h-screen w-full"
      style={{ background: 'var(--bg)' }}
    >
      {/* Sidebar — iPad & desktop only */}
      <Sidebar />

      {/* Main content */}
      <main
        className="min-h-screen md:ml-64 no-scrollbar"
        style={{ paddingBottom: showBottomNav ? '96px' : '24px' }}
      >
        {/* Content column: full width on phone, wider on tablet */}
        <div className="w-full max-w-md mx-auto md:max-w-3xl md:mx-auto">
          <Outlet />
        </div>
      </main>

      {/* Bottom nav — phone only */}
      {showBottomNav && <BottomNav />}
    </div>
  )
}