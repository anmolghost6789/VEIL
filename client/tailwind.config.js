/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#090909',
          900: '#090909',
          800: '#121212',
          700: '#1a1a1a',
          600: '#262626',
          500: '#383838'
        },
        offwhite: {
          DEFAULT: '#F1EFE6',
          dark: '#E2DFD2',
          muted: '#C4C0B0'
        },
        acid: {
          DEFAULT: '#B6FF00',
          hover: '#9ee000',
          dim: '#233200'
        },
        cyber: {
          DEFAULT: '#00E5FF',
          dim: '#00373d'
        },
        magenta: {
          DEFAULT: '#FF00A8',
          dim: '#3d0028'
        },
        warning: {
          DEFAULT: '#FFE600',
          dim: '#3d3700'
        },
        danger: {
          DEFAULT: '#FF3030',
          dim: '#3d0b0b'
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Space Mono"', 'ui-monospace', 'monospace'],
        display: ['"Syne"', '"Space Grotesk"', 'system-ui', 'sans-serif'],
        technical: ['"JetBrains Mono"', 'monospace']
      },
      boxShadow: {
        'brutal': '3px 3px 0px #090909',
        'brutal-lg': '6px 6px 0px #090909',
        'brutal-acid': '4px 4px 0px #B6FF00',
        'brutal-cyber': '4px 4px 0px #00E5FF',
        'brutal-magenta': '4px 4px 0px #FF00A8',
        'brutal-white': '3px 3px 0px #F1EFE6',
        'brutal-white-lg': '6px 6px 0px #F1EFE6',
      },
      borderWidth: {
        '3': '3px',
      },
      animation: {
        'blink': 'blink 1s step-start infinite',
        'glitch': 'glitch 0.3s ease-in-out',
        'scanline': 'scanline 8s linear infinite',
        'pulse-warning': 'pulseWarning 1s ease-in-out infinite',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0' },
        },
        glitch: {
          '0%': { transform: 'translate(0)' },
          '20%': { transform: 'translate(-2px, 2px)' },
          '40%': { transform: 'translate(-2px, -2px)' },
          '60%': { transform: 'translate(2px, 2px)' },
          '80%': { transform: 'translate(2px, -2px)' },
          '100%': { transform: 'translate(0)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        pulseWarning: {
          '0%, 100%': { borderColor: '#FFE600', backgroundColor: 'rgba(255, 230, 0, 0.1)' },
          '50%': { borderColor: '#FF3030', backgroundColor: 'rgba(255, 48, 48, 0.2)' },
        }
      }
    },
  },
  plugins: [],
}
