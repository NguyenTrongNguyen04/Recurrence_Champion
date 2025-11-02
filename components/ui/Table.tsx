import React, { useState, useMemo } from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
  sortable?: boolean;
  sortKey?: keyof T | ((item: T) => any);
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  pagination?: boolean;
  itemsPerPage?: number;
  className?: string;
}

function Table<T extends { [key: string]: any }>({ 
  columns, 
  data,
  searchable = false,
  searchPlaceholder = "Search...",
  pagination = false,
  itemsPerPage = 10,
  className = '',
}: TableProps<T>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<keyof T | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchable || !searchQuery) return data;
    
    return data.filter((item) => {
      return columns.some((col) => {
        const value = col.accessor(item);
        return String(value).toLowerCase().includes(searchQuery.toLowerCase());
      });
    });
  }, [data, searchQuery, columns, searchable]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortColumn) return filteredData;

    return [...filteredData].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      const column = columns.find(col => col.sortKey === sortColumn);
      if (column?.sortKey) {
        if (typeof column.sortKey === 'function') {
          aValue = column.sortKey(a);
          bValue = column.sortKey(b);
        } else {
          aValue = a[column.sortKey as keyof T];
          bValue = b[column.sortKey as keyof T];
        }
      } else {
        aValue = a[sortColumn];
        bValue = b[sortColumn];
      }

      if (aValue === bValue) return 0;
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection, columns]);

  // Paginate data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, currentPage, itemsPerPage, pagination]);

  const totalPages = pagination ? Math.ceil(sortedData.length / itemsPerPage) : 1;

  const handleSort = (column: Column<T>) => {
    if (!column.sortable || !column.sortKey) return;
    
    const key = column.sortKey;
    if (sortColumn === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(key as keyof T);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  return (
    <div className={`${className}`}>
      {/* Search bar */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="
              w-full px-4 py-2
              bg-background border border-surface2 rounded-lg
              text-primary text-sm
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
              transition-all duration-200
            "
          />
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto bg-surface border border-surface2 rounded-2xl">
        <table className="w-full text-left">
          <thead className="sticky top-0 bg-surface2 z-10">
            <tr>
              {columns.map((col, index) => (
                <th
                  key={index}
                  className={`
                    p-4 text-sm font-semibold text-primary-muted
                    ${col.sortable ? 'cursor-pointer hover:text-primary transition-colors' : ''}
                    ${col.className || ''}
                  `}
                  onClick={() => col.sortable && handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {col.sortable && col.sortKey === sortColumn && (
                      <span className="text-accent-cyan">
                        {sortDirection === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="p-8 text-center text-primary-muted">
                  No data found
                </td>
              </tr>
            ) : (
              paginatedData.map((item, rowIndex) => (
                <tr
                  key={rowIndex}
                  className="border-t border-surface2 hover:bg-surface2/50 transition-colors"
                >
                  {columns.map((col, colIndex) => (
                    <td key={colIndex} className={`p-4 text-sm ${col.className || ''}`}>
                      {col.accessor(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-primary-muted">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="
                px-3 py-1.5
                bg-surface border border-surface2 rounded-lg
                text-sm font-medium text-primary
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-surface2 transition-colors
              "
            >
              Previous
            </button>
            <span className="text-sm text-primary-muted">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="
                px-3 py-1.5
                bg-surface border border-surface2 rounded-lg
                text-sm font-medium text-primary
                disabled:opacity-50 disabled:cursor-not-allowed
                hover:bg-surface2 transition-colors
              "
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Table;
