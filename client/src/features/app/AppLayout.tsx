import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import Background from '../../components/Background'
import { HomeIcon, HistoryIcon, HeadphonesIcon, SettingsIcon, UserIcon, CrownIcon } from '../../components/icons'

const navItems = [
  { path: '/app/home', icon: HomeIcon, label: 'Home' },
  { path: '/app/history', icon: HistoryIcon, label: 'History' },
  { path: '/app/voice', icon: HeadphonesIcon, label: 'Voice' },
  { path: '/app/profile', icon: UserIcon, label: 'Profile' },
  { path: '/app/subscription', icon: CrownIcon, label: 'Plan' },
]

export default function AppLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <div className="min-h-screen flex flex-col relative">
      <Background count={2} />

      {/* Header */}
      <header className="relative z-20 px-5 pt-4 pb-2 flex items-center justify-between">
        <button
          onClick={() => navigate('/app/settings')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <SettingsIcon className="w-5 h-5 text-white/60" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-sm text-white/50">Aria</span>
        </div>
        <button
          onClick={() => navigate('/app/personality')}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition"
        >
          <svg className="w-5 h-5 text-white/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-5 pb-24 relative z-10">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 inset-x-0 z-30 glass-strong border-t border-white/5 px-2 pb-[env(safe-area-inset-bottom)]">
        <div className="flex justify-around py-2">
          {navItems.map((item) => {
            const active = location.pathname === item.path
            const Icon = item.icon
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-ai-400' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px]">{item.label}</span>
                {active && (
                  <motion.div
                    layoutId="nav-dot"
                    className="w-1 h-1 rounded-full bg-ai-400"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
