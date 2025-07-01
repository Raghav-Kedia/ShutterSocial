/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff1f2',   // lightest pink
          100: '#ffe4e6',  // soft pink
          200: '#fecdd3',  // light peach-pink
          300: '#fda4af',  // peachy pink
          400: '#fb7185',  // vibrant pink
          500: '#f43f5e',  // main pink
          600: '#e11d48',  // deep pink
          700: '#be123c',  // dark pink
          800: '#9f1239',  // berry pink
          900: '#881337',  // darkest pink
        }
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} 