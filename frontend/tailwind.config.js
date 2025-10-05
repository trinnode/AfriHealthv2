/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        afrihealth: {
          black: "#000000",
          orange: "#FF6B35",
          green: "#4A5F3A",
          red: "#D62828",
        },
      },
      fontFamily: {
        lora: ["Lora", "serif"],
        mono: ["Space Mono", "monospace"],
      },
    },
  },
  plugins: [],
};
