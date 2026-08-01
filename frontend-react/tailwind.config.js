/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        bg:    { DEFAULT: '#F7F8FC', card: '#FFFFFF', subtle: '#F1F3F9' },
        primary: { DEFAULT: '#2563EB', hover: '#1D4ED8', light: '#EFF6FF', ring: '#BFDBFE' },
        secondary: { DEFAULT: '#10B981', hover: '#059669', light: '#ECFDF5', ring: '#A7F3D0' },
        accent: { DEFAULT: '#F59E0B', hover: '#D97706', light: '#FFFBEB', ring: '#FDE68A' },
        ink:   { DEFAULT: '#111827', secondary: '#6B7280', muted: '#9CA3AF', subtle: '#D1D5DB' },
        border: { DEFAULT: '#E5E7EB', strong: '#D1D5DB' },
        danger: { DEFAULT: '#EF4444', light: '#FEF2F2', ring: '#FECACA' },
      },
      borderRadius: {
        card: '20px',
        input: '14px',
        btn: '10px',
        pill: '9999px',
      },
      boxShadow: {
        card:  '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 12px 32px rgba(0,0,0,0.06)',
        input: '0 2px 8px rgba(0,0,0,0.06)',
        'input-focus': '0 0 0 3px rgba(37,99,235,0.12)',
        btn:   '0 1px 3px rgba(0,0,0,0.1)',
        'btn-hover': '0 4px 12px rgba(0,0,0,0.12)',
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-up':   'slideUp 0.3s cubic-bezier(0.25,1,0.5,1)',
        'slide-right':'slideRight 0.3s cubic-bezier(0.25,1,0.5,1)',
        'bounce-dot': 'bounceDot 1.4s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp:   { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        slideRight:{ from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        bounceDot: { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
      transitionTimingFunction: {
        spring: 'cubic-bezier(0.25, 1, 0.5, 1)',
      },
    },
  },
  plugins: [],
};
