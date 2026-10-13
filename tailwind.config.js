/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Restrained palette: warm neutrals + one deep crimson accent
        ink: {
          50: "#faf9f8",
          100: "#f4f2f0",
          200: "#e7e2de",
          300: "#d5cdc6",
          400: "#b8aba1",
          500: "#97887d",
          600: "#7c6f65",
          700: "#665b52",
          800: "#574d45",
          900: "#4a423b",
        },
        crimson: {
          50: "#fdf2f3",
          100: "#fbe4e6",
          200: "#f7cdd1",
          300: "#f1a6ae",
          400: "#e77481",
          500: "#d94f60",
          600: "#b91c2e",
          700: "#9c1628",
          800: "#841625",
          900: "#701623",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
