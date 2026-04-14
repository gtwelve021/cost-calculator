/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'sans-serif'],
        body: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 18px 45px -28px rgba(16, 19, 26, 0.45)',
      },
      colors: {
        ink: '#10131a',
        slate: '#626b7b',
        primary: '#111111',
      },
    },
  },
  plugins: [],
}
