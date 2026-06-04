import type { Config } from "tailwindcss";

/* RaveRadar design tokens — mirrors the static site's CSS variables so the
   exact look is preserved while Tailwind handles utility-level styling. */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        black: "#050608",
        "black-2": "#0A0B11",
        anthracite: { DEFAULT: "#12131B", 2: "#181A24" },
        line: { DEFAULT: "#23252F", soft: "rgba(255,255,255,.06)" },
        blue: "#2F7BFF",
        violet: "#8B5CFF",
        magenta: "#FF2D9B",
        cyan: "#19E7FF",
        acid: "#C6FF3D",
        white: "#F3F3F8",
        grey: { DEFAULT: "#A7A9B8", 2: "#6E7081", 3: "#44464F" },
      },
      fontFamily: {
        display: ["var(--font-syne)", "sans-serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-space-mono)", "monospace"],
      },
      borderRadius: {
        sm: "10px",
        md: "16px",
        lg: "24px",
        xl: "32px",
      },
      backgroundImage: {
        "grad-main":
          "linear-gradient(115deg, #2F7BFF 0%, #8B5CFF 48%, #FF2D9B 100%)",
        "grad-text":
          "linear-gradient(95deg, #fff 0%, #cfd2ff 40%, #FF2D9B 100%)",
      },
      boxShadow: {
        "glow-violet": "0 0 40px rgba(139,92,255,.45)",
        "glow-magenta": "0 0 40px rgba(255,45,155,.40)",
        card: "0 20px 50px -20px rgba(0,0,0,.8)",
      },
      maxWidth: { wrap: "1280px" },
    },
  },
  plugins: [],
};

export default config;
