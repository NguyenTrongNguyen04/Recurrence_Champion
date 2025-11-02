import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className, ...props }) => {
  const baseClasses = 'px-6 py-3 font-bold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-violet disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden group';

  const variantClasses = {
    primary: 'text-white bg-gradient-g1 hover:shadow-glow-ai hover:scale-105 active:scale-95 shadow-md',
    secondary: 'text-primary border-2 border-surface2/50 hover:bg-surface2 hover:text-white hover:border-accent-cyan/50 hover:shadow-glow-cyan',
    ghost: 'text-primary-muted hover:bg-surface2/50 hover:text-white',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {/* Shimmer effect on hover */}
      {variant === 'primary' && (
        <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};

export default Button;
