import React from 'react';
import { XIcon } from '../icons/Icons';

export interface EditorTab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
  isDirty?: boolean;
  isActive?: boolean;
}

interface EditorTabsProps {
  tabs: EditorTab[];
  activeTabId: string;
  onTabClick: (tabId: string) => void;
  onTabClose?: (tabId: string) => void;
  onTabNew?: () => void;
}

const EditorTabs: React.FC<EditorTabsProps> = ({
  tabs,
  activeTabId,
  onTabClick,
  onTabClose,
  onTabNew,
}) => {
  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tab Bar */}
      <div className="flex items-end border-b border-surface2/50 bg-surface2/30 overflow-x-auto">
        <div className="flex items-end min-w-max">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabClick(tab.id)}
              className={`group relative px-4 py-2 flex items-center gap-2 text-sm border-r border-surface2/50 transition-colors min-w-max ${
                activeTabId === tab.id
                  ? 'bg-background border-t-2 border-t-accent-cyan text-primary'
                  : 'bg-surface2/50 text-primary-muted hover:bg-surface2/70 hover:text-primary'
              }`}
            >
              {tab.icon && <span className="flex-shrink-0">{tab.icon}</span>}
              <span className="flex-shrink-0">{tab.label}</span>
              {tab.isDirty && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary-muted group-hover:bg-primary" />
              )}
              {onTabClose && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onTabClose(tab.id);
                  }}
                  className="ml-2 p-0.5 rounded hover:bg-surface2 opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Close"
                >
                  <XIcon className="w-3.5 h-3.5" />
                </button>
              )}
              {activeTabId === tab.id && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent-cyan" />
              )}
            </button>
          ))}
          {onTabNew && (
            <button
              onClick={onTabNew}
              className="px-3 py-2 text-primary-muted hover:text-primary hover:bg-surface2/50 border-r border-surface2/50 transition-colors"
              title="New Tab"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab?.content || (
          <div className="text-center text-primary-muted py-12">
            No content available
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorTabs;

