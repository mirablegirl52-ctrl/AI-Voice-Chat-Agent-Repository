/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        deep: '#050816',
        navy: {
          900: '#0a0f25',
          800: '#0f1535',
          700: '#161d40',
          600: '#1e2650',
        },
        ai: {
          50: '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        purple: {
          neon: '#a855f7',
        },
        cyan: {
          neon: '#22d3ee',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 20s linear infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        gradient: {
          '0%, 100%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
        },
      },
      backgroundImage: {
        'ai-gradient': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #22d3ee 100%)',
        'ai-gradient-soft': 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(168,85,247,0.15) 50%, rgba(34,211,238,0.15) 100%)',
      },
      boxShadow: {
        'glow': '0 0 40px rgba(99, 102, 241, 0.4)',
        'glow-purple': '0 0 40px rgba(168, 85, 247, 0.4)',
        'glow-cyan': '0 0 40px rgba(34, 211, 238, 0.4)',
      },
    },
  },
  plugins: [],
}
