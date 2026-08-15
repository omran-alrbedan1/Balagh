/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        base: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          900: '#0F172A',
        },
        danger: {
          50: '#FEF2F2',
          600: '#DC2626',
          700: '#B91C1C',
        },
        primary: {
          50: '#F1F5FA',
          100: '#E0E8F3',
          200: '#C1D0E5',
          300: '#97B0CE',
          400: '#5E87B0',
          500: '#2D5C8C',
          600: '#082248',
          700: '#071E40',
          800: '#061A38',
          900: '#041630',
          950: '#030F22',
        },
        success: {
          50: '#F0FDF4',
          600: '#16A34A',
          700: '#15803D',
        },
        surface: {
          light: '#F8FAFC',
          DEFAULT: '#FFFFFF',
        },
        teal: {
          50: '#E0F5F5',
          100: '#B3E7E8',
          200: '#80D7D9',
          300: '#4DC4C9',
          400: '#26B0B6',
          500: '#009199',
          600: '#007A80',
          700: '#00666B',
          800: '#004F54',
          900: '#00393D',
        },
        warning: {
          50: '#FFFBEB',
          600: '#D97706',
        },
      },
      fontFamily: {
        sans: ['System'],
      },
    },
  },
  plugins: [],
};
