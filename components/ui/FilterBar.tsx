import React, { useState } from 'react';
import { SearchIcon } from '../icons/Icons';

interface FilterBarProps {
  onSearch?: (query: string) => void;
  onBranchFilter?: (branch: string) => void;
  onAuthorFilter?: (author: string) => void;
  onDateRangeFilter?: (start: string, end: string) => void;
  branches?: string[];
  authors?: string[];
  className?: string;
}

/**
 * FilterBar component với search, branch filter, author filter, date range
 */
const FilterBar: React.FC<FilterBarProps> = ({
  onSearch,
  onBranchFilter,
  onAuthorFilter,
  onDateRangeFilter,
  branches = [],
  authors = [],
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedAuthor, setSelectedAuthor] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    onSearch?.(value);
  };

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBranch(value);
    onBranchFilter?.(value === 'all' ? '' : value);
  };

  const handleAuthorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAuthor(value);
    onAuthorFilter?.(value === 'all' ? '' : value);
  };

  const handleDateRangeApply = () => {
    if (startDate && endDate) {
      onDateRangeFilter?.(startDate, endDate);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedBranch('all');
    setSelectedAuthor('all');
    setStartDate('');
    setEndDate('');
    onSearch?.('');
    onBranchFilter?.('');
    onAuthorFilter?.('');
    onDateRangeFilter?.('', '');
  };

  return (
    <div
      className={`
        bg-surface border border-surface2 rounded-2xl p-4
        flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4
        ${className}
      `}
    >
      {/* Search */}
      {onSearch && (
        <div className="relative flex-1 min-w-[200px]">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary-muted" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="
              w-full pl-10 pr-4 py-2
              bg-background border border-surface2 rounded-lg
              text-primary text-sm
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
              transition-all duration-200
            "
          />
        </div>
      )}

      {/* Branch filter */}
      {onBranchFilter && branches.length > 0 && (
        <select
          value={selectedBranch}
          onChange={handleBranchChange}
          className="
            px-4 py-2
            bg-background border border-surface2 rounded-lg
            text-primary text-sm
            focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            transition-all duration-200
          "
        >
          <option value="all">All Branches</option>
          {branches.map((branch) => (
            <option key={branch} value={branch}>
              {branch}
            </option>
          ))}
        </select>
      )}

      {/* Author filter */}
      {onAuthorFilter && authors.length > 0 && (
        <select
          value={selectedAuthor}
          onChange={handleAuthorChange}
          className="
            px-4 py-2
            bg-background border border-surface2 rounded-lg
            text-primary text-sm
            focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            transition-all duration-200
          "
        >
          <option value="all">All Authors</option>
          {authors.map((author) => (
            <option key={author} value={author}>
              {author}
            </option>
          ))}
        </select>
      )}

      {/* Date range */}
      {onDateRangeFilter && (
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="
              px-3 py-2
              bg-background border border-surface2 rounded-lg
              text-primary text-sm
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            "
          />
          <span className="text-primary-muted">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="
              px-3 py-2
              bg-background border border-surface2 rounded-lg
              text-primary text-sm
              focus:outline-none focus:ring-2 focus:ring-accent-violet focus:border-transparent
            "
          />
          {(startDate || endDate) && (
            <button
              onClick={handleDateRangeApply}
              className="
                px-3 py-2
                bg-accent-violet text-white
                rounded-lg text-sm font-medium
                hover:bg-accent-violet/90
                transition-colors
              "
            >
              Apply
            </button>
          )}
        </div>
      )}

      {/* Clear filters */}
      {(searchQuery || selectedBranch !== 'all' || selectedAuthor !== 'all' || startDate || endDate) && (
        <button
          onClick={handleClearFilters}
          className="
            px-4 py-2
            bg-surface2 text-primary-muted
            rounded-lg text-sm font-medium
            hover:bg-surface2/80 hover:text-primary
            transition-colors
          "
        >
          Clear
        </button>
      )}
    </div>
  );
};

export default FilterBar;

