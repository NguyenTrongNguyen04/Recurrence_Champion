import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ 
  children, 
  className = '', 
  glow = false,
  hover = false,
}) => {
  const glowClasses = glow ? 'shadow-glow-g3' : '';
  const hoverClasses = hover 
    ? 'transition-all duration-300 hover:border-surface2/80 hover:shadow-lg hover:-translate-y-0.5' 
    : '';
  
  return (
    <div 
      className={`
        bg-surface border border-surface2 rounded-2xl p-6
        ${glowClasses} 
        ${hoverClasses}
        ${className}
      `}
      style={{
        boxShadow: hover 
          ? '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)'
          : undefined,
      }}
    >
      {children}
    </div>
  );
};

export default Card;
