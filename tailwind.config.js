/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Phantom brand palette
        phantom: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d6ff",
          300: "#a5b8ff",
          400: "#7a8eff",
          500: "#4f62f5",
          600: "#3a47e8",
          700: "#2e39ce",
          800: "#2831a6",
          900: "#252d83",
          950: "#171b4e",
        },
        // Status colours matching the spec
        status: {
          blue:   "#3b82f6",
          white:  "#e2e8f0",
          yellow: "#eab308",
          purple: "#a855f7",
          green:  "#22c55e",
          red:    "#ef4444",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-in-out",
        "slide-in": "slideIn 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
