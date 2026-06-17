import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import GlassCard from '../../components/GlassCard'
import { useAuthStore } from '../../store/authStore'
import {
  UserIcon,
  HeadphonesIcon,
  PaletteIcon,
  GlobeIcon,
  ShieldIcon,
  BellIcon,
  DownloadIcon,
  LogoutIcon,
  ChevronRightIcon,
} from '../../components/icons'

const sections = [
  { icon: <UserIcon className="w-5 h-5" />, label: 'Account', path: '/app/profile' },
  { icon: <HeadphonesIcon className="w-5 h-5" />, label: 'Voice', path: '/app/voice-settings' },
  { icon: <PaletteIcon className="w-5 h-5" />, label: 'AI Personality', path: '/app/personality' },
  { icon: <GlobeIcon className="w-5 h-5" />, label: 'Language', path: '' },
  { icon: <ShieldIcon className="w-5 h-5" />, label: 'Privacy', path: '' },
  { icon: <BellIcon className="w-5 h-5" />, label: 'Notifications', path: '' },
  { icon: <DownloadIcon className="w-5 h-5" />, label: 'Export Data', path: '' },
]

export default function Settings() {
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

      <GlassCard className="divide-y divide-white/5 mb-4">
        {sections.map((s) => (
          <motion.button
            key={s.label}
            whileTap={{ scale: 0.99 }}
            onClick={() => s.path && navigate(s.path)}
            className="w-full flex items-center gap-4 p-4 hover:bg-white/5 transition"
          >
            <div className="text-ai-400">{s.icon}</div>
            <span className="flex-1 text-left text-white/80">{s.label}</span>
            <ChevronRightIcon className="w-4 h-4 text-white/20" />
          </motion.button>
        ))}
      </GlassCard>

      <button
        onClick={handleLogout}
        className="w-full glass flex items-center gap-4 p-4 hover:bg-red-500/10 transition"
      >
        <LogoutIcon className="w-5 h-5 text-red-400" />
        <span className="text-red-400 font-medium">Log Out</span>
      </button>

      <p className="text-center text-white/20 text-xs mt-8">Aria v1.0 · AI Voice Assistant</p>
    </div>
  )
}
