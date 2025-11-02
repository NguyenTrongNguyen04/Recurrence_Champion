import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  className?: string;
  colorClass?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, className = 'h-2', colorClass = 'bg-gradient-g1' }) => {
  return (
    <div className={`w-full bg-surface2 rounded-full ${className}`}>
      <div
        className={`${colorClass} rounded-full transition-all duration-500 ease-out`}
        style={{ width: `${progress}%`, height: '100%' }}
      ></div>
    </div>
  );
};

export default ProgressBar;
