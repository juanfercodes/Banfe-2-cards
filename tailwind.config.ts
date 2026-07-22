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
        raised: 'var(--raised)',
        felt: 'var(--felt)',
        default: 'var(--fg)',
        muted: 'var(--fg-muted)',
        subtle: 'var(--border-subtle)',
      },
      borderColor: {
        subtle: 'var(--border-subtle)',
      },
      boxShadow: {
        card: '0 1px 2px rgb(2 6 23 / 0.45), 0 10px 30px -14px rgb(2 6 23 / 0.6)',
        lift: '0 2px 6px rgb(2 6 23 / 0.45), 0 18px 44px -18px rgb(2 6 23 / 0.65)',
      },
    },
  },
  plugins: [],
} satisfies Config;
