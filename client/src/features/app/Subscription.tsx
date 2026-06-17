import { motion } from 'framer-motion'
import GlassCard from '../../components/GlassCard'
import { useAuthStore } from '../../store/authStore'
import { CheckIcon, CrownIcon } from '../../components/icons'

const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: '/month',
    features: ['10 voice minutes/day', 'Standard AI model', '7-day history', '2 personalities'],
    accent: 'from-white/10 to-white/5',
    border: 'border-white/10',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    features: ['60 voice minutes/day', 'Advanced AI model', 'Unlimited history', 'All personalities', 'Priority support'],
    accent: 'from-ai-600 to-purple-neon',
    border: 'border-ai-500/30',
    popular: true,
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    features: ['Unlimited voice', 'Best AI model', 'Unlimited history', 'All personalities', 'Priority support', 'API access'],
    accent: 'from-cyan-neon to-ai-500',
    border: 'border-cyan-neon/30',
  },
]

export default function Subscription() {
  const user = useAuthStore((s) => s.user)
  const currentPlan = user?.plan || 'free'

  return (
    <div className="py-4">
      <h1 className="text-2xl font-bold text-white mb-2">Subscription</h1>
      <p className="text-white/50 text-sm mb-6">Choose the plan that fits your needs</p>

      <div className="space-y-4">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id
          return (
            <motion.div
              key={plan.id}
              whileTap={{ scale: 0.98 }}
              className={`relative rounded-3xl overflow-hidden ${isCurrent ? 'ring-2 ring-ai-400' : ''}`}
            >
              {plan.popular && (
                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-ai-gradient text-xs font-semibold text-white">
                  Popular
                </div>
              )}
              <GlassCard className={`p-5 ${isCurrent ? 'shadow-glow' : ''}`}>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-white">{plan.price}</span>
                  <span className="text-white/40 text-sm">{plan.period}</span>
                </div>
                <p className="text-lg font-semibold text-gradient mb-4">{plan.name}</p>
                <ul className="space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <CheckIcon className="w-4 h-4 text-ai-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full mt-4 py-2.5 rounded-xl text-sm font-semibold transition ${
                    isCurrent
                      ? 'bg-white/5 text-white/40 cursor-default'
                      : `bg-gradient-to-r ${plan.accent} text-white shadow-glow`
                  }`}
                >
                  {isCurrent ? 'Current Plan' : 'Upgrade'}
                </button>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
