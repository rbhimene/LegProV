/** Design tokens come from CSS variables in src/index.css (light/dark). */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: { sans: ['"Inter Variable"', 'system-ui', 'sans-serif'] },
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        border: token('border'),
        text: token('text'),
        muted: token('muted'),
        primary: token('primary'),
        'primary-fg': token('primary-fg'),
        danger: token('danger'),
        success: token('success'),
      },
    },
  },
  plugins: [],
};