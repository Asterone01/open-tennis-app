/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        open: {
          bg: '#fafafa',
          surface: '#ffffff',
          light: '#e4e4e7',
          border: '#e4e4e7',
          ink: '#09090b',
          muted: '#71717a',
        },
      },
    },
  },
  plugins: [],
}
