/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Archivo Black', 'Impact', 'sans-serif'],
      },
      colors: {
        open: {
          bg: 'var(--color-open-bg)',
          surface: 'var(--color-open-surface)',
          light: 'var(--color-open-light)',
          border: 'var(--color-open-border)',
          dark: 'var(--color-brand-primary)',
          primary: 'var(--color-brand-primary)',
          ink: 'var(--color-brand-primary)',
          muted: 'var(--color-open-muted)',
        },
      },
    },
  },
  plugins: [],
}
