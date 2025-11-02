import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { TestStudioLogo, ChevronLeftIcon } from '../icons/Icons';

const Sidebar = () => {
  const { pathname } = useLocation();
  const [isPermanentlyExpanded, setIsPermanentlyExpanded] = useState(false); // User có thể click để expand vĩnh viễn
  const [isHovered, setIsHovered] = useState(false);

  // Hiển thị full khi: permanently expanded HOẶC đang hover
  const shouldShowFull = isPermanentlyExpanded || isHovered;
  const isCollapsed = !isPermanentlyExpanded && !isHovered;

  return (
    <nav 
      className={`bg-surface/95 backdrop-blur-xl border-r border-surface2/50 transition-all duration-300 ease-in-out flex flex-col relative group ${shouldShowFull ? 'w-64' : 'w-20'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex items-center justify-between p-4 border-b border-surface2/50 ${shouldShowFull ? 'h-auto min-h-[65px]' : 'h-[65px]'}`}>
        {shouldShowFull ? (
          <div className="flex-1">
            <TestStudioLogo />
          </div>
        ) : (
          <div className="flex-1 flex justify-center">
            <div className="w-8 h-8">
              <img src="/assets/logo.png" alt="TestStudio" className="w-full h-full object-contain" />
            </div>
          </div>
        )}
        {shouldShowFull && (
          <button 
            onClick={() => setIsPermanentlyExpanded(!isPermanentlyExpanded)} 
            className="p-2 rounded-lg hover:bg-surface2/50 transition-all duration-200 hover:scale-105 flex-shrink-0 ml-2"
            title={isPermanentlyExpanded ? "Collapse sidebar" : "Pin sidebar"}
          >
            <ChevronLeftIcon className={`transform transition-transform duration-300 text-primary-muted hover:text-white ${isPermanentlyExpanded ? '' : 'rotate-180'}`} />
          </button>
        )}
      </div>

      <ul className="flex-1 px-4 py-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center ${shouldShowFull ? 'justify-start' : 'justify-center'} p-3 rounded-xl transition-all duration-300 group relative ${
                  isActive
                    ? 'bg-gradient-to-r from-surface2 to-surface2/50 text-white'
                    : 'text-primary-muted hover:bg-surface2/50 hover:text-white'
                } ${!shouldShowFull ? 'hover:scale-110' : 'hover:translate-x-1'}`}
                title={!shouldShowFull ? item.label : undefined}
              >
                {isActive && (
                  <>
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-gradient-to-b from-accent-cyan to-accent-violet rounded-r-full shadow-glow-cyan"></span>
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-cyan/5 to-transparent rounded-xl" />
                  </>
                )}
                <div className={`w-6 h-6 relative z-10 flex-shrink-0 flex items-center justify-center ${isActive ? 'text-accent-cyan' : 'group-hover:text-accent-cyan transition-colors'}`}>
                  {item.icon}
                </div>
                {shouldShowFull && (
                  <span className="ml-4 font-medium relative z-10 whitespace-nowrap">{item.label}</span>
                )}
                {!shouldShowFull && (
                  <span className="absolute left-full ml-4 w-max px-3 py-2 bg-surface2/95 backdrop-blur-xl border border-accent-cyan/30 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50 shadow-glow-border whitespace-nowrap">
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
