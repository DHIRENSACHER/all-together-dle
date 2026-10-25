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
          subtext: '#818384',
        },
      },
      animation: {
        'pop': 'pop 0.1s ease-in-out',
        'shake': 'shake 0.5s ease-in-out',
        'flip': 'flip 0.5s ease-in-out forwards',
        'win-bounce': 'winBounce 1s ease-in-out forwards',
      },
      keyframes: {
        pop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.14)' },
          '100%': { transform: 'scale(1.0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 90%': { transform: 'translateX(-2px)' },
          '20%, 80%': { transform: 'translateX(3px)' },
          '30%, 50%, 70%': { transform: 'translateX(-5px)' },
          '40%, 60%': { transform: 'translateX(5px)' },
        },
        flip: {
          '0%': { transform: 'rotateX(0deg)' },
          '50%': { transform: 'rotateX(90deg)' },
          '100%': { transform: 'rotateX(0deg)' },
        },
        winBounce: {
          '0%, 20%': { transform: 'translateY(0)' },
          '40%': { transform: 'translateY(-24px)' },
          '50%': { transform: 'translateY(0)' },
          '60%': { transform: 'translateY(-10px)' },
          '80%, 100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
