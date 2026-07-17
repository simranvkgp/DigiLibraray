/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "var(--color-navy)",
        brandred: "var(--color-brandred)",
        accentblue: "var(--color-accentblue)",
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        background: "var(--color-background)",
        card: "var(--color-card)",
        border: "var(--color-border)",
        "text-primary": "var(--color-text-primary)",
        "text-secondary": "var(--color-text-secondary)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-ibm-plex-mono)", "monospace"],
      },
      borderRadius: {
        DEFAULT: "0.75rem",
        lg: "1rem",
        xl: "1.25rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(17, 24, 39, 0.06), 0 1px 2px -1px rgba(17, 24, 39, 0.06)",
        "card-hover": "0 4px 12px -2px rgba(17, 24, 39, 0.10)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
