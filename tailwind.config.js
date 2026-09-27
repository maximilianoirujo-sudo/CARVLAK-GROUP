/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Oficial Clara CARVLAK Group
        canvas: '#F5F5F4',
        surface: '#FFFFFF',
        'border-subtle': '#E5E5E3',
        'border-strong': '#D0D0CD',
        'text-primary': '#161616',
        'text-secondary': '#6B6B6B',
        'text-muted': '#9A9A9A',
        'brand-black': '#000000',
        'accent-red': '#D7141A',
        'accent-red-hover': '#B80E14',
        'plate-blue': '#002B7A',

        // Estados de inspección
        'status-success-bg': '#EEF7F2',
        'status-success-text': '#1E6B43',
        'status-warning-bg': '#FEF7EC',
        'status-warning-text': '#945B0E',
        'status-danger-bg': '#FDF2F2',
        'status-danger-text': '#B80E14',

        // Estados operativos
        'status-op-bg': '#EBEBEA',
        'status-op-text': '#161616',

        // Mapeos de compatibilidad semántica hacia el tema claro
        negro: '#000000',
        panel: '#FFFFFF',
        borde: '#E5E5E3',
        'gris-texto': '#6B6B6B',
        blanco: '#FFFFFF',
        rojo: {
          DEFAULT: '#D7141A',
          hover: '#B80E14',
          dark: '#B80E14',
          light: '#EF4444'
        },
        carvlak: {
          black: '#000000',
          white: '#FFFFFF',
          red: '#D7141A',
          grayBg: '#F5F5F4',
          grayBorder: '#E5E5E3',
          grayText: '#6B6B6B',
          darkBg: '#F5F5F4',
          darkCard: '#FFFFFF',
          darkBorder: '#E5E5E3'
        }
      },
      borderRadius: {
        none: '0px',
        sm: '4px',
        DEFAULT: '6px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        '2xl': '12px',
        '3xl': '16px',
        full: '9999px'
      },
      boxShadow: {
        subtle: '0 2px 4px rgba(0, 0, 0, 0.03)',
        card: '0 1px 3px rgba(0, 0, 0, 0.02)',
        modal: '0 12px 32px rgba(22, 22, 22, 0.08)'
      },
      fontFamily: {
        title: ['"Archivo Narrow"', 'system-ui', 'sans-serif'],
        display: ['"Archivo Narrow"', 'system-ui', 'sans-serif'],
        plate: ['"Archivo Narrow"', 'system-ui', 'sans-serif'],
        sans: ['"Barlow Condensed"', 'system-ui', '-apple-system', 'sans-serif'],
        body: ['"Barlow Condensed"', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
};
