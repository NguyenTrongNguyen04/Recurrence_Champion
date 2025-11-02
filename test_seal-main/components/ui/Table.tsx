import React from 'react';

interface Column<T> {
  header: string;
  accessor: (item: T) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
}

function Table<T,>({ columns, data }: TableProps<T>) {
  return (
    <div className="bg-surface border border-surface2 rounded-2xl w-full">
      <table className="w-full text-left">
        <thead className="bg-surface2">
          <tr>
            {columns.map((col, index) => (
              <th key={index} className={`p-3 text-xs font-semibold text-primary-muted ${col.className || ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, rowIndex) => (
            <tr key={rowIndex} className="border-t border-surface2 hover:bg-surface2/50">
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={`p-3 text-sm align-top ${col.className || ''}`}>
                  <div className="break-words whitespace-normal">
                    {col.accessor(item)}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
