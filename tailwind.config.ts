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
        base: 'var(--bg)',
        surface: 'var(--card)',
        default: 'var(--fg)',
        muted: 'var(--fg-muted)',
        subtle: 'var(--border-subtle)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
      },
    },
  },
  plugins: [],
} satisfies Config;
