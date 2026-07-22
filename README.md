# Banfe-2-cards

Browser-based implementation of the **BANFE-2** card decision-making task for
clinician use: login, multi-patient history, statistics, and Excel export.

Built with **Vite + React 18 + TypeScript**, styled with **Tailwind CSS**, and
backed by **Supabase Auth + Postgres**. Spanish default, English supported.

## Quick start

```bash
npm ci
npm run dev
```

The dev server starts at `http://localhost:5173` by default.

## Available scripts

| Command                    | Purpose                                  |
| -------------------------- | ---------------------------------------- |
| `npm run dev`              | Start Vite dev server                    |
| `npm run build`            | Typecheck + production build             |
| `npm run preview`          | Preview production build on port 4173    |
| `npm run typecheck`        | TypeScript type check                    |
| `npm run lint`             | ESLint check                             |
| `npm run lint:fix`         | Auto-fix ESLint issues                   |
| `npm run format`           | Format code with Prettier                |
| `npm run format:check`     | Check Prettier formatting                |
| `npm run test`             | Unit tests                               |
| `npm run test:watch`       | Unit tests in watch mode                 |
| `npm run test:integration` | Integration tests against local Supabase |
| `npm run test:e2e`         | Playwright E2E tests                     |

## Testing

### Unit

```bash
npm run test
```

### Integration (requires Docker Desktop)

```bash
npm run supabase:start
npm run supabase:db:reset
npm run test:integration
npm run supabase:stop
```

### E2E

```bash
npm run test:e2e
```

This builds the app, starts the preview server, and runs Playwright against it.

## Supabase local setup

The Supabase CLI is required. You can install it globally:

```bash
npm i -g supabase
```

Start the local stack and copy the values into a `.env` file:

```bash
npm run supabase:start
npm run supabase:status
```

```bash
cp .env.example .env
```

Fill in:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

## Environment variables

Only public Supabase credentials are needed in the browser. Copy `.env.example`
to `.env` and set the variables. Never commit the `.env` file.

## Deployment

This project is configured for Vercel. Connect the GitHub repository and set the
environment variables in the Vercel dashboard.

## License

Private — clinical assessment project.
