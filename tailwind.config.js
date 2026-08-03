/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./public/**/*.{ejs,html}'],
  safelist: ['avian-item-active', 'avian-item-hover'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },


    }
  },
  plugins: []
};
