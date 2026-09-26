/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#070A0E',
          900: '#0B0E14',
          850: '#10151E',
          800: '#161D2A',
          750: '#1D2637',
          700: '#253046',
          600: '#344360'
        },
        business: {
          auto: '#F59E0B',      // Automotora CARVLAK (Ámbar)
          autoDark: '#B45309',
          autoLight: '#FDE68A',
          detail: '#8B5CF6',    // DetailVlak (Violeta)
          detailDark: '#6D28D9',
          detailLight: '#DDD6FE',
          inspect: '#10B981',   // Inspección Vehicular (Esmeralda)
          inspectDark: '#047857',
          inspectLight: '#A7F3D0'
        },
        gold: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          700: '#A16207'
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['"Instrument Sans"', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
};
