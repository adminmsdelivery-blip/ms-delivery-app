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
    extend: {
      fontSize: {
        'fluid-sm': 'clamp(0.8rem, 0.17vw + 0.76rem, 0.89rem)',
        'fluid-base': 'clamp(1rem, 0.34vw + 0.91rem, 1.19rem)',
        'fluid-lg': 'clamp(1.25rem, 0.61vw + 1.1rem, 1.58rem)',
        'fluid-xl': 'clamp(1.56rem, 1vw + 1.31rem, 2.11rem)',
        'fluid-2xl': 'clamp(1.95rem, 1.56vw + 1.56rem, 2.81rem)',
      }
    }
  },
  plugins: [],
}
