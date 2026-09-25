/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
      },
      colors: {
        bible: {
          50: '#fdf6e3',
          100: '#f8eece',
          200: '#f1e5b9',
          300: '#e9dca3',
          400: '#e1d48d',
          500: '#d9cc77',
          600: '#c0b55e',
          700: '#a79e4a',
          800: '#8e873b',
          900: '#75702f',
        },
      },
    },
  },
  plugins: [],
}