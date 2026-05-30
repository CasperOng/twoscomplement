/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // App palette — deep slate canvas with neon accents.
        ink: {
          900: '#0a0e1a',
          800: '#0f1424',
          700: '#161c30',
          600: '#1e263f',
          500: '#2a3350',
        },
        accent: {
          // cyan = "on"/positive bit
          cyan: '#22d3ee',
          // violet = brand / level
          violet: '#a78bfa',
          // amber = the sign bit (the star of two's complement)
          amber: '#fbbf24',
          // emerald = correct
          emerald: '#34d399',
          // rose = wrong / negative
          rose: '#fb7185',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(34,211,238,0.4), 0 0 24px -4px rgba(34,211,238,0.5)',
        'glow-amber': '0 0 0 1px rgba(251,191,36,0.5), 0 0 24px -4px rgba(251,191,36,0.6)',
      },
      keyframes: {
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        pop: {
          '0%': { transform: 'scale(1)' },
          '40%': { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shake: {
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(4px)' },
          '30%, 50%, 70%': { transform: 'translateX(-8px)' },
          '40%, 60%': { transform: 'translateX(8px)' },
        },
      },
      animation: {
        flip: 'flip 0.4s ease-in-out',
        pop: 'pop 0.3s ease-out',
        'slide-up': 'slide-up 0.4s ease-out',
        shake: 'shake 0.5s ease-in-out',
      },
    },
  },
  plugins: [],
}
