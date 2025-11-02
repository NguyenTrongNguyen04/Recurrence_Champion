import React from 'react';

interface BadgeProps {
  variant: 'success' | 'danger' | 'warning' | 'running' | 'info' | 'live';
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  dot?: boolean;
}

const Badge: React.FC<BadgeProps> = ({ variant, children, className = '', glow = false, dot = false }) => {
  const baseClasses = 'px-3 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-2 relative';
  
  const variantClasses = {
    success: 'bg-status-success/10 text-status-success border border-status-success/50',
    danger: 'bg-status-danger/10 text-status-danger border border-status-danger/50',
    warning: 'bg-status-warning/10 text-status-warning border border-warning/50',
    running: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/50 animate-pulse',
    info: 'bg-accent-violet/10 text-accent-violet border border-accent-violet/50',
    live: 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/50 strong-glow'
  };

  const glowClasses = glow ? 'shadow-glow-cyan' : '';

  return (
    <span className={`${baseClasses} ${variantClasses[variant]} ${glowClasses} ${className}`}>
      {dot && (
        <span className="relative">
          <span className="absolute inset-0 w-2 h-2 bg-accent-cyan rounded-full animate-ping opacity-75" />
          <span className="relative w-2 h-2 bg-accent-cyan rounded-full" />
        </span>
      )}
      {children}
    </span>
  );
};

export default Badge;
