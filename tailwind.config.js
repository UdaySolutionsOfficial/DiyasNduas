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
        // Royal Indian Festive Palette System (Maroon, Terracotta, Ivory, Antique Gold)
        brand: {
          50: '#F7F1E7',   // Luminous Royal Ivory (Exact Client Palette)
          100: '#F3E9DD',  // Warm Silk Ivory
          200: '#E6D2BD',  // Antique Gold Tint
          300: '#D5B58D',  // Warm Muted Brass
          400: '#C87C52',  // Radiant Terracotta Gold
          500: '#B9653C',  // Core Handcrafted Terracotta (Exact Client Palette)
          600: '#9C4828',  // Deep Earthen Terracotta
          700: '#70232B',  // Royal Festive Maroon (Exact Client Palette)
          800: '#561A21',  // Deep Imperial Maroon
          900: '#3E1217',  // Rich Velvet Maroon
          950: '#280B0F',  // Midnight Royal Obsidian
        },
        maroon: {
          50: '#FDF2F3',
          100: '#FBE4E7',
          200: '#F8CBD1',
          300: '#F0A3AD',
          400: '#DF6B7A',
          500: '#922D37',
          600: '#812730',
          700: '#70232B',  // Exact Client Maroon
          800: '#561A21',
          900: '#3E1217',
          950: '#280B0F',
        },
        terracotta: {
          50: '#FDF7F3',
          100: '#FBEEE5',
          200: '#F7DCBE',
          300: '#ECC2AB',
          400: '#D58B62',
          500: '#B9653C',  // Exact Client Terracotta
          600: '#A2532E',
          700: '#844023',
          800: '#6D351F',
          900: '#582C1C',
        },
        ivory: {
          50: '#FDFBF8',
          100: '#F7F1E7',  // Exact Client Ivory
          200: '#EFE4D2',
          300: '#E4D4BB',
          400: '#D5BFA0',
          500: '#C3A783',
        },
        gold: {
          50: '#FAF7EE',
          100: '#F4EDD6',
          200: '#EADEAD',
          300: '#DDC980',
          400: '#CAB063',
          500: '#B89551',  // Exact Client Antique Gold
          600: '#9E7B3D',
          700: '#7F5E2F',
          800: '#684C2B',
          900: '#573F26',
        },
        surface: {
          light: '#FFFFFF',
          soft: '#F7F1E7',
          glass: 'rgba(255, 255, 255, 0.90)',
          dark: '#160507',
          'dark-elevated': '#250B0E',
          'dark-glass': 'rgba(22, 5, 7, 0.90)',
        },
        slate: {
          50: '#FAF6F0',   // Warm Royal Ivory background (Exact Client Palette warmth)
          100: '#F4ECE1',  // Soft silk ivory surface
          200: '#E8DCCB',  // Antique ivory border
          700: '#46151B',  // Deep wine slate
          800: '#2C0D12',  // Deep wine maroon
          900: '#1D0609',  // Midnight velvet maroon
          950: '#140406',  // Deep royal maroon obsidian
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(112, 35, 43, 0.08)',
        'glass-hover': '0 12px 40px 0 rgba(112, 35, 43, 0.16)',
        'glow-soft': '0 0 20px rgba(184, 149, 81, 0.25)',
        'glow-brand': '0 0 25px rgba(185, 101, 60, 0.35)',
        'glow-gold': '0 0 25px rgba(184, 149, 81, 0.45)',
        'glow-maroon': '0 0 25px rgba(112, 35, 43, 0.4)',
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
