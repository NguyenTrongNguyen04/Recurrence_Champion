import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { NAV_ITEMS } from '../../constants';
import { TestFlowLogo, ChevronLeftIcon } from '../icons/Icons';

const Sidebar = () => {
  const { pathname } = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <nav className={`bg-surface transition-all duration-300 ease-in-out flex flex-col ${isCollapsed ? 'w-20' : 'w-64'}`}>
      <div className={`flex items-center justify-between p-4 border-b border-surface2 ${isCollapsed ? 'h-[65px]' : 'h-[65px]'}`}>
        {!isCollapsed && <TestFlowLogo />}
        <button onClick={() => setIsCollapsed(!isCollapsed)} className="p-1 rounded-full hover:bg-surface2">
          <ChevronLeftIcon className={`transform transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>

      <ul className="flex-1 px-4 py-4 space-y-2">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.path);
          return (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center p-3 rounded-xl transition-all duration-200 group relative ${
                  isActive
                    ? 'bg-surface2 text-primary'
                    : 'text-primary-muted hover:bg-surface2 hover:text-primary'
                }`}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-gradient-to-b from-accent-cyan to-accent-violet rounded-r-full"></span>
                )}
                <div className="w-6 h-6">{item.icon}</div>
                {!isCollapsed && <span className="ml-4 font-medium">{item.label}</span>}
                {isCollapsed && (
                    <span className="absolute left-full ml-4 w-max px-2 py-1 bg-surface2 text-primary text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
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
