/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.tsx", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        pageBg: 'var(--color-pageBg)',
        card: 'var(--color-card)',
        text: 'var(--color-text)',
        secondaryText: 'var(--color-secondaryText)',
        border: 'var(--color-border)',
        accent: 'var(--color-accent)',
        accentText: 'var(--color-accentText)',
        gold: 'var(--color-gold)',
        danger: 'var(--color-danger)',
      }
    },
  },
  plugins: [],
}
