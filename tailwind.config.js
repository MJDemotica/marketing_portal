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
          900: '#1A2634', // Midnight Cyan
          800: '#123765', // Prussian Blue
          700: '#1a467c', // Prussian Blue accent
          600: '#3E5E72', // Secondary Dark Slate
          500: '#365794', // Secondary Deep Royal Blue
        },
        brand: {
          50: '#fdfbf2',
          100: '#faf4db',
          200: '#f7ecc3',
          300: '#f3e49e',
          400: '#EBD47A', // Secondary Soft Gold
          500: '#CCAA49', // Laurel Gold (Primary Brand Accent)
          600: '#b8963b', // Darker Laurel Gold
          700: '#96782c',
          800: '#123765', // Prussian Blue
          900: '#1A2634', // Midnight Cyan
        },
        stlaf: {
          midnight: '#1A2634',
          gold: '#CCAA49',
          prussian: '#123765',
          softGold: '#EBD47A',
          cyan: '#5F98B6',
          slate: '#3E5E72',
          mutedBlue: '#6492B1',
          royal: '#365794',
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
