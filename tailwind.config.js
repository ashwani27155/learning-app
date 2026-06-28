/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans:    ["Inter", "Mukta", "sans-serif"],
        heading: ["Plus Jakarta Sans", "Inter", "sans-serif"],
        marathi: ["Mukta", "sans-serif"],
      },
      colors: {
        // ── Primary — Purple #7c3aed (violet-600) ───────────
        primary: {
          50:  "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",   // ★ BRAND PURPLE
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065",
        },
        // ── Royal — Rich Purple #a855f7 ──────────────────────
        royal: {
          light:   "#f3e8ff",
          DEFAULT: "#a855f7",
          dark:    "#7e22ce",
        },
        // ── Accent — Gold #f59e0b ────────────────────────────
        accent: {
          50:  "#fffbeb",
          100: "#fef3c7",
          200: "#fde68a",
          300: "#fcd34d",
          400: "#fbbf24",
          500: "#f59e0b",   // ★ GOLD
          600: "#d97706",
          700: "#b45309",
          800: "#92400e",
          900: "#78350f",
        },
        // ── Dark (sidebar, headers) ──────────────────────────
        dark: {
          700: "#1e1b4b",
          800: "#0f0a2e",
          900: "#07050f",
          950: "#030108",
        },
      },
      backgroundImage: {
        "brand-gradient":   "linear-gradient(135deg, #0f0a2e 0%, #5b21b6 60%, #7c3aed 100%)",
        "brand-card":       "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
        "hero-gradient":    "linear-gradient(135deg, #0f0a2e 0%, #4c1d95 40%, #6d28d9 80%, #7c3aed 100%)",
        "royal-gradient":   "linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
        "shimmer-gradient": "linear-gradient(90deg, transparent 0%, rgba(168,85,247,0.15) 50%, transparent 100%)",
        // Backwards-compat aliases
        "phonepe-gradient": "linear-gradient(135deg, #0f0a2e 0%, #5b21b6 60%, #7c3aed 100%)",
        "phonepe-card":     "linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%)",
      },
      boxShadow: {
        "purple-sm": "0 1px 3px rgba(124,58,237,0.12), 0 1px 2px rgba(124,58,237,0.08)",
        "purple-md": "0 4px 16px rgba(124,58,237,0.18), 0 2px 6px rgba(124,58,237,0.10)",
        "purple-lg": "0 8px 32px rgba(124,58,237,0.22), 0 4px 12px rgba(124,58,237,0.12)",
        // Aliases so legacy shadow-blue-* classes keep working
        "blue-sm":   "0 1px 3px rgba(124,58,237,0.12), 0 1px 2px rgba(124,58,237,0.08)",
        "blue-md":   "0 4px 16px rgba(124,58,237,0.18), 0 2px 6px rgba(124,58,237,0.10)",
        "blue-lg":   "0 8px 32px rgba(124,58,237,0.22), 0 4px 12px rgba(124,58,237,0.12)",
        "royal-glow":"0 0 24px rgba(168,85,247,0.4)",
        "gold-glow": "0 0 24px rgba(245,158,11,0.35)",
      },
      animation: {
        "fade-in":     "fadeIn 0.2s ease-out",
        "slide-up":    "slideUp 0.3s ease-out",
        "slide-down":  "slideDown 0.3s ease-out",
        "scale-in":    "scaleIn 0.2s ease-out",
        "shimmer":     "shimmer 1.6s linear infinite",
        "float":       "float 3s ease-in-out infinite",
        "bounce-soft": "bounceSoft 0.45s ease-out",
        "pulse-soft":  "pulseSoft 2s ease-in-out infinite",
        "glow-pulse":  "glowPulse 2.5s ease-in-out infinite",
      },
      keyframes: {
        fadeIn:    { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        slideUp:   { "0%": { transform: "translateY(14px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        slideDown: { "0%": { transform: "translateY(-14px)", opacity: "0" }, "100%": { transform: "translateY(0)", opacity: "1" } },
        scaleIn:   { "0%": { transform: "scale(0.94)", opacity: "0" }, "100%": { transform: "scale(1)", opacity: "1" } },
        shimmer:   { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        float:     { "0%,100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-6px)" } },
        bounceSoft:{ "0%": { transform: "scale(1)" }, "40%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
        pulseSoft: { "0%,100%": { opacity: "1" }, "50%": { opacity: "0.55" } },
        glowPulse: { "0%,100%": { boxShadow: "0 0 0 0 rgba(124,58,237,0)" }, "50%": { boxShadow: "0 0 20px 4px rgba(124,58,237,0.35)" } },
      },
    },
  },
  plugins: [],
};
