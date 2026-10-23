/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        wordle: {
          dark: '#121213',
          card: '#1a1a1b',
          elevated: '#242427',
          border: '#3a3a3c',
          borderLight: '#565758',
          green: '#538d4e',
          greenHover: '#5ea258',
          yellow: '#b59f3b',
          yellowHover: '#c7ae41',
          gray: '#3a3a3c',
          keyDefault: '#818384',
          keyDark: '#4a4a4d',
          text: '#ffffff',
          subtext: '#9ca3af',
        },
      },
      animation: {
        'pop': 'pop 0.1s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'flip-in': 'flipIn 0.25s ease-in forwards',
        'flip-out': 'flipOut 0.25s ease-out forwards',
        'bounce-soft': 'bounceSoft 0.6s ease-in-out infinite alternate',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(0.8)' },
          '50%': { transform: 'scale(1.12)' },
          '100%': { transform: 'scale(1.0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-5px)' },
          '40%, 80%': { transform: 'translateX(5px)' },
        },
        flipIn: {
          '0%': { transform: 'rotateX(0deg)' },
          '100%': { transform: 'rotateX(90deg)' },
        },
        flipOut: {
          '0%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        bounceSoft: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-6px)' },
        },
      },
    },
  },
  plugins: [],
};
