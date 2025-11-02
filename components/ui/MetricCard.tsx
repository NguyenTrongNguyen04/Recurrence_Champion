import React from 'react';
import TrendIndicator from './TrendIndicator';
import ProgressBar from './ProgressBar';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: number; // Percentage change from previous period
  progress?: number; // Progress value 0-100
  color?: 'success' | 'danger' | 'warning' | 'primary' | 'cyan' | 'violet';
  className?: string;
}

/**
 * Component MetricCard hiện đại với icon, trend indicator, progress bar và animations
 * Sử dụng cho các metric cards trong dashboard
 */
const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  progress,
  color = 'primary',
  className = '',
}) => {
  // Màu sắc dựa trên color prop
  const colorConfig = {
    success: {
      iconBg: 'bg-status-success/10 border-status-success/20',
      iconColor: 'text-status-success',
      valueColor: 'text-status-success',
      progressColor: 'bg-status-success',
    },
    danger: {
      iconBg: 'bg-status-danger/10 border-status-danger/20',
      iconColor: 'text-status-danger',
      valueColor: 'text-status-danger',
      progressColor: 'bg-status-danger',
    },
    warning: {
      iconBg: 'bg-status-warning/10 border-status-warning/20',
      iconColor: 'text-status-warning',
      valueColor: 'text-status-warning',
      progressColor: 'bg-status-warning',
    },
    primary: {
      iconBg: 'bg-accent-cyan/10 border-accent-cyan/20',
      iconColor: 'text-accent-cyan',
      valueColor: 'text-primary',
      progressColor: 'bg-accent-cyan',
    },
    cyan: {
      iconBg: 'bg-accent-cyan/10 border-accent-cyan/20',
      iconColor: 'text-accent-cyan',
      valueColor: 'text-accent-cyan',
      progressColor: 'bg-accent-cyan',
    },
    violet: {
      iconBg: 'bg-accent-violet/10 border-accent-violet/20',
      iconColor: 'text-accent-violet',
      valueColor: 'text-accent-violet',
      progressColor: 'bg-accent-violet',
    },
  };

  const colors = colorConfig[color];

  // Shadow color dựa trên color prop
  const shadowColorMap: { [key: string]: string } = {
    success: 'rgba(16, 185, 129, 0.1)',
    danger: 'rgba(239, 68, 68, 0.1)',
    warning: 'rgba(245, 158, 11, 0.1)',
    cyan: 'rgba(34, 211, 238, 0.1)',
    violet: 'rgba(124, 58, 237, 0.1)',
    primary: 'rgba(34, 211, 238, 0.1)',
  };

  return (
    <div
      className={`
        bg-surface border border-surface2 rounded-2xl p-6
        transition-all duration-300 ease-out
        hover:border-surface2/80 hover:shadow-lg
        hover:-translate-y-1
        group
        ${className}
      `}
      style={{
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = `0 10px 15px -3px ${shadowColorMap[color]}, 0 4px 6px -2px rgba(0, 0, 0, 0.1)`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)';
      }}
    >
      {/* Header với icon và title */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-primary-muted mb-1">{title}</p>
          {subtitle && (
            <p className="text-xs text-primary-muted/70">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div
            className={`
              w-12 h-12 rounded-xl
              ${colors.iconBg} border
              flex items-center justify-center
              transition-transform duration-300
              group-hover:scale-110
            `}
          >
            <div className={colors.iconColor}>{icon}</div>
          </div>
        )}
      </div>

      {/* Value và trend */}
      <div className="flex items-end justify-between mb-3">
        <div className="flex items-baseline gap-2">
          <p className={`text-3xl font-bold ${colors.valueColor} transition-all duration-300`}>
            {value}
          </p>
          {trend !== undefined && (
            <TrendIndicator value={trend} />
          )}
        </div>
      </div>

      {/* Progress bar (nếu có) */}
      {progress !== undefined && (
        <div className="mt-4">
          <ProgressBar
            progress={progress}
            colorClass={colors.progressColor}
            className="h-1.5"
          />
        </div>
      )}
    </div>
  );
};

export default MetricCard;

