/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'cfb-primary': '#1e3a8a',
        'cfb-secondary': '#dc2626',
        'cfb-accent': '#f59e0b',
      },
    },
  },
  plugins: [],
}
