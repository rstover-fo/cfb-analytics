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
      // Layered shadows per Vercel guidelines (ambient + direct light)
      boxShadow: {
        'layered-sm': '0 1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.08)',
        'layered-md': '0 2px 4px rgba(0, 0, 0, 0.04), 0 4px 6px rgba(0, 0, 0, 0.08)',
        'layered-lg': '0 4px 6px rgba(0, 0, 0, 0.04), 0 10px 15px rgba(0, 0, 0, 0.08)',
        'layered-xl': '0 8px 10px rgba(0, 0, 0, 0.04), 0 20px 25px rgba(0, 0, 0, 0.08)',
      },
      // Focus ring configuration
      ringColor: {
        DEFAULT: '#1e3a8a',
      },
      ringOffsetColor: {
        DEFAULT: '#ffffff',
        dark: '#111827',
      },
    },
  },
  plugins: [],
}
