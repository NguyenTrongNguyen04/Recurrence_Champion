import React from 'react';

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
    dataKey?: string;
  }>;
  label?: string;
  labelFormatter?: (label: string) => string;
  formatter?: (value: number, name: string) => [string, string];
}

/**
 * Custom tooltip cho charts với styling đẹp và dark theme
 */
const ChartTooltip: React.FC<ChartTooltipProps> = ({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  // Format label nếu có formatter
  const displayLabel = labelFormatter ? labelFormatter(label || '') : label;

  return (
    <div
      className="
        bg-surface border border-surface2 rounded-lg p-3 shadow-xl
        backdrop-blur-sm
      "
      style={{
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
      }}
    >
      {/* Label */}
      {displayLabel && (
        <p className="text-sm font-semibold text-primary mb-2 pb-2 border-b border-surface2">
          {displayLabel}
        </p>
      )}

      {/* Payload items */}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const displayValue = formatter
            ? formatter(entry.value, entry.name)
            : [entry.value.toString(), entry.name];

          return (
            <div key={index} className="flex items-center gap-2">
              {/* Color indicator */}
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              {/* Name and value */}
              <div className="flex items-center justify-between gap-4 min-w-[120px]">
                <span className="text-xs text-primary-muted">{displayValue[1]}:</span>
                <span className="text-sm font-semibold text-primary">{displayValue[0]}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ChartTooltip;

