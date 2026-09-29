/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    
    "./*.{js,html}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        mocha: {
          950: '#0a0807',
          900: '#120e0b',
          850: '#1a1410',
          800: '#261c16',
          700: '#3d2e24',
          600: '#5c4637',
          500: '#8c6b54',
          400: '#b89479',
          300: '#d4b79f',
          200: '#ecdcce',
          100: '#f7f1eb',
        },
        bronze: {
          DEFAULT: '#d97706',
          light: '#f59e0b',
          dark: '#b45309',
          accent: '#e0a96d',
          gold: '#fde68a'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['Fira Code', 'JetBrains Mono', 'monospace']
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      }
    },
  },
  plugins: [],
}

