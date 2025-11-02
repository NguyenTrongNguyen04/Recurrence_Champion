import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { TestFlowLogo } from '../icons/Icons';
// Không cần ClickSpark vì đã có global handler trong Layout

const Sidebar = () => {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(true); // Mặc định thu gọn
  const [pillStyle, setPillStyle] = useState<{ top: number; height: number } | null>(null);
  const navRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // Cập nhật vị trí pill khi active item thay đổi hoặc khi collapse/expand
  useEffect(() => {
    const updatePillPosition = () => {
      const activeItem = NAV_ITEMS.find(item => pathname.startsWith(item.path));
      if (!activeItem || !navRef.current) {
        setPillStyle(null);
        return;
      }

      const itemElement = itemRefs.current.get(activeItem.path);
      if (!itemElement) {
        setPillStyle(null);
        return;
      }

      const navRect = navRef.current.getBoundingClientRect();
      const itemRect = itemElement.getBoundingClientRect();

      setPillStyle({
        top: itemRect.top - navRect.top,
        height: itemRect.height,
      });
    };

    // Delay nhỏ để đảm bảo layout đã được render
    const timeoutId = setTimeout(updatePillPosition, 10);
    
    return () => clearTimeout(timeoutId);
  }, [pathname, isCollapsed]);

  return (
    <nav 
      className={`bg-surface transition-all duration-300 ease-in-out flex flex-col overflow-hidden ${isCollapsed ? 'w-20' : 'w-64'}`}
      onMouseEnter={() => setIsCollapsed(false)}
      onMouseLeave={() => setIsCollapsed(true)}
    >
      <div className={`flex items-center border-b border-surface2 ${isCollapsed ? 'h-[80px] justify-center px-4' : 'h-[80px] justify-start px-4'}`}>
        <div className={isCollapsed ? 'flex justify-center w-full' : 'flex items-center space-x-3 w-full'}>
          {/* Hexagon logo icon - hiển thị cả khi collapsed và expanded */}
          <div className="relative flex-shrink-0">
            <svg width={isCollapsed ? "48" : "64"} height={isCollapsed ? "48" : "64"} viewBox="0 0 48 48" className="drop-shadow-lg">
              <defs>
                <linearGradient id={`hexagonGradient-sidebar`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1E3230" />
                  <stop offset="50%" stopColor="#27403E" />
                  <stop offset="100%" stopColor="#1A2928" />
                </linearGradient>
                <linearGradient id={`circuitGradient-sidebar`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#21A691" />
                  <stop offset="100%" stopColor="#87DF2C" />
                </linearGradient>
                <filter id={`glow-sidebar`}>
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>
              
              <path
                d="M24 4 L36 10 L40 22 L36 34 L24 40 L12 34 L8 22 L12 10 Z"
                fill={`url(#hexagonGradient-sidebar)`}
                stroke="#1E3230"
                strokeWidth="0.5"
                className="rounded-lg"
              />
              
              <circle cx="24" cy="20" r="14" fill="none" stroke={`url(#circuitGradient-sidebar)`} strokeWidth="1.5" opacity="0.8" filter={`url(#glow-sidebar)`} />
              
              <circle cx="24" cy="12" r="1.5" fill={`url(#circuitGradient-sidebar)`} />
              <circle cx="32" cy="18" r="1.5" fill={`url(#circuitGradient-sidebar)`} />
              <circle cx="24" cy="28" r="1.5" fill={`url(#circuitGradient-sidebar)`} />
              <circle cx="16" cy="18" r="1.5" fill={`url(#circuitGradient-sidebar)`} />
              <path d="M24 12 L32 18 M24 28 L32 18 M24 28 L16 18 M24 12 L16 18" stroke={`url(#circuitGradient-sidebar)`} strokeWidth="1" opacity="0.6" />
              
              <g transform="translate(24, 20)">
                <circle cx="0" cy="0" r="8" fill="none" stroke={`url(#circuitGradient-sidebar)`} strokeWidth="1.5" opacity="0.7" />
                <rect x="-4" y="2" width="1.5" height="3" fill={`url(#circuitGradient-sidebar)`} opacity="0.9" />
                <rect x="-1.5" y="1" width="1.5" height="4" fill={`url(#circuitGradient-sidebar)`} opacity="0.9" />
                <rect x="1" y="0.5" width="1.5" height="4.5" fill={`url(#circuitGradient-sidebar)`} opacity="0.9" />
                <line x1="-3" y1="-1" x2="3" y2="-1" stroke={`url(#circuitGradient-sidebar)`} strokeWidth="0.8" opacity="0.7" />
                <line x1="-2.5" y1="-2.5" x2="2.5" y2="-2.5" stroke={`url(#circuitGradient-sidebar)`} strokeWidth="0.8" opacity="0.7" />
                <path
                  d="M 5 -5 L 9 -7 L 9 -3"
                  fill="none"
                  stroke={`url(#circuitGradient-sidebar)`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>
            </svg>
          </div>
          
          {/* Text chỉ hiển thị khi expanded */}
          {!isCollapsed && (
            <div className="flex items-center">
              <span className="text-2xl font-extrabold bg-gradient-to-r from-[#21A691] to-[#87DF2C] bg-clip-text text-transparent leading-none tracking-tight whitespace-nowrap">
                Test Studio
              </span>
            </div>
          )}
        </div>
      </div>

      <ul ref={navRef} className="flex-1 px-3 py-3 space-y-1.5 relative overflow-y-auto overflow-x-hidden">
        {/* Pill indicator với animation */}
        {pillStyle && (
          <div
            className={`absolute bg-gradient-g1 rounded-xl transition-all duration-300 ease-out pointer-events-none z-0 ${
              isCollapsed ? 'left-2 right-2' : 'left-3 right-3'
            }`}
            style={{
              top: `${pillStyle.top}px`,
              height: `${pillStyle.height}px`,
            }}
          />
        )}

        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <li
              key={item.path}
              ref={(el) => {
                if (el) {
                  itemRefs.current.set(item.path, el);
                } else {
                  itemRefs.current.delete(item.path);
                }
              }}
            >
              <Link
                to={item.path}
                className={`flex items-center rounded-xl transition-all duration-300 group relative z-10 ${
                  isActive
                    ? 'text-white'
                    : 'text-primary-muted hover:text-primary'
                } ${isCollapsed ? 'justify-center p-3' : 'p-3 w-full'}`}
              >
                <div className="w-6 h-6 transition-transform duration-300 flex-shrink-0 flex items-center justify-center">{item.icon}</div>
                {!isCollapsed && <span className={`ml-4 font-medium transition-colors duration-300 ${isActive ? 'text-white' : ''}`}>{item.label}</span>}
                {isCollapsed && (
                    <span className="absolute left-full ml-4 w-max px-2 py-1 bg-surface2 text-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                        {item.label}
                    </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default Sidebar;
