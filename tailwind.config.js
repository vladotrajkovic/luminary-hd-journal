/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#03020A',
        'deep-space': '#080618',
        nebula: '#0F0A2E',
        'cosmic-purple': '#1A0A3E',
        'star-dust': '#2D1B69',
        aurora: '#4C2A9E',
        violet: '#7B4FD4',
        lavender: '#A78BFA',
        'pale-violet': '#C4B5FD',
        moonlight: '#EDE9FE',
        starlight: '#F5F3FF',
        gold: '#D4AF37',
      },
      fontFamily: {
        display: ['Cinzel', 'serif'],
        body: ['Cormorant Garamond', 'serif'],
        ui: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
