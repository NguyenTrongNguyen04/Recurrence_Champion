import React from 'react';
import { TerminalIcon, DocumentTextIcon, AlertCircleIcon } from '../icons/Icons';

export interface PanelTab {
  id: string;
  label: string;
  icon?: React.ReactNode;
  content: React.ReactNode;
  badge?: number;
}

interface BottomPanelProps {
  tabs: PanelTab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
}

const BottomPanel: React.FC<BottomPanelProps> = ({
  tabs,
  activeTabId,
  onTabClick,
}) => {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="flex flex-col h-full bg-surface2/50">
      {/* Tab Bar */}
      <div className="flex items-center border-b border-surface2/50 bg-surface/95 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabClick(tab.id)}
            className={`group relative px-3 py-2 flex items-center gap-2 text-xs border-b-2 transition-colors ${
              activeTabId === tab.id
                ? 'border-accent-cyan text-primary bg-background'
                : 'border-transparent text-primary-muted hover:text-primary hover:bg-surface2/50'
            }`}
          >
            {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
            <span className="flex-shrink-0">{tab.label}</span>
            {tab.badge !== undefined && tab.badge > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-accent-cyan/20 text-accent-cyan text-xs font-semibold">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Panel Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab?.content || (
          <div className="text-center text-primary-muted py-8 text-sm">
            No content available
          </div>
        )}
      </div>
    </div>
  );
};

export default BottomPanel;

