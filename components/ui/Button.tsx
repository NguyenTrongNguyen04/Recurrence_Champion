import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'action';
  children: React.ReactNode;
  icon?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  children, 
  className, 
  icon,
  disabled,
  ...props 
}) => {
  const baseClasses = 'px-6 py-3 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-accent-violet disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2';

  const variantClasses = {
    primary: 'text-white bg-gradient-g1 hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-violet/20 hover:shadow-xl hover:shadow-accent-violet/30',
    secondary: 'text-primary border-2 border-surface2 hover:bg-surface2 hover:text-primary hover:border-surface2 hover:scale-[1.02] active:scale-[0.98]',
    ghost: 'text-primary-muted hover:bg-surface2 hover:text-primary hover:scale-[1.02] active:scale-[0.98]',
    action: 'text-white bg-gradient-to-r from-accent-cyan via-accent-violet to-accent-cyan bg-[length:200%_auto] hover:bg-[position:100%_0] hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-accent-violet/30 hover:shadow-xl hover:shadow-accent-violet/40 transition-all duration-500',
  };

  return (
    <button 
      className={`${baseClasses} ${variantClasses[variant]} ${className} ${disabled ? 'hover:scale-100' : ''}`} 
      disabled={disabled}
      {...props}
    >
      {icon && (
        <span className={`
          inline-flex items-center justify-center
          ${disabled ? '' : 'group-hover:scale-110 transition-transform duration-300'}
        `}>
          {icon}
        </span>
      )}
      {children}
    </button>
  );
};

export default Button;
