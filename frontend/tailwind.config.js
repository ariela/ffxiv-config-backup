/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        abyss:   '#070a14',
        aether:  '#0c1224',
        umbra:   '#121a31',
        arcanum: '#243150',
        gold: {
          DEFAULT: '#c9a227',
          bright:  '#e8c66a',
          dim:     '#8a7220',
        },
        crystal: {
          DEFAULT: '#5cc8ff',
          bright:  '#9fe0ff',
          deep:    '#2a6fb0',
        },
        jade:     '#34d399',
        garnet:   '#f0506e',
        amber:    '#f4b740',
        parchment:'#e8e2d4',
        mist:     '#9aa6c4',
        faint:    '#5d6a8c',
      },
      fontFamily: {
        display: ['Cinzel', 'Georgia', 'serif'],
      },
      boxShadow: {
        'glow-gold':    '0 0 14px rgba(201,162,39,0.55)',
        'glow-gold-lg': '0 0 28px rgba(201,162,39,0.45)',
        'glow-crystal': '0 0 12px rgba(92,200,255,0.55)',
        'glow-jade':    '0 0 10px rgba(52,211,153,0.55)',
        'glow-garnet':  '0 0 14px rgba(240,80,110,0.75)',
      },
      keyframes: {
        'fade-up': {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-crystal': {
          '0%, 100%': { boxShadow: '0 0 3px rgba(92,200,255,0.3)' },
          '50%':       { boxShadow: '0 0 18px rgba(92,200,255,0.95)' },
        },
        'pulse-garnet': {
          '0%, 100%': { boxShadow: '0 0 3px rgba(240,80,110,0.3)' },
          '50%':       { boxShadow: '0 0 18px rgba(240,80,110,1)' },
        },
      },
      animation: {
        'fade-up':       'fade-up 0.45s ease both',
        'pulse-crystal': 'pulse-crystal 2.5s ease-in-out infinite',
        'pulse-garnet':  'pulse-garnet 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
