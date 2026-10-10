/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        civic: {
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fb',
          400: '#38abf7',
          500: '#0e8fe9',
          600: '#0270c7',
          700: '#0359a1',
          800: '#074c85',
          900: '#0b406e',
          950: '#072849'
        }
      }
    },
  },
  plugins: [],
}
