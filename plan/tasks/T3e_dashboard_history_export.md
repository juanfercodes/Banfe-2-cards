# T3e — Dashboard, History Table, Stats, Excel Export

> Read `plan/PREAMBLE.md` first. This is your TASK block.

**Model**: `opencode-go/kimi-k2.7-code` · **Effort**: `high`
**Depends on**: T0 (scaffold), T2 (`listPatients`, `listAllSessions`,
  `getSessionHistory`), T3a (`StatCard`, `Table`, `Button`, `Modal`, `Card`,
  `Layout`)
**Base branch**: `origin/develop` · PR target: `develop`

## Goal

Build the clinician's dashboard: statistics cards at the top, a management
history table listing patients and their sessions with scores, filtering /
sorting / pagination, and **Excel `.xlsx` export** of the visible history via
SheetJS. Spanish default + English.

You consume T2's data-access functions and T3a's primitives. You own the
export utility.

## Deliverables

### 1. `src/pages/DashboardPage.tsx`

- Route `/` (protected). Layout from T3a.
- Top: a row of **statistics cards** (`StatsCards.tsx`) computed from the
  clinician's data:
  - Total patients
  - Total sessions
  - Average `totalNet` across sessions
  - Average `advantageDisadvantageIndex` (with advantageous/disadvantageous
    label like T3c)
  - Most recent session date
- Below: action row — "Nuevo paciente" / "New patient" button (→
  `/patients/new`) and the `PatientPicker` (from T3d) to resume an existing
  patient.
- Below: `HistoryTable` (below) with filter + export.
- Empty state when no patients/sessions yet (friendly, i18n, with a CTA to
  create the first patient).

### 2. `src/components/dashboard/StatsCards.tsx`

- Props `{ patients: Patient[]; sessions: Session[] }`. Pure render of the
  5 stat cards using T3a `StatCard`. Compute the aggregates in a pure helper
  `computeDashboardStats(patients, sessions)` (exported, tested).

### 3. `src/components/dashboard/HistoryTable.tsx`

- Built on T3a's generic `Table`. Columns:
  - Patient code
  - Session date (`startedAt`, formatted locale-aware)
  - Total net
  - Penalizations
  - Adv/Disadv index (with colored badge)
  - Duration (turns, or `endedAt - startedAt` if available)
  - Actions: "Ver" / "View" (→ `/results/:sessionId`), "Jugar" / "Play"
    (→ `/play/:patientId`)
- Controls above the table:
  - Search by patient code (text input).
  - Filter by advantageous/disadvantageous/neutral (select).
  - Sort by date / total net / index (toggleable direction).
  - Pagination (page size 10/25/50).
- Row click opens "Ver". Keyboard accessible.
- "Exportar a Excel" / "Export to Excel" button → calls `exportSessions`
  (below) with the currently filtered + visible rows.

### 4. `src/lib/export.ts` — SheetJS `.xlsx` export

- `exportSessions(rows: SessionRow[], locale: 'es'|'en'): Blob` — builds a
  workbook with one sheet, localized headers (es/en), columns matching the
  table, plus the jsonb fields expanded (`perStack.1..5`, `learningCurve`
  joined as a string). Returns a Blob.
- `downloadWorkbook(blob, filename)` — triggers a browser download.
- `exportSessionsToFile(rows, locale, filename?)` — convenience wrapper.
- Use the `xlsx` (SheetJS) package from T0. No server round-trip — pure
  client-side.
- Locale-aware number/date formatting (use `Intl`).

### 5. i18n keys (add to both locales — union-merge)

`dashboard.title`, `dashboard.welcome`, `dashboard.newPatient`,
`dashboard.stats.totalPatients`, `dashboard.stats.totalSessions`,
`dashboard.stats.avgNet`, `dashboard.stats.avgIndex`, `dashboard.stats.lastSession`,
`dashboard.history.title`, `dashboard.history.search`,
`dashboard.history.filter.all`, `dashboard.history.filter.advantageous`,
`dashboard.history.filter.disadvantageous`, `dashboard.history.filter.neutral`,
`dashboard.history.sort.date`, `dashboard.history.sort.net`,
`dashboard.history.sort.index`, `dashboard.history.page`, `dashboard.history.of`,
`dashboard.history.rowsPerPage`, `dashboard.history.empty`,
`dashboard.history.export`, `dashboard.history.exported`,
`dashboard.col.patient`, `dashboard.col.date`, `dashboard.col.totalNet`,
`dashboard.col.penalizations`, `dashboard.col.index`, `dashboard.col.duration`,
`dashboard.col.actions`, `dashboard.col.view`, `dashboard.col.play`,
`export.sheetName`, `export.filenamePrefix`.

## Tests (Vitest + Testing Library)

- `computeDashboardStats.test.ts` (pure) — hand fixtures → assert each stat.
- `StatsCards.test.tsx` — renders 5 cards with correct values; empty-data
  shows zeros / "—".
- `HistoryTable.test.tsx`:
  - Renders rows; search filters by code; filter select narrows by index
    category; sort toggles direction; pagination controls page.
  - "Exportar a Excel" calls `exportSessions` with the visible rows.
  - Empty state shows when no rows.
  - Row click + "Ver"/"Jugar" buttons navigate (mock router).
- `export.test.ts`:
  - `exportSessions(rows, 'es')` returns a Blob with the right MIME
    (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`).
  - Read the workbook back with `XLSX.read` and assert headers (Spanish) +
    row values + jsonb expansion (`perStack.1`..`perStack.5`, `learningCurve`).
  - English locale → English headers.
  - Dates format per locale.

## Gates (must pass before pushing)

```
npm run typecheck
npm run lint
npm run test
npm run build
```

No integration/E2E tests for this task — unit + component tests. (An E2E that
exports a file is brittle; T4 covers a click-level E2E for the export button.)

## Notes for the integrator (put in your DONE report)

- The `SessionRow` shape you pass to `exportSessions` so T4 can wire the real
  query output to it.
- The `computeDashboardStats` signature T4 will call.

Print the DONE or BLOCKED report per `plan/PREAMBLE.md`.
