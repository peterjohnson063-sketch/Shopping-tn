import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["ui-serif", "Georgia", "Cambria", "Times New Roman", "serif"]
      },
      colors: {
        ivory: "#fbfaf7",
        gold: "#ad8b3a",
        charcoal: "#121212",
        "charcoal-soft": "#1a1a1a",
        everest: {
          DEFAULT: "#6D28D9",
          muted: "#7C3AED",
          deep: "#4C1D95",
          /** Light shell / page canvas (subtle violet tint) */
          canvas: "#F5F3FF",
          /** Search / focus accent (Amazon-style blue) */
          blue: "#007AFF"
        }
      },
      boxShadow: {
        luxe: "0 18px 45px -24px rgba(0,0,0,0.28)"
      }
    }
  },
  plugins: []
};

export default config;
