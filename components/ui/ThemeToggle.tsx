import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

/**
 * ThemeToggle component với animation đẹp
 * Hiển thị Sun icon khi dark mode, Moon icon khi light mode
 */
const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={`
        relative
        p-2 rounded-lg
        bg-surface2 border border-surface2
        hover:bg-surface2/80
        text-primary-muted hover:text-primary
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-accent-violet focus:ring-offset-2 focus:ring-offset-background
        group
      `}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun icon - hiển thị khi dark mode (để switch sang light) */}
        <Sun
          className={`
            absolute w-5 h-5
            transition-all duration-300
            ${isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}
            group-hover:rotate-180
          `}
        />
        {/* Moon icon - hiển thị khi light mode (để switch sang dark) */}
        <Moon
          className={`
            absolute w-5 h-5
            transition-all duration-300
            ${!isDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'}
            group-hover:rotate-12
          `}
        />
      </div>
    </button>
  );
};

export default ThemeToggle;

