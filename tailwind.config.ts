import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        body:    ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",

        // PRIMARIA — Pink Peony (a estrela do show)
        pink: {
          50:  '#FFF0F3',
          100: '#FFE0E8',
          200: '#FFC2D4',
          300: '#FF99B8',
          400: '#F472A0',   // original pink-peony
          500: '#FF3366',   // CTA principal
          600: '#E6004C',
          700: '#CC0044',
          800: '#990033',
          900: '#660022',
        },

        // SECONDARY — Ever Green (confiança, confirmação)
        green: {
          50:  '#E8F5F4',
          100: '#D0EBE9',
          200: '#A3D6D2',
          300: '#5FAFA8',
          400: '#2D8A84',
          500: '#1B5E5A',   // original ever-green
          600: '#164D4A',
          700: '#103B39',
          800: '#0B2A28',
          900: '#071A19',
        },

        // ACCENT — Wedding Band Gold
        gold: {
          50:  '#FFF9ED',
          100: '#FFF0D4',
          200: '#FFE0A8',
          300: '#FFCC70',
          400: '#D4A843',   // original wedding-band
          500: '#C4922A',
          600: '#A37520',
          700: '#7D5918',
          800: '#5C4012',
          900: '#3D2A0C',
        },

        // NEUTRAL — Silver
        silver: {
          50:  '#FAFAFA',
          100: '#F5F5F5',
          200: '#E8E8E8',   // original silver-platter
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },

        // INFO — Something Blue
        blue: {
          50:  '#F0F7F9',
          100: '#DFF0F3',
          200: '#C0E0E6',
          300: '#A8C5CC',   // original something-blue
          400: '#7FADB8',
          500: '#5A95A3',
          600: '#457A87',
          700: '#335D68',
          800: '#234148',
          900: '#162A30',
        },
      },
      borderRadius: {
        'sm':  '8px',
        'md':  '12px',
        'lg':  '16px',
        'xl':  '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft':    '0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
        'card':    '0 4px 12px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)',
        'float':   '0 12px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.04)',
        'pink':    '0 8px 24px rgba(255,51,102,0.20)',
        'pink-sm': '0 4px 12px rgba(255,51,102,0.15)',
      },
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },
      animation: {
        'shimmer':    'shimmer 1.5s ease-in-out infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':   'scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-pink': 'pulsePink 2s ease-in-out infinite',
        'float':      'float 3s ease-in-out infinite',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(24px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          from: { opacity: '0', transform: 'scale(0.9)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        pulsePink: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,51,102,0.3)' },
          '50%':      { boxShadow: '0 0 0 12px rgba(255,51,102,0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-8px)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
