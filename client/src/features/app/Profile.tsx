import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GlassCard from '../../components/GlassCard'
import { useAuthStore } from '../../store/authStore'
import { api } from '../../lib/api'
import { UserIcon, CrownIcon, SettingsIcon } from '../../components/icons'

export default function Profile() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const [stats, setStats] = useState({ chats: 0, messages: 0 })

  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

      {/* Avatar + name */}
      <GlassCard className="p-6 flex flex-col items-center mb-6" glow>
        <div className="w-20 h-20 rounded-full bg-ai-gradient flex items-center justify-center shadow-glow mb-4">
          <UserIcon className="w-10 h-10 text-white" />
        </div>
        <p className="text-xl font-bold text-white">{user?.name || 'User'}</p>
        <p className="text-white/50 text-sm">{user?.email}</p>
        <div className="flex items-center gap-2 mt-3">
          <CrownIcon className="w-4 h-4 text-amber-400" />
          <span className="text-xs uppercase tracking-wider text-amber-400 font-semibold">
            {user?.plan || 'free'} plan
          </span>
        </div>
      </GlassCard>

      {/* Usage stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-gradient">{stats.chats}</p>
          <p className="text-xs text-white/40 mt-1">Conversations</p>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <p className="text-2xl font-bold text-gradient">{stats.messages}</p>
          <p className="text-xs text-white/40 mt-1">Messages</p>
        </GlassCard>
      </div>

      {/* Preferences */}
      <GlassCard className="divide-y divide-white/5">
        <button
          onClick={() => navigate('/app/voice-settings')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
        >
          <span className="text-white/80">Voice Settings</span>
          <SettingsIcon className="w-4 h-4 text-white/30" />
        </button>
        <button
          onClick={() => navigate('/app/personality')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
        >
          <span className="text-white/80">AI Personality</span>
          <SettingsIcon className="w-4 h-4 text-white/30" />
        </button>
        <button
          onClick={() => navigate('/app/subscription')}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
        >
          <span className="text-white/80">Subscription</span>
          <CrownIcon className="w-4 h-4 text-white/30" />
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition"
        >
          <span className="text-red-400">Log Out</span>
        </button>
      </GlassCard>
    </div>
  )
}
