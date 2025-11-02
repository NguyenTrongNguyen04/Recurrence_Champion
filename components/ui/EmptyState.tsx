import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component hiển thị khi không có data
 */
const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = '',
}) => {
  return (
    <div
      className={`
        flex flex-col items-center justify-center
        py-12 px-6
        bg-surface border border-surface2 rounded-2xl
        ${className}
      `}
    >
      {/* Icon */}
      {icon && (
        <div className="mb-4 text-primary-muted">
          {icon}
        </div>
      )}

      {/* Title */}
      <h3 className="text-lg font-semibold text-primary mb-2">{title}</h3>

      {/* Description */}
      {description && (
        <p className="text-sm text-primary-muted text-center max-w-md mb-6">
          {description}
        </p>
      )}

      {/* Action button */}
      {action && (
        <button
          onClick={action.onClick}
          className="
            px-4 py-2
            bg-accent-violet text-white
            rounded-lg
            font-medium text-sm
            transition-all duration-200
            hover:bg-accent-violet/90 hover:scale-105
            active:scale-95
          "
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export default EmptyState;

