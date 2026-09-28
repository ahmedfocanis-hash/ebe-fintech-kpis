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
        'spruce-abyss': '#00191c',
        'spruce-900': '#032125',
        'spruce-700': '#0b363b',
        'spruce-500': '#437278',
        'spruce-200': '#a1c2c6',
        'spruce-mist': '#354d51',
        'charcoal-100': '#ebebeb',
        'charcoal-mist': '#fafafa',
        'cream-warm': '#fffcf6',
        'pure-white': '#ffffff',
        'verdant-300': '#abffae',
        'verdant-whisper': '#eafde8',
        'wave-700': '#123a88',
        'wave-500': '#0a6de6',
        'wave-frost': '#e2f4ff',
        'zest-700': '#863d1c',
        'zest-blush': '#fdf0e9',
        'mustard-700': '#83611c',
      },
      fontWeight: {
        '300': '300',
        '400': '400',
        '475': '475',
        '500': '500',
        '600': '600',
        '700': '700',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        'none': '0',
        'DEFAULT': '2px',
        'sm': '2px',
        'md': '2px',
        'lg': '2px',
        'xl': '2px',
        '2xl': '2px',
        '3xl': '2px',
        'avatar': '6px',
        'full': '9999px',
      },
      boxShadow: {
        none: 'none',
        'glow-verdant': '0px 0px 0px 4px #abffae',
        'glow-dark': '0px 0px 0px 4px #0b363b',
        'glow-wave': '0px 0px 0px 4px #e2f4ff',
        'glow-zest': '0px 0px 0px 4px #fdf0e9',
      }
    },
  },
  plugins: [],
}
