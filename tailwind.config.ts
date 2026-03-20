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
        background: "var(--background)",
        foreground: "var(--foreground)",
        "ever-green": "#1B5E5A",
        "pink-peony": "#F472A0",
        "silver-platter": "#E8E8E8",
        "wedding-band": "#D4A843",
        "something-blue": "#A8C5CC",
      },
    },
  },
  plugins: [],
};
export default config;
