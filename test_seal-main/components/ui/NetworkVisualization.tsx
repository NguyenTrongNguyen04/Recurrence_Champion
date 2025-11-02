import React from 'react';

interface NetworkNode {
  id: string;
  label: string;
  position: { x: number; y: number };
  size?: 'small' | 'medium' | 'large';
}

interface NetworkVisualizationProps {
  centerNode: { label: string };
  nodes: NetworkNode[];
  className?: string;
}

const NetworkVisualization: React.FC<NetworkVisualizationProps> = ({ 
  centerNode, 
  nodes, 
  className = '' 
}) => {
  const centerX = 50; // percentage
  const centerY = 50; // percentage

  return (
    <div className={`relative w-full h-64 ${className}`}>
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        {/* Connection lines */}
        {nodes.map((node) => (
          <line
            key={`line-${node.id}`}
            x1={centerX}
            y1={centerY}
            x2={node.position.x}
            y2={node.position.y}
            stroke="rgba(34, 211, 238, 0.3)"
            strokeWidth="0.5"
            className="animate-pulse"
          />
        ))}

        {/* Center node */}
        <g>
          {/* Outer rings */}
          <circle cx={centerX} cy={centerY} r="8" fill="none" stroke="rgba(34, 211, 238, 0.4)" strokeWidth="0.5" />
          <circle cx={centerX} cy={centerY} r="6" fill="none" stroke="rgba(34, 211, 238, 0.6)" strokeWidth="0.5" />
          <circle cx={centerX} cy={centerY} r="4" fill="rgba(17, 22, 42, 0.9)" stroke="rgba(34, 211, 238, 0.8)" strokeWidth="1" className="shadow-glow-cyan" />
          <text
            x={centerX}
            y={centerY + 12}
            textAnchor="middle"
            className="fill-white text-[3px] font-bold"
          >
            {centerNode.label}
          </text>
        </g>

        {/* Connected nodes */}
        {nodes.map((node) => {
          const size = node.size === 'large' ? 3 : node.size === 'small' ? 2 : 2.5;
          return (
            <g key={node.id}>
              <rect
                x={node.position.x - size}
                y={node.position.y - size}
                width={size * 2}
                height={size * 2}
                rx="0.5"
                fill="rgba(17, 22, 42, 0.9)"
                stroke="rgba(34, 211, 238, 0.6)"
                strokeWidth="0.5"
                className="shadow-glow-cyan"
              />
              <text
                x={node.position.x}
                y={node.position.y + size + 2}
                textAnchor="middle"
                className="fill-white text-[2.5px] font-semibold"
              >
                {node.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export default NetworkVisualization;

