import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ClickSparkProps {
  x: number;
  y: number;
  onComplete: () => void;
}

const ClickSpark: React.FC<ClickSparkProps> = ({ x, y, onComplete }) => {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const sparks = useMemo(() => {
    const sparkCount = 12;
    const uniqueId = `spark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      uniqueId,
      sparks: Array.from({ length: sparkCount }, (_, i) => {
        const angle = (360 / sparkCount) * i;
        const angleRad = (angle * Math.PI) / 180;
        const distance = 50 + Math.random() * 30;
        const endX = Math.cos(angleRad) * distance;
        const endY = Math.sin(angleRad) * distance;
        
        return {
          id: i,
          endX,
          endY,
          delay: i * 3,
          color: i % 2 === 0 ? '#21A691' : '#87DF2C',
          animationName: `sparkMove-${uniqueId}-${i}`,
        };
      }),
    };
  }, [x, y]);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    // Tạo style element và inject keyframes
    const style = document.createElement('style');
    style.type = 'text/css';
    style.id = `spark-styles-${sparks.uniqueId}`;
    
    const keyframes = sparks.sparks.map((spark) => `
      @keyframes sparkMove-${sparks.uniqueId}-${spark.id} {
        0% {
          transform: translate(-50%, -50%) translate(0px, 0px) scale(1);
          opacity: 1;
        }
        40% {
          opacity: 1;
        }
        100% {
          transform: translate(-50%, -50%) translate(${spark.endX.toFixed(2)}px, ${spark.endY.toFixed(2)}px) scale(0.2);
          opacity: 0;
        }
      }
    `).join('\n');
    
    style.innerHTML = keyframes;
    document.head.appendChild(style);
    styleRef.current = style;

    return () => {
      if (styleRef.current && document.head.contains(styleRef.current)) {
        document.head.removeChild(styleRef.current);
      }
    };
  }, [sparks.uniqueId, sparks.sparks]);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 600);
    return () => clearTimeout(timer);
  }, [onComplete]);

  const content = (
    <div 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 99999,
        overflow: 'visible'
      }}
    >
      {sparks.sparks.map((spark) => (
        <div
          key={spark.id}
          style={{
            position: 'absolute',
            left: `${x}px`,
            top: `${y}px`,
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: spark.color,
            boxShadow: `0 0 20px ${spark.color}, 0 0 40px ${spark.color}`,
            transform: 'translate(-50%, -50%)',
            animation: `sparkMove-${sparks.uniqueId}-${spark.id} 500ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards`,
            animationDelay: `${spark.delay}ms`,
            willChange: 'transform, opacity',
            opacity: 1,
          }}
        />
      ))}
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(content, document.body);
  }
  
  return null;
};

export default ClickSpark;

