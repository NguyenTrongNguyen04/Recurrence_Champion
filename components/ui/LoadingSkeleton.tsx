import React from 'react';

interface LoadingSkeletonProps {
  type?: 'card' | 'text' | 'circle' | 'metric';
  className?: string;
  count?: number;
}

/**
 * Loading skeleton component cho các loading states
 */
const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  type = 'card',
  className = '',
  count = 1,
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'metric':
        return (
          <div className="bg-surface border border-surface2 rounded-2xl p-6 animate-pulse">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="h-4 bg-surface2 rounded w-24 mb-2"></div>
                <div className="h-3 bg-surface2 rounded w-32"></div>
              </div>
              <div className="w-12 h-12 bg-surface2 rounded-xl"></div>
            </div>
            <div className="h-10 bg-surface2 rounded w-32 mb-3"></div>
            <div className="h-1.5 bg-surface2 rounded w-full"></div>
          </div>
        );
      case 'card':
        return (
          <div className={`bg-surface border border-surface2 rounded-2xl p-6 animate-pulse ${className}`}>
            <div className="h-6 bg-surface2 rounded w-1/3 mb-4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-surface2 rounded w-full"></div>
              <div className="h-4 bg-surface2 rounded w-5/6"></div>
              <div className="h-4 bg-surface2 rounded w-4/6"></div>
            </div>
          </div>
        );
      case 'text':
        return (
          <div className={`animate-pulse ${className}`}>
            <div className="h-4 bg-surface2 rounded w-full mb-2"></div>
            <div className="h-4 bg-surface2 rounded w-5/6"></div>
          </div>
        );
      case 'circle':
        return (
          <div className={`w-12 h-12 bg-surface2 rounded-full animate-pulse ${className}`}></div>
        );
      default:
        return null;
    }
  };

  if (count > 1) {
    return (
      <div className={className}>
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>{renderSkeleton()}</React.Fragment>
        ))}
      </div>
    );
  }

  return renderSkeleton();
};

export default LoadingSkeleton;

