/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Safelist for FAB inline styles to prevent purging
    {
      pattern: /bg-#[0-9a-fA-F]{3,6}/,
      variants: ['hover:', 'focus:'],
    },
    {
      pattern: /#[0-9a-fA-F]{3,6}/,
      variants: ['hover:', 'focus:'],
    },
    // Safelist for position and z-index
    'fixed',
    'z-\\[\\d+\\]',
    // Safelist for FAB specific styles
    'bottom-8',
    'right-8',
    'hover:scale-110',
    'transition-transform',
    'cursor-pointer',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
