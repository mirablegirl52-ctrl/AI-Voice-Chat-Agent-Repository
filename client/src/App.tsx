import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Splash from './features/auth/Splash'
import Onboarding from './features/auth/Onboarding'
import Login from './features/auth/Login'
import Register from './features/auth/Register'
import AppLayout from './features/app/AppLayout'
import Home from './features/app/Home'
import VoiceChat from './features/voice/VoiceChat'
import TextChat from './features/chat/TextChat'
import History from './features/app/History'
import VoiceSettings from './features/settings/VoiceSettings'
import Personality from './features/settings/Personality'
import Profile from './features/app/Profile'
import Subscription from './features/app/Subscription'
import Settings from './features/settings/Settings'

export default function App() {
  useLocation() // subscribe to location changes for re-render
  const token = useAuthStore((s) => s.token)

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<Splash />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected */}
      <Route path="/app" element={token ? <AppLayout /> : <Navigate to="/login" replace />}>
        <Route index element={<Navigate to="/app/home" replace />} />
        <Route path="home" element={<Home />} />
        <Route path="voice" element={<VoiceChat />} />
        <Route path="text/:chatId" element={<TextChat />} />
        <Route path="history" element={<History />} />
        <Route path="voice-settings" element={<VoiceSettings />} />
        <Route path="personality" element={<Personality />} />
        <Route path="profile" element={<Profile />} />
        <Route path="subscription" element={<Subscription />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
