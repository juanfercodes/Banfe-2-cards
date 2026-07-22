import * as XLSX from 'xlsx';

import type { StackId } from './protocol';

export type ExportLocale = 'es' | 'en';

export interface SessionExportRow {
  patientCode: string;
  startedAt: string;
  endedAt: string | null;
  turnCount: number;
  totalNet: number;
  penalizations: number;
  advantageDisadvantageIndex: number;
  perStack: Record<StackId, number>;
  learningCurve: number[];
}

const STACK_IDS: readonly StackId[] = [1, 2, 3, 4, 5] as const;

const HEADERS: Record<ExportLocale, { patientCode: string; date: string; totalNet: string; penalizations: string; index: string; duration: string; stack: (id: StackId) => string; learningCurve: string }> = {
  es: {
    patientCode: 'Paciente',
    date: 'Fecha',
    totalNet: 'Total neto',
    penalizations: 'Penalizaciones',
    index: 'Índice ventaja/desventaja',
    duration: 'Duración',
    stack: (id) => `Mazo ${id}`,
    learningCurve: 'Curva de aprendizaje',
  },
  en: {
    patientCode: 'Patient',
    date: 'Date',
    totalNet: 'Total net',
    penalizations: 'Penalizations',
    index: 'Advantage/disadvantage index',
    duration: 'Duration',
    stack: (id) => `Stack ${id}`,
    learningCurve: 'Learning curve',
  },
};

const INTL_LOCALE: Record<ExportLocale, string> = { es: 'es-ES', en: 'en-US' };

function formatDuration(row: SessionExportRow, locale: ExportLocale, numberFormatter: Intl.NumberFormat): string {
  if (row.endedAt) {
    const minutes = Math.round(
      (new Date(row.endedAt).getTime() - new Date(row.startedAt).getTime()) / 60000,
    );
    return `${numberFormatter.format(minutes)} ${locale === 'es' ? 'min' : 'min'}`;
  }
  return `${numberFormatter.format(row.turnCount)} ${locale === 'es' ? 'turnos' : 'turns'}`;
}

export function exportSessions(rows: SessionExportRow[], locale: ExportLocale = 'es'): Blob {
  const headers = HEADERS[locale];
  const dateFormatter = new Intl.DateTimeFormat(INTL_LOCALE[locale], { dateStyle: 'short', timeStyle: 'short' });
  const numberFormatter = new Intl.NumberFormat(INTL_LOCALE[locale]);

  const headerRow = [
    headers.patientCode,
    headers.date,
    headers.totalNet,
    headers.penalizations,
    headers.index,
    headers.duration,
    ...STACK_IDS.map((id) => headers.stack(id)),
    headers.learningCurve,
  ];

  const dataRows = rows.map((row) => [
    row.patientCode,
    dateFormatter.format(new Date(row.startedAt)),
    numberFormatter.format(row.totalNet),
    numberFormatter.format(row.penalizations),
    numberFormatter.format(row.advantageDisadvantageIndex),
    formatDuration(row, locale, numberFormatter),
    ...STACK_IDS.map((id) => row.perStack[id] ?? 0),
    row.learningCurve.join(', '),
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headerRow, ...dataRows]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, locale === 'es' ? 'Sesiones' : 'Sessions');

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function downloadWorkbook(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportSessionsToFile(rows: SessionExportRow[], locale: ExportLocale = 'es', filename?: string): void {
  const blob = exportSessions(rows, locale);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadWorkbook(blob, filename ?? `sessions-${stamp}.xlsx`);
}
