/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Crackers King Blue Palette System (Soft Light Blue -> Sky -> Vibrant -> Royal -> Deep Navy)
        brand: {
          50: '#F0F7FF',   // Soft Light Blue
          100: '#E0EFFE',  // Light Blue Accent
          200: '#BAE0FD',  // Sky Blue Tint
          300: '#7CC5FC',  // Sky Blue
          400: '#36A7F9',  // Vibrant Sky
          500: '#0C89EB',  // Core Brand Blue
          600: '#006BCE',  // Deep Electric Blue
          700: '#0055A7',  // Royal Blue
          800: '#044889',  // Deep Royal
          900: '#0A3B70',  // Deep Navy Blue
          950: '#061A30',  // Midnight Navy
        },
        surface: {
          light: '#FFFFFF',
          soft: '#F8FAFC',
          glass: 'rgba(255, 255, 255, 0.85)',
          dark: '#0B132B',
          'dark-elevated': '#1C2541',
          'dark-glass': 'rgba(11, 19, 43, 0.85)',
        },
        slate: {
          950: '#0B132B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(12, 137, 235, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(12, 137, 235, 0.15)',
        'glow-soft': '0 0 20px rgba(54, 167, 249, 0.2)',
        'glow-brand': '0 0 25px rgba(12, 137, 235, 0.35)',
        'sheet': '0 -10px 40px rgba(0, 0, 0, 0.15)',
      },
      borderRadius: {
        'xs': '0.375rem',
        'sm': '0.5rem',
        'md': '0.75rem',
        'lg': '1rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      animation: {
        'gradient-slow': 'gradientShift 24s ease infinite',
        'pulse-subtle': 'pulseSubtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        'fade-in': 'fadeIn 0.2s ease-out',
        'scale-in': 'scaleIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      },
      keyframes: {
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.85' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
