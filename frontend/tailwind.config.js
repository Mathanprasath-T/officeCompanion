/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#E2E8F0',
          400: '#CBD5E1',
          500: '#94A3B8',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD4FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#7C5CFC',
          600: '#6D44F7',
          700: '#5B2EE5',
          800: '#4C1D95',
          900: '#33136A',
        },
        ink: {
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(30, 27, 46, 0.04), 0 4px 16px -4px rgba(30, 27, 46, 0.04)',
        'card': '0 1px 3px 0 rgba(30, 27, 46, 0.02), 0 4px 12px -2px rgba(30, 27, 46, 0.04)',
        'dropdown': '0 10px 25px -5px rgba(30, 27, 46, 0.08), 0 8px 10px -6px rgba(30, 27, 46, 0.04)',
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      }
    },
  },
  plugins: [],
}
