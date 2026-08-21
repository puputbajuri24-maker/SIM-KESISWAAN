import React, { useState, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Search,
  Inbox
} from 'lucide-react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  id?: string;
  data: T[];
  columns: Column<T>[];
  searchPlaceholder?: string;
  searchableKeys?: (keyof T)[];
  itemsPerPageOptions?: number[];
  defaultItemsPerPage?: number;
  actions?: React.ReactNode;
  filterComponent?: React.ReactNode;
  emptyTitle?: string;
  emptySubtitle?: string;
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  id,
  data,
  columns,
  searchPlaceholder = 'QUERY_FILTER...',
  searchableKeys,
  itemsPerPageOptions = [10, 25, 50, 100],
  defaultItemsPerPage = 10,
  actions,
  filterComponent,
  emptyTitle = 'NO_RECORDS_FOUND',
  emptySubtitle = 'Data yang Anda cari tidak ditemukan dalam database.',
  onRowClick
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultItemsPerPage);

  // Filter Data
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const query = searchTerm.toLowerCase();

    return data.filter(item => {
      if (searchableKeys && searchableKeys.length > 0) {
        return searchableKeys.some(key => {
          const val = item[key];
          return val != null && String(val).toLowerCase().includes(query);
        });
      }
      // Fallback: search all object string values
      return Object.values(item).some(val => {
        return val != null && String(val).toLowerCase().includes(query);
      });
    });
  }, [data, searchTerm, searchableKeys]);

  // Sort Data
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];

      if (aVal == null) return 1;
      if (bVal == null) return -1;

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal).toLowerCase();
      const strB = String(bVal).toLowerCase();
      if (strA < strB) return sortDirection === 'asc' ? -1 : 1;
      if (strA > strB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredData, sortKey, sortDirection]);

  // Pagination Data
  const totalPages = Math.ceil(sortedData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedData.slice(start, start + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const handleSort = (key?: keyof T) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  return (
    <div id={id} className="w-full bg-[#0d0d0f] rounded border border-[#27272a] overflow-hidden flex flex-col font-sans">
      {/* Top Filter & Search Bar */}
      <div className="p-2 sm:p-2.5 border-b border-[#27272a] flex flex-col md:flex-row md:items-center justify-between gap-2 bg-[#121215]">
        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-8 pr-3 py-1 text-xs bg-[#161618] border border-[#27272a] rounded text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 font-mono"
            />
          </div>
          {filterComponent && <div className="flex items-center gap-1.5 text-xs">{filterComponent}</div>}
        </div>
        {actions && <div className="flex items-center gap-1.5 shrink-0">{actions}</div>}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-[#27272a] bg-[#09090b] text-zinc-400 font-mono text-[10px] uppercase tracking-wider">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => col.sortable && col.accessorKey && handleSort(col.accessorKey)}
                  className={`px-3 py-2 select-none ${col.sortable ? 'cursor-pointer hover:text-blue-400' : ''} ${col.className || ''}`}
                >
                  <div className="flex items-center gap-1">
                    <span>{col.header}</span>
                    {col.sortable && <ArrowUpDown className="w-3 h-3 text-zinc-600" />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e1e22]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-zinc-500 font-mono">
                    <Inbox className="w-8 h-8 mb-2 stroke-[1.5] text-zinc-600" />
                    <p className="text-xs font-bold text-zinc-300">{emptyTitle}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{emptySubtitle}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr
                  key={rIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`hover:bg-[#161618] transition-colors ${
                    onRowClick ? 'cursor-pointer' : ''
                  }`}
                >
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className={`px-3 py-2 text-zinc-300 ${col.className || ''}`}>
                      {col.cell ? col.cell(row) : col.accessorKey ? String(row[col.accessorKey] ?? '-') : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="p-2 border-t border-[#27272a] bg-[#121215] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-zinc-500">
        <div className="flex items-center gap-2">
          <span>SHOW:</span>
          <select
            value={pageSize}
            onChange={e => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-1.5 py-0.5 bg-[#161618] border border-[#27272a] rounded text-zinc-300 text-[10px] focus:outline-none"
          >
            {itemsPerPageOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span>OF <strong className="text-zinc-300">{sortedData.length}</strong> RECORDS</span>
        </div>

        <div className="flex items-center gap-1">
          <span className="mr-2 text-zinc-400">
            PAGE {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded border border-[#27272a] bg-[#161618] hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
            title="First Page"
          >
            <ChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded border border-[#27272a] bg-[#161618] hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
            title="Prev Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-[#27272a] bg-[#161618] hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
            title="Next Page"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded border border-[#27272a] bg-[#161618] hover:border-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-zinc-400"
            title="Last Page"
          >
            <ChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
