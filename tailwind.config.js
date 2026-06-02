/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#007D71",
          light: "#009688",
          dark: "#025D53",
        },
        secondary: {
          DEFAULT: "#F5F5F5",
          dark: "#E8E8E8",
        },
        accent: {
          DEFAULT: "#C4743F",
          hover: "#A85D30",
        },
        "brand-bg": "#F5F5F5",
        "text-body": "#555555",
        "text-heading": "#000000",
        brown: {
          DEFAULT: "#3D5A56",
          light: "#4E7A75",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
        serif: ["var(--font-cormorant)", "Cormorant Garamond", "serif"],
        mono: ["var(--font-inter)", "monospace"],
        number: ["var(--font-number)", "Space Grotesk", "sans-serif"],
      },
    },
  },
  plugins: [],
};
