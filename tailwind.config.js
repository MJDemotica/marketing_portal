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
        navy: {
          900: '#0a1128',
          800: '#0f1a3c',
          700: '#162250',
          600: '#1d2d66',
          500: '#2a3f80',
        },
        brand: {
          50: '#eef2ff',
          100: '#dce5ff',
          200: '#b9cbff',
          300: '#85a5ff',
          400: '#5b82ff',
          500: '#3b63f7',
          600: '#2549db',
          700: '#1d3ab8',
          800: '#1c3296',
          900: '#1c2e76',
        },
        surface: {
          50: '#f8f9fc',
          100: '#f1f3f8',
          200: '#e5e8f0',
          300: '#d1d5e0',
        },
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
        'sidebar': '2px 0 8px 0 rgba(0, 0, 0, 0.15)',
      },
    },
  },
  plugins: [],
}
