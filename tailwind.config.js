export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#101D32",
          800: "#162544",
          900: "#0b1526",
        },
        ivory: "#F6F2E9",
        gold: "#C6A36A",
        slate: "#667C86",
        terracotta: "#B76C58",
        sage: "#6F9289",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
