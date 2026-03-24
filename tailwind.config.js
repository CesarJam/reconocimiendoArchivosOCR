/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // <- Esto le dice a Tailwind que lea tus archivos .vue
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}