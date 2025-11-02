import React from 'react';

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'running' | 'info';
  children: React.ReactNode;
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '' }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center';
  
  const variantClasses = {
    success: 'bg-status-success/10 text-status-success border border-status-success/50',
    danger: 'bg-status-danger/10 text-status-danger border border-status-danger/50',
    warning: 'bg-status-warning/10 text-status-warning border border-status-warning/50',
    running: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/50 animate-pulse',
    info: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/50'
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
};

export default Badge;