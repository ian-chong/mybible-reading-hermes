/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#78716C',
        'on-primary': '#FFFFFF',
        secondary: '#92400E',
        'on-secondary': '#FFFFFF',
        accent: '#D97706',
        'on-accent': '#000000',
        background: '#FFFBEB',
        foreground: '#0F172A',
        card: '#FFFFFF',
        'card-foreground': '#0F172A',
        muted: '#F6F6F6',
        'muted-foreground': '#475569',
        border: '#EEEDED',
        destructive: '#DC2626',
        'on-destructive': '#FFFFFF',
        ring: '#78716C',
      },
      fontFamily: {
        sans: ['Helvetica Neue', 'Helvetica', 'Arial', 'sans-serif'],
        serif: ['Cormorant Garamond', 'Cormorant Upright', 'Georgia', 'serif'],
        display: ['Cinzel', 'serif'],
      },
    },
  },
  plugins: [],
}