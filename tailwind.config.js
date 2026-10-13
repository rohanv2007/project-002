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
        // FixMyCampus editorial system, crimson accent for Raktha
        paper: "#f6f1e5",
        cream: "#fcf9f1",
        sand: "#ebe1cb",
        line: "#dcd0b4",
        ink: "#1d1710",
        soot: "#57503f",
        faint: "#7a6d54",
        signal: "#c93e1c",
        ember: "#a82f12",
        moss: "#2f6e4e",
        gold: "#96690a",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-grotesk)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
