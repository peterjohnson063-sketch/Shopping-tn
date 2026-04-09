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
        gold: "#ad8b3a"
      },
      boxShadow: {
        luxe: "0 18px 45px -24px rgba(0,0,0,0.28)"
      }
    }
  },
  plugins: []
};

export default config;
