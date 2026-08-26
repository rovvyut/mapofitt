/** @type {import('tailwindcss').Config} */
/**
 * MAPO — charcoal ground, cream ink, one accent.
 *
 * There are no gradient utilities in this config on purpose. Depth is made
 * with value contrast, hairline rules and whitespace, not with blur or glow.
 * The `mapo.*` key names are inherited from the previous palette so that
 * existing class strings across the app resolve to the new colours instead of
 * needing a hundred find-and-replaces.
 */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        display: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
        body: ["Archivo", "Helvetica Neue", "Arial", "sans-serif"],
      },
      colors: {
        mapo: {
          // Ground and surfaces — warm charcoal, never pure black.
          bg: "#0C0B0A",
          ink: "#0C0B0A",
          surface: "#141210",
          raised: "#1C1916",

          // Ink on that ground.
          cream: "#F5F1EA",
          muted: "#8F877C",

          // The single accent.
          accent: "#E9B949",
          yellow: "#E9B949",
          emerald: "#E9B949",
          emeraldb: "#E9B949",
          cyan: "#E9B949",
          cyanb: "#F5F1EA",

          // Data-only colours. These belong to food and macro readouts,
          // never to page chrome.
          tomato: "#E2231A",
          orange: "#E2231A",
          orangeb: "#C96A1B",
          amber: "#C96A1B",
          lime: "#C96A1B",
          black: "#0C0B0A",
        },
      },
      fontSize: {
        // Editorial display sizes. Fluid so the headline is the same
        // gesture on a phone as on a 27" screen.
        "display-sm": ["clamp(2.6rem, 11vw, 4.5rem)", { lineHeight: "0.88", letterSpacing: "-0.035em" }],
        "display-md": ["clamp(3.4rem, 13vw, 7rem)", { lineHeight: "0.86", letterSpacing: "-0.04em" }],
        "display-lg": ["clamp(4rem, 16vw, 11rem)", { lineHeight: "0.84", letterSpacing: "-0.045em" }],
        // Numbers get their own scale — they carry the meaning here.
        "num-sm": ["clamp(1.6rem, 5vw, 2.2rem)", { lineHeight: "1", letterSpacing: "-0.03em" }],
        "num-md": ["clamp(2.4rem, 8vw, 4rem)", { lineHeight: "0.95", letterSpacing: "-0.035em" }],
        "num-lg": ["clamp(3.5rem, 12vw, 7rem)", { lineHeight: "0.9", letterSpacing: "-0.04em" }],
      },
      letterSpacing: {
        label: "0.22em",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
