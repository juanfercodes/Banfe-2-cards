import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';

import { exportSessions, type SessionExportRow } from '../export';

function buildRows(): SessionExportRow[] {
  return [
    {
      patientCode: 'PAC-001',
      startedAt: '2026-01-05T10:00:00.000Z',
      endedAt: '2026-01-05T10:20:00.000Z',
      turnCount: 100,
      totalNet: 250,
      penalizations: 3,
      advantageDisadvantageIndex: 12,
      perStack: { 1: 10, 2: -5, 3: 20, 4: -8, 5: 15 },
    },
  ];
}

function readWorkbook(blob: Blob) {
  return blob.arrayBuffer().then((buffer) => XLSX.read(buffer, { type: 'array' }));
}

describe('exportSessions', () => {
  it('returns a Blob with the xlsx MIME type', () => {
    const blob = exportSessions(buildRows(), 'es');
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('writes Spanish headers and expands perStack', async () => {
    const blob = exportSessions(buildRows(), 'es');
    const workbook = await readWorkbook(blob);
    const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    const header = rows[0] as string[];
    expect(header).toEqual([
      'Paciente',
      'Fecha',
      'Total neto',
      'Penalizaciones',
      'Índice ventaja/desventaja',
      'Duración',
      'Mazo 1',
      'Mazo 2',
      'Mazo 3',
      'Mazo 4',
      'Mazo 5',
    ]);

    const dataRow = rows[1] as unknown[];
    expect(dataRow[0]).toBe('PAC-001');
    expect(dataRow[6]).toBe(10);
    expect(dataRow[7]).toBe(-5);
    expect(dataRow[8]).toBe(20);
    expect(dataRow[9]).toBe(-8);
    expect(dataRow[10]).toBe(15);
    expect(dataRow).toHaveLength(11);
  });

  it('writes English headers for the en locale', async () => {
    const blob = exportSessions(buildRows(), 'en');
    const workbook = await readWorkbook(blob);
    const sheet = workbook.Sheets[workbook.SheetNames[0]!]!;
    const rows = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });
    const header = rows[0] as string[];
    expect(header).toEqual([
      'Patient',
      'Date',
      'Total net',
      'Penalizations',
      'Advantage/disadvantage index',
      'Duration',
      'Stack 1',
      'Stack 2',
      'Stack 3',
      'Stack 4',
      'Stack 5',
    ]);
  });

  it('formats dates per locale', async () => {
    const esBlob = exportSessions(buildRows(), 'es');
    const enBlob = exportSessions(buildRows(), 'en');
    const esRows = XLSX.utils.sheet_to_json<string[]>(
      (await readWorkbook(esBlob)).Sheets['Sesiones']!,
      { header: 1 },
    );
    const enRows = XLSX.utils.sheet_to_json<string[]>(
      (await readWorkbook(enBlob)).Sheets['Sessions']!,
      { header: 1 },
    );
    expect(esRows[1]![1]).not.toBe(enRows[1]![1]);
  });
});
