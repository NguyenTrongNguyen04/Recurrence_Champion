import React, { useState } from 'react';
import { DocumentTextIcon, FolderIcon, PlayIcon, ChartBarIcon, ClockIcon, CogIcon, SparklesIcon, TerminalIcon } from '../icons/Icons';

interface PrimarySidebarProps {
  view: 'explorer' | 'search' | 'test-cases' | 'results' | 'outline';
  onViewChange?: (view: string) => void;
  explorerContent?: React.ReactNode;
  testCasesContent?: React.ReactNode;
  resultsContent?: React.ReactNode;
  outlineContent?: React.ReactNode;
}

const PrimarySidebar: React.FC<PrimarySidebarProps> = ({
  view = 'explorer',
  onViewChange,
  explorerContent,
  testCasesContent,
  resultsContent,
  outlineContent,
}) => {
  const views = [
    { id: 'explorer', label: 'Explorer', icon: FolderIcon, content: explorerContent },
    { id: 'test-cases', label: 'Test Cases', icon: PlayIcon, content: testCasesContent },
    { id: 'results', label: 'Results', icon: ChartBarIcon, content: resultsContent },
    { id: 'outline', label: 'Outline', icon: DocumentTextIcon, content: outlineContent },
  ];

  const currentView = views.find(v => v.id === view) || views[0];
  const Icon = currentView.icon;

  return (
    <div className="flex h-full bg-surface/95 backdrop-blur-xl">
      {/* View Switcher (vertical) */}
      <div className="w-12 border-r border-surface2/50 bg-surface2/50 flex flex-col py-2">
        {views.map((v) => {
          const ViewIcon = v.icon;
          return (
            <button
              key={v.id}
              onClick={() => onViewChange?.(v.id)}
              className={`p-3 rounded-lg transition-colors relative group ${
                view === v.id
                  ? 'bg-accent-cyan/10 text-accent-cyan'
                  : 'text-primary-muted hover:text-primary hover:bg-surface2/50'
              }`}
              title={v.label}
            >
              <ViewIcon className="w-5 h-5" />
              {view === v.id && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-0.5 bg-accent-cyan rounded-r-full" />
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface2/50 flex items-center gap-2">
          <Icon className="w-5 h-5 text-primary-muted" />
          <h2 className="font-semibold text-sm uppercase tracking-wider">{currentView.label}</h2>
        </div>

        {/* Content */}
        <div className="p-4">
          {currentView.content || (
            <div className="text-primary-muted text-sm text-center py-8">
              No content available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PrimarySidebar;

