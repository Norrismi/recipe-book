import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm, inviting cookbook palette
        cream: "#FDF8F3",
        sage: {
          50: "#F4F7F4",
          100: "#E4EBE4",
          200: "#C5D4C5",
          300: "#9BB69B",
          400: "#6E936E",
          500: "#4A6F4A",
          600: "#3A5A3A",
          700: "#2E472E",
          800: "#263A26",
          900: "#1F2F1F",
        },
        spice: {
          50: "#FEF7F0",
          100: "#FDEBD9",
          200: "#FAD4B2",
          300: "#F6B680",
          400: "#F1914D",
          500: "#EC7426",
          600: "#DD5A1B",
          700: "#B74418",
          800: "#92381B",
          900: "#763019",
        },
        terracotta: "#C4704F",
        parchment: "#F5EEE6",
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        "card": "0 2px 8px -2px rgba(0, 0, 0, 0.1), 0 4px 16px -4px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 8px 24px -4px rgba(0, 0, 0, 0.12), 0 12px 32px -8px rgba(0, 0, 0, 0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
