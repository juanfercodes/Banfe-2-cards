import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cn } from './cn';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
}

export interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  emptyLabel?: string;
  onRowClick?: (item: T) => void;
  className?: string;
}

type SortState = { key: string; direction: 'asc' | 'desc' } | null;

export function Table<T>({ data, columns, keyExtractor, emptyLabel, onRowClick, className }: TableProps<T>) {
  const { t } = useTranslation();
  const [sort, setSort] = useState<SortState>(null);

  const sorted = (() => {
    if (!sort) return data;
    const col = columns.find((c) => c.key === sort.key);
    if (!col || !col.sortable) return data;
    return [...data].sort((a, b) => {
      const aValue = String(col.render ? col.render(a) : (a as Record<string, unknown>)[sort.key] ?? '');
      const bValue = String(col.render ? col.render(b) : (b as Record<string, unknown>)[sort.key] ?? '');
      return sort.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
    });
  })();

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.direction === 'asc' ? { key, direction: 'desc' } : null;
      }
      return { key, direction: 'asc' };
    });
  };

  const renderHeader = (col: Column<T>) => {
    if (!col.sortable) return col.header;
    const active = sort?.key === col.key;
    const direction = active ? sort.direction : null;
    const label = direction === 'asc' ? t('common.sortDesc') : t('common.sortAsc');
    return (
      <button
        type="button"
        onClick={() => toggleSort(col.key)}
        className={cn('flex items-center gap-1 font-medium focus:outline-none focus:ring-2 focus:ring-accent', active && 'text-accent')}
        aria-label={`${col.header} — ${label}`}
      >
        {col.header}
        <span aria-hidden="true">{direction === 'asc' ? '▲' : direction === 'desc' ? '▼' : '⇅'}</span>
      </button>
    );
  };

  return (
    <div className={cn('overflow-hidden rounded-xl border border-subtle', className)}>
      <table className="w-full text-left text-sm">
        <thead className="bg-surface">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
                {renderHeader(col)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-subtle">
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {emptyLabel ?? t('common.noData')}
              </td>
            </tr>
          ) : (
            sorted.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  'bg-background transition-colors hover:bg-surface',
                  onRowClick && 'cursor-pointer',
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-default">
                    {col.render ? col.render(item) : (item as Record<string, React.ReactNode>)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
