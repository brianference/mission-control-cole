import React, { useState } from 'react';
import './TopExpensiveTable.css';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any) => React.ReactNode;
  sortable?: boolean;
}

interface TopExpensiveTableProps {
  data: any[];
  columns: Column[];
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  limit?: number;
}

const TopExpensiveTable: React.FC<TopExpensiveTableProps> = ({
  data,
  columns,
  defaultSort = columns[0]?.key,
  defaultOrder = 'desc',
  limit = 10,
}) => {
  const [sortKey, setSortKey] = useState(defaultSort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultOrder);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('desc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortKey];
    const bVal = b[sortKey];

    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    }

    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortOrder === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const limitedData = sortedData.slice(0, limit);

  return (
    <div className="top-expensive-table">
      <table>
        <thead>
          <tr>
            <th className="rank-column">#</th>
            {columns.map((col) => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                className={col.sortable !== false ? 'sortable' : ''}
              >
                {col.label}
                {sortKey === col.key && (
                  <span className="sort-indicator">
                    {sortOrder === 'asc' ? ' ↑' : ' ↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {limitedData.map((row, index) => (
            <tr key={index}>
              <td className="rank-column">{index + 1}</td>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TopExpensiveTable;
