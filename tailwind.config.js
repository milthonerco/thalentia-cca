import typography from "@tailwindcss/typography";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        fontFamily: {
          horta: ["Horta", "sans-serif"],
        },
        fontFamily: {
          gothic: ["MiFuente", "sans-serif"],
        },
      },
    },
  },
  plugins: [typography],
};
