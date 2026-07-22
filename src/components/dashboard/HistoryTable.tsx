import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

import { Badge, Button, Input, Table, type Column } from '@/components/ui';
import { downloadWorkbook, exportSessions, type SessionExportRow } from '@/lib/export';
import type { Patient, Session } from '@/lib/dataAccess';

import { classifyIndex, type IndexCategory } from './StatsCards';

export interface HistoryTableProps {
  patients: Patient[];
  sessions: Session[];
}

interface HistoryRow {
  session: Session;
  patientCode: string;
}

type SortKey = 'date' | 'net' | 'index';
type SortDirection = 'asc' | 'desc';
type FilterCategory = 'all' | IndexCategory;

const PAGE_SIZES = [10, 25, 50] as const;

function toExportRow(row: HistoryRow): SessionExportRow {
  return {
    patientCode: row.patientCode,
    startedAt: row.session.startedAt,
    endedAt: row.session.endedAt,
    turnCount: row.session.rawEvents.length,
    totalNet: row.session.totalNet,
    penalizations: row.session.penalizations,
    advantageDisadvantageIndex: row.session.advDisadvIndex,
    perStack: row.session.perStack,
    learningCurve: row.session.learningCurve,
  };
}

export function HistoryTable({ patients, sessions }: HistoryTableProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterCategory>('all');
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(10);

  const locale = i18n.language.startsWith('en') ? 'en' : 'es';
  const dateFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-ES', { dateStyle: 'short', timeStyle: 'short' }),
    [locale],
  );

  const patientCodeById = useMemo(() => {
    const map = new Map<string, string>();
    for (const p of patients) map.set(p.id, p.code);
    return map;
  }, [patients]);

  const allRows = useMemo<HistoryRow[]>(
    () => sessions.map((session) => ({ session, patientCode: patientCodeById.get(session.patientId) ?? '—' })),
    [sessions, patientCodeById],
  );

  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (search.trim()) {
      const needle = search.trim().toLowerCase();
      rows = rows.filter((row) => row.patientCode.toLowerCase().includes(needle));
    }
    if (filter !== 'all') {
      rows = rows.filter((row) => classifyIndex(row.session.advDisadvIndex) === filter);
    }
    return rows;
  }, [allRows, search, filter]);

  const sortedRows = useMemo(() => {
    const sorted = [...filteredRows].sort((a, b) => {
      let diff = 0;
      if (sortKey === 'date') diff = a.session.startedAt.localeCompare(b.session.startedAt);
      else if (sortKey === 'net') diff = a.session.totalNet - b.session.totalNet;
      else diff = a.session.advDisadvIndex - b.session.advDisadvIndex;
      return sortDirection === 'asc' ? diff : -diff;
    });
    return sorted;
  }, [filteredRows, sortKey, sortDirection]);

  const pageCount = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  const currentPage = Math.min(page, pageCount - 1);
  const visibleRows = useMemo(
    () => sortedRows.slice(currentPage * pageSize, currentPage * pageSize + pageSize),
    [sortedRows, currentPage, pageSize],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0);
  };

  const handleFilterChange = (value: FilterCategory) => {
    setFilter(value);
    setPage(0);
  };

  const handleExport = () => {
    const rows = visibleRows.map(toExportRow);
    const blob = exportSessions(rows, locale);
    const stamp = new Date().toISOString().slice(0, 10);
    downloadWorkbook(blob, `${t('export.filenamePrefix')}-${stamp}.xlsx`);
  };

  const columns: Column<HistoryRow>[] = [
    { key: 'patient', header: t('dashboard.col.patient'), render: (row) => row.patientCode },
    {
      key: 'date',
      header: t('dashboard.col.date'),
      render: (row) => dateFormatter.format(new Date(row.session.startedAt)),
    },
    { key: 'totalNet', header: t('dashboard.col.totalNet'), render: (row) => row.session.totalNet },
    {
      key: 'penalizations',
      header: t('dashboard.col.penalizations'),
      render: (row) => row.session.penalizations,
    },
    {
      key: 'index',
      header: t('dashboard.col.index'),
      render: (row) => {
        const category = classifyIndex(row.session.advDisadvIndex);
        const variant = category === 'advantageous' ? 'success' : category === 'disadvantageous' ? 'danger' : 'neutral';
        return (
          <Badge variant={variant}>
            {row.session.advDisadvIndex} · {t(`dashboard.history.filter.${category}`)}
          </Badge>
        );
      },
    },
    {
      key: 'duration',
      header: t('dashboard.col.duration'),
      render: (row) => `${row.session.rawEvents.length}`,
    },
    {
      key: 'actions',
      header: t('dashboard.col.actions'),
      render: (row) => (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void navigate(`/results/${row.session.id}`);
            }}
          >
            {t('dashboard.col.view')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              void navigate(`/play/${row.session.patientId}`);
            }}
          >
            {t('dashboard.col.play')}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Input
          label={t('dashboard.history.search')}
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
        <label className="flex flex-col text-sm text-muted">
          {t('dashboard.history.filterLabel')}
          <select
            value={filter}
            onChange={(e) => handleFilterChange(e.target.value as FilterCategory)}
            className="rounded-lg border border-subtle bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="all">{t('dashboard.history.filter.all')}</option>
            <option value="advantageous">{t('dashboard.history.filter.advantageous')}</option>
            <option value="disadvantageous">{t('dashboard.history.filter.disadvantageous')}</option>
            <option value="neutral">{t('dashboard.history.filter.neutral')}</option>
          </select>
        </label>
        <label className="flex flex-col text-sm text-muted">
          {t('dashboard.history.sortLabel')}
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-lg border border-subtle bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="date">{t('dashboard.history.sort.date')}</option>
            <option value="net">{t('dashboard.history.sort.net')}</option>
            <option value="index">{t('dashboard.history.sort.index')}</option>
          </select>
        </label>
        <Button
          variant="secondary"
          onClick={() => setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
          aria-label={sortDirection === 'asc' ? t('common.sortAsc') : t('common.sortDesc')}
        >
          {sortDirection === 'asc' ? '▲' : '▼'}
        </Button>
        <label className="flex flex-col text-sm text-muted">
          {t('dashboard.history.rowsPerPage')}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value) as (typeof PAGE_SIZES)[number]);
              setPage(0);
            }}
            className="rounded-lg border border-subtle bg-surface px-3 py-2 text-sm text-default focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
        <Button variant="primary" onClick={handleExport} disabled={visibleRows.length === 0}>
          {t('dashboard.history.export')}
        </Button>
      </div>

      <Table
        data={visibleRows}
        columns={columns}
        keyExtractor={(row) => row.session.id}
        emptyLabel={t('dashboard.history.empty')}
        onRowClick={(row) => void navigate(`/results/${row.session.id}`)}
      />

      <div className="mt-3 flex items-center justify-end gap-3 text-sm text-muted">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
        >
          ‹
        </Button>
        <span>
          {t('dashboard.history.page')} {currentPage + 1} {t('dashboard.history.of')} {pageCount}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
          disabled={currentPage >= pageCount - 1}
        >
          ›
        </Button>
      </div>
    </div>
  );
}
