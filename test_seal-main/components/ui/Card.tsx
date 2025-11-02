import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  glass?: boolean;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', glow = false, glass = false, hover = false }) => {
  const glowClasses = glow ? 'shadow-glow-ai' : '';
  const glassClasses = glass ? 'glass border-surface2/50' : 'bg-surface border border-surface2/50';
  const hoverClasses = hover ? 'transition-all duration-300 hover:scale-[1.02] hover:shadow-glow-ai hover:border-accent-cyan/30' : '';
  
  return (
    <div className={`${glassClasses} rounded-2xl p-6 ${glowClasses} ${hoverClasses} ${className} relative overflow-hidden group`}>
      {/* Grid pattern overlay */}
      {glass && (
        <div className="absolute inset-0 grid-pattern opacity-10 pointer-events-none" />
      )}
      
      {/* Subtle gradient overlay on hover */}
      {hover && (
        <div className="absolute inset-0 bg-gradient-to-br from-accent-cyan/0 via-transparent to-accent-violet/0 group-hover:from-accent-cyan/5 group-hover:to-accent-violet/5 transition-all duration-500 pointer-events-none" />
      )}
      
      {/* Corner glow accents */}
      {glow && (
        <>
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent-cyan/5 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent-violet/5 rounded-full blur-2xl pointer-events-none" />
        </>
      )}
      
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default Card;
