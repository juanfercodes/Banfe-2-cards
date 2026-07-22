import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: 'var(--bg)',
        foreground: 'var(--fg)',
        accent: 'var(--accent)',
        card: 'var(--card)',
      },
    },
  },
  plugins: [],
} satisfies Config;
