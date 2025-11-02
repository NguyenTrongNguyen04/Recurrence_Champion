import React from 'react';
import { CheckCircleIcon, AlertCircleIcon, XCircleIcon } from '../icons/Icons';

interface StatusBarProps {
  status?: 'success' | 'warning' | 'error' | 'info';
  message?: string;
  stats?: {
    passed?: number;
    failed?: number;
    skipped?: number;
    total?: number;
  };
  branch?: string;
  author?: string;
  duration?: string;
}

const StatusBar: React.FC<StatusBarProps> = ({
  status = 'info',
  message,
  stats,
  branch,
  author,
  duration,
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-status-success" />;
      case 'warning':
        return <AlertCircleIcon className="w-4 h-4 text-status-warning" />;
      case 'error':
        return <XCircleIcon className="w-4 h-4 text-status-danger" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-between px-4 py-1.5 text-xs text-primary-muted">
      {/* Left Section */}
      <div className="flex items-center gap-4">
        {getStatusIcon() && (
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span>{message || 'Ready'}</span>
          </div>
        )}
        {stats && (
          <div className="flex items-center gap-3 border-l border-surface2/50 pl-4">
            {stats.passed !== undefined && (
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-3.5 h-3.5 text-status-success" />
                <span>{stats.passed}</span>
              </span>
            )}
            {stats.failed !== undefined && stats.failed > 0 && (
              <span className="flex items-center gap-1">
                <XCircleIcon className="w-3.5 h-3.5 text-status-danger" />
                <span>{stats.failed}</span>
              </span>
            )}
            {stats.skipped !== undefined && stats.skipped > 0 && (
              <span className="text-status-warning">{stats.skipped} skipped</span>
            )}
            {stats.total !== undefined && (
              <span className="text-primary-muted/70">/ {stats.total}</span>
            )}
          </div>
        )}
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-4">
        {branch && (
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
            <span>{branch}</span>
          </span>
        )}
        {author && (
          <span>{author}</span>
        )}
        {duration && (
          <span>{duration}</span>
        )}
      </div>
    </div>
  );
};

export default StatusBar;

