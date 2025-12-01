/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#183154',
        'primary-light': '#2a4a6b',
        'primary-dark': '#0f1f35',
        secondary: '#4B4F54',
        'light-gray': '#D3D6DB',
        'custom-white': '#FFFFFF',
      },
      fontFamily: {
        'sans': ['Poppins', 'sans-serif'],
        'heading': ['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
