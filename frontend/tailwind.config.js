/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        body: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
      },
      colors: {
        // CivyX Deep Intelligence Framework — M3 Palette
        'bg-deep':        '#061425',
        'surface':        '#061425',
        'surface-low':    '#0F1C2E',
        'surface-mid':    '#132032',
        'surface-high':   '#1E2A3D',
        'surface-top':    '#293548',
        'primary':        '#4CD6FB',
        'primary-dim':    '#00B4D8',
        'primary-cnt':    '#002832',
        'secondary':      '#ADC8F5',
        'secondary-cnt':  '#2F4A70',
        'tertiary':       '#B0C8EB',
        'on-surface':     '#D6E3FC',
        'on-primary':     '#003642',
        'outline':        '#8E9198',
        'outline-var':    '#43474D',
      },
      borderRadius: {
        DEFAULT: '8px',
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
    },
  },
  plugins: [],
};
