/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Sora', 'Manrope', 'ui-sans-serif', 'system-ui'],
        body: ['Manrope', 'Segoe UI', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 18px 45px -28px rgba(16, 19, 26, 0.45)',
      },
      colors: {
        ink: '#10131a',
        slate: '#626b7b',
        primary: '#d6a456',
      },
    },
  },
  plugins: [],
}
