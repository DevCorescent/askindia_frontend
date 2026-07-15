/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Primary brand: AskIndia Navy
        brand: {
          50:  '#eef2ff',
          100: '#dde4ff',
          200: '#c3ccfe',
          300: '#a1aefd',
          400: '#7c8efb',
          500: '#4a6be8',  // medium – focus rings, highlights
          600: '#2c4fd8',  // active links
          700: '#1a38b8',  // dark
          800: '#0f2490',  // very dark navy
          900: '#0d1f6e',  // sidebar background (deepest navy)
        },
        // Accent: AskIndia Orange
        accent: {
          50:  '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',  // primary orange (logo orange)
          600: '#ea6a00',  // button hover
          700: '#c2540a',
          800: '#9a3b12',
          900: '#7c2d12',
        },
      },
      animation: {
        'fade-in':  'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
