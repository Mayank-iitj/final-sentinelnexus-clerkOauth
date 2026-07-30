import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        body: ["var(--font-barlow)", "system-ui", "sans-serif"],
        heading: ["var(--font-instrument)", "serif"],
        display: ["var(--font-space-grotesk)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "9999px",
      }
    },
  },
  plugins: [],
};

export default config;
