/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'media',
  theme: {
    extend: {
      colors: {
        negro: '#000000',
        panel: '#141414',
        borde: '#2A2A2A',
        'gris-texto': '#8A8A8A',
        blanco: '#FFFFFF',
        rojo: {
          DEFAULT: '#D7141A',
          hover: '#B51015',
          dark: '#8C0B0F',
          light: '#EF4444'
        },
        carvlak: {
          black: '#000000',
          white: '#FFFFFF',
          red: '#D7141A',
          grayBg: '#141414',
          grayBorder: '#2A2A2A',
          grayText: '#8A8A8A',
          darkBg: '#000000',
          darkCard: '#141414',
          darkBorder: '#2A2A2A'
        },
        // Mapear slate/dark hacia el tema sobrio blanco/negro/panel/borde
        slate: {
          950: '#000000',
          900: '#141414',
          850: '#141414',
          800: '#2A2A2A',
          700: '#333333',
          600: '#555555',
          500: '#8A8A8A',
          400: '#8A8A8A',
          300: '#D9D9D9',
          200: '#E5E5E5',
          100: '#F2F2F2',
          50: '#FFFFFF'
        },
        dark: {
          950: '#000000',
          900: '#141414',
          850: '#141414',
          800: '#2A2A2A',
          750: '#2A2A2A',
          700: '#333333',
          600: '#555555'
        }
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '8px',
        '2xl': '8px',
        '3xl': '8px',
        full: '9999px'
      },
      fontFamily: {
        title: ['"Archivo"', 'system-ui', 'sans-serif'],
        display: ['"Archivo"', 'system-ui', 'sans-serif'],
        sans: ['"Barlow"', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
};
