'use client';
import React from 'react';
import { Card, Spinner, EmptyState } from '@/components/ui';

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

export default function DataTable<T extends Record<string, any>>({ columns, data, loading, onRowClick, emptyMessage }: DataTableProps<T>) {
  if (loading) return <Spinner />;
  if (!data || data.length === 0) return <EmptyState message={emptyMessage || 'No records found'} />;

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, idx) => (
              <tr
                key={row.id || idx}
                onClick={() => onRowClick?.(row)}
                className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
              >
                {columns.map(col => (
                  <td key={col.key} className={`px-4 py-3 text-gray-700 dark:text-gray-300 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ─── Pagination ─────────────────────────────────────────
interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-2 py-4">
      <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    </div>
  );
}
