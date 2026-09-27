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
        carvlak: {
          black: '#000000',
          white: '#FFFFFF',
          red: '#D7141A',
          grayBg: '#F2F2F2',
          grayBorder: '#D9D9D9',
          grayText: '#6B6B6B',
          darkBg: '#000000',
          darkCard: '#161616',
          darkBorder: '#2A2A2A'
        },
        // Grises auxiliares para compatibilidad
        slate: {
          950: '#000000',
          900: '#111111',
          850: '#161616',
          800: '#222222',
          700: '#333333',
          600: '#555555',
          500: '#6B6B6B',
          400: '#888888',
          300: '#AAAAAA',
          200: '#D9D9D9',
          100: '#F2F2F2',
          50: '#FAFAFA'
        },
        dark: {
          950: '#000000',
          900: '#111111',
          850: '#161616',
          800: '#222222',
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
