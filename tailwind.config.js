export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        slate: {
          950: "#0f172a",
          900: "#1a202c",
          800: "#2d3748",
          700: "#404854",
          600: "#64748b",
          400: "#a0aec0",
          200: "#cbd5e1",
          100: "#e2e8f0",
        },
        cyan: {
          500: "#06b6d4",
          400: "#22d3ee",
        },
        amber: {
          500: "#f59e0b",
          600: "#d97706",
        },
        red: {
          500: "#ef4444",
          600: "#dc2626",
        },
        green: {
          500: "#10b981",
          600: "#059669",
        },
      },
      fontFamily: {
        mono: ["IBM Plex Mono", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 20px rgba(6, 182, 212, 0.3)",
        "glow-red": "0 0 20px rgba(239, 68, 68, 0.3)",
        "glow-amber": "0 0 20px rgba(245, 158, 11, 0.3)",
      },
    },
  },
  plugins: [],
}
