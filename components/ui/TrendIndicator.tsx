import React from 'react';

interface TrendIndicatorProps {
  value: number; // Percentage change (positive or negative)
  showIcon?: boolean;
  className?: string;
}

/**
 * Component hiển thị trend indicator với mũi tên lên/xuống và phần trăm thay đổi
 * @param value - Giá trị phần trăm thay đổi (dương = tăng, âm = giảm)
 * @param showIcon - Có hiển thị icon hay không
 * @param className - CSS classes bổ sung
 */
const TrendIndicator: React.FC<TrendIndicatorProps> = ({ 
  value, 
  showIcon = true, 
  className = '' 
}) => {
  // Xác định trend là positive (tăng) hay negative (giảm)
  const isPositive = value >= 0;
  
  // Màu sắc dựa trên trend
  const colorClass = isPositive 
    ? 'text-status-success' 
    : 'text-status-danger';
  
  // Icon dựa trên trend
  const iconPath = isPositive 
    ? 'M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25' // Arrow up
    : 'M19.5 4.5l-15 15m0 0H11.25m-7.5 0v-11.25'; // Arrow down

  // Format giá trị với dấu + nếu positive
  const formattedValue = `${isPositive ? '+' : ''}${value.toFixed(1)}%`;

  return (
    <div className={`inline-flex items-center gap-1 ${colorClass} ${className}`}>
      {showIcon && (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.5}
          stroke="currentColor"
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d={iconPath}
          />
        </svg>
      )}
      <span className="text-sm font-semibold">{formattedValue}</span>
    </div>
  );
};

export default TrendIndicator;

