import { type ReactNode, useState, useCallback } from 'react';
import { Checkbox } from './checkbox';

interface Column<T extends Record<string, unknown> = Record<string, unknown>> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, row: T) => ReactNode;
}

interface TableProps<T extends Record<string, unknown> = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  sortable?: boolean;
  selectable?: boolean;
  selectedRows?: string[];
  onSelectionChange?: (selected: string[]) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: ReactNode;
  density?: 'compact' | 'default' | 'expanded';
  className?: string;
}

type SortDirection = 'asc' | 'desc' | 'none';

export function Table<T extends Record<string, unknown> = Record<string, unknown>>({
  columns,
  data,
  sortable = false,
  selectable = false,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  loading = false,
  emptyState,
  density = 'default',
  className = '',
}: TableProps<T>) {
  const cellPy = density === 'compact' ? 'py-2' : density === 'expanded' ? 'py-4' : 'py-3';
  const headPy = density === 'compact' ? 'py-2' : density === 'expanded' ? 'py-4' : 'py-3';
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDirection>('none');

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey !== key) {
        setSortKey(key);
        setSortDir('asc');
      } else {
        const next = sortDir === 'asc' ? 'desc' : sortDir === 'desc' ? 'none' : 'asc';
        setSortDir(next);
        if (next === 'none') setSortKey(null);
      }
    },
    [sortKey, sortDir],
  );

  const sortedData =
    sortKey && sortDir !== 'none'
      ? [...data].sort((a, b) => {
          const av = a[sortKey];
          const bv = b[sortKey];
          if (av == null) return 1;
          if (bv == null) return -1;
          if (av < bv) return sortDir === 'asc' ? -1 : 1;
          if (av > bv) return sortDir === 'asc' ? 1 : -1;
          return 0;
        })
      : data;

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  const toggleAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(allSelected ? [] : data.map((r) => String(r.id ?? '')));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange) return;
    onSelectionChange(
      selectedRows.includes(id)
        ? selectedRows.filter((r) => r !== id)
        : [...selectedRows, id],
    );
  };

  const shimmer = 'bg-surface-200 dark:bg-surface-700 rounded animate-shimmer';

  if (loading) {
    return (
      <div className={`w-full overflow-x-auto bg-layer-2 ${className}`}>
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-surface-200/50 dark:border-surface-700/50">
              {selectable ? <th className="px-4 py-3 w-10" /> : null}
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left" style={{ width: col.width }}>
                  <div className={`h-3 w-20 ${shimmer}`} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-surface-100/60 dark:border-surface-800/60 last:border-0">
                {selectable ? (
                  <td className="px-4 py-3">
                    <div className={`h-4 w-4 ${shimmer}`} />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className={`h-3 w-3/4 ${shimmer}`} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto bg-layer-2 ${className}`}>
      <table className="w-full" role="table">
        <thead>
          <tr className="border-b border-surface-200/50 dark:border-surface-700/50">
            {selectable ? (
              <th className={`pl-4 ${headPy} w-10`}>
                <Checkbox checked={allSelected} indeterminate={someSelected} onChange={toggleAll} />
              </th>
            ) : null}
            {columns.map((col) => (
              <th
                key={col.key}
                className={`
                  px-4 ${headPy} text-xs font-semibold uppercase tracking-wider text-text-500
                  dark:text-text-400 whitespace-nowrap
                  ${sortable && col.sortable !== false ? 'cursor-pointer select-none hover:text-text-900 dark:hover:text-text-200' : ''}
                  ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                `}
                style={{ width: col.width }}
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc'
                      ? 'ascending'
                      : sortDir === 'desc'
                      ? 'descending'
                      : 'none'
                    : undefined
                }
                onClick={() => {
                  if (sortable && col.sortable !== false) handleSort(col.key);
                }}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {sortKey === col.key && sortDir !== 'none' ? (
                    <svg className="h-3 w-3 shrink-0" viewBox="0 0 12 12" fill="currentColor">
                      {sortDir === 'asc' ? (
                        <path d="M6 2l3 5H3l3-5z" />
                      ) : (
                        <path d="M6 10l3-5H3l3 5z" />
                      )}
                    </svg>
                  ) : null}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (selectable ? 1 : 0)}
                className="px-4 py-12 text-center"
              >
                {emptyState ?? (
                  <p className="text-sm text-text-400 dark:text-text-500">No data</p>
                )}
              </td>
            </tr>
          ) : (
            sortedData.map((row) => {
              const rowId = String(row.id ?? '');
              const isSelected = selectedRows.includes(rowId);
              return (
                <tr
                  key={rowId}
                  className={`
                    border-b border-surface-100/60 dark:border-surface-800/60
                    last:border-0
                    transition-colors duration-100
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected
                      ? 'bg-primary-50 dark:bg-primary-900/15'
                      : onRowClick
                      ? 'hover:bg-surface-50 dark:hover:bg-surface-800/40'
                      : ''}
                  `}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable ? (
                    <td
                      className={`pl-4 ${cellPy}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox checked={isSelected} onChange={() => toggleRow(rowId)} />
                    </td>
                  ) : null}
                  {columns.map((col) => {
                    const value = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`
                          px-4 ${cellPy} text-sm text-text-900 dark:text-text-100
                          ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}
                        `}
                      >
                        {col.render
                          ? col.render(value, row)
                          : value != null
                          ? String(value)
                          : <span className="text-text-300">—</span>}
                      </td>
                    );
                  })}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface FilterOption {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface DataGridProps<T extends Record<string, unknown> = Record<string, unknown>>
  extends TableProps<T> {
  searchable?: boolean;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  filterValues?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
}

export function DataGrid<T extends Record<string, unknown> = Record<string, unknown>>({
  searchable = false,
  searchPlaceholder = 'Search…',
  filters,
  filterValues = {},
  onFilterChange,
  ...tableProps
}: DataGridProps<T>) {
  return (
    <div className="w-full space-y-4">
      {searchable || (filters && filters.length > 0) ? (
        <div className="flex flex-wrap gap-2 items-center">
          {searchable ? (
            <div className="relative flex-1 min-w-48">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-400 pointer-events-none"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
               <input
                 type="text"
                 placeholder={searchPlaceholder}
                 aria-label={searchPlaceholder}
                 className="h-10 w-full rounded-md bg-layer-2 pl-9 pr-3 text-sm text-text-900 placeholder:text-text-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-surface-900 dark:text-text-100 dark:placeholder:text-text-500 transition-colors duration-100"
               />
            </div>
          ) : null}
          {filters?.map((filter) => (
            <div
              key={filter.key}
              className="inline-flex items-center gap-2 rounded-md bg-layer-2 px-3 h-10 dark:bg-surface-900"
            >
              <span className="text-xs font-medium text-text-500">{filter.label}</span>
              <select
                value={filterValues[filter.key] ?? ''}
                onChange={(e) => onFilterChange?.(filter.key, e.target.value)}
                aria-label={`Filter by ${filter.label}`}
                className="text-xs text-text-800 bg-transparent border-none outline-none cursor-pointer dark:text-text-200"
              >
                <option value="">All</option>
                {filter.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>
      ) : null}
      <Table {...tableProps} />
    </div>
  );
}
