import React, { useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronDownIcon } from '../icons/Icons';

interface WorkbenchProps {
  activityBar: React.ReactNode;
  primarySidebar?: React.ReactNode;
  editorArea: React.ReactNode;
  secondarySidebar?: React.ReactNode;
  bottomPanel?: React.ReactNode;
  statusBar?: React.ReactNode;
  showPrimarySidebar?: boolean;
  showSecondarySidebar?: boolean;
  showBottomPanel?: boolean;
}

const Workbench: React.FC<WorkbenchProps> = ({
  activityBar,
  primarySidebar,
  editorArea,
  secondarySidebar,
  bottomPanel,
  statusBar,
  showPrimarySidebar = true,
  showSecondarySidebar = false,
  showBottomPanel = false,
}) => {
  const [isPrimarySidebarOpen, setIsPrimarySidebarOpen] = useState(showPrimarySidebar);
  const [isSecondarySidebarOpen, setIsSecondarySidebarOpen] = useState(showSecondarySidebar);
  const [isBottomPanelOpen, setIsBottomPanelOpen] = useState(showBottomPanel);

  return (
    <div className="flex h-screen bg-background text-primary relative overflow-hidden">
      {/* Activity Bar (left) */}
      <div className="flex-shrink-0">
        {activityBar}
      </div>

      {/* Primary Sidebar */}
      {primarySidebar && (
        <>
          <div
            className={`border-r border-surface2/50 bg-surface/95 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
              isPrimarySidebarOpen ? 'w-64' : 'w-0'
            }`}
          >
            {isPrimarySidebarOpen && (
              <div className="flex-1 overflow-y-auto">
                {primarySidebar}
              </div>
            )}
          </div>
          {isPrimarySidebarOpen && (
            <button
              onClick={() => setIsPrimarySidebarOpen(false)}
              className="absolute left-64 top-1/2 -translate-y-1/2 z-50 p-1 bg-surface2/80 backdrop-blur-sm border border-surface2/50 rounded-r-md hover:bg-surface2 transition-colors opacity-0 hover:opacity-100 group"
              title="Hide Primary Sidebar"
            >
              <ChevronLeftIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
            </button>
          )}
          {!isPrimarySidebarOpen && (
            <button
              onClick={() => setIsPrimarySidebarOpen(true)}
              className="absolute left-20 top-1/2 -translate-y-1/2 z-50 p-1 bg-surface2/80 backdrop-blur-sm border border-surface2/50 rounded-r-md hover:bg-surface2 transition-colors opacity-0 hover:opacity-100 group"
              title="Show Primary Sidebar"
            >
              <ChevronRightIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
            </button>
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Editor Area */}
        <div className={`flex-1 flex overflow-hidden ${secondarySidebar ? '' : ''}`}>
          {/* Editor */}
          <div className={`flex-1 overflow-hidden flex flex-col ${isSecondarySidebarOpen && secondarySidebar ? 'border-r border-surface2/50' : ''}`}>
            {editorArea}
          </div>

          {/* Secondary Sidebar */}
          {secondarySidebar && (
            <>
              <div
                className={`border-l border-surface2/50 bg-surface/95 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
                  isSecondarySidebarOpen ? 'w-64' : 'w-0'
                }`}
              >
                {isSecondarySidebarOpen && (
                  <div className="flex-1 overflow-y-auto">
                    {secondarySidebar}
                  </div>
                )}
              </div>
              <button
                onClick={() => setIsSecondarySidebarOpen(!isSecondarySidebarOpen)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-1 bg-surface2/80 backdrop-blur-sm border border-surface2/50 rounded-l-md hover:bg-surface2 transition-colors opacity-0 hover:opacity-100 group"
                title={isSecondarySidebarOpen ? 'Hide Secondary Sidebar' : 'Show Secondary Sidebar'}
              >
                {isSecondarySidebarOpen ? (
                  <ChevronRightIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
                ) : (
                  <ChevronLeftIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
                )}
              </button>
            </>
          )}
        </div>

        {/* Bottom Panel */}
        {bottomPanel && (
          <>
            <div
              className={`border-t border-surface2/50 bg-surface/95 backdrop-blur-xl transition-all duration-300 ease-in-out overflow-hidden flex flex-col ${
                isBottomPanelOpen ? 'h-64' : 'h-0'
              }`}
            >
              {isBottomPanelOpen && (
                <div className="flex-1 overflow-y-auto">
                  {bottomPanel}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsBottomPanelOpen(!isBottomPanelOpen)}
              className="absolute bottom-0 left-1/2 -translate-x-1/2 z-50 p-1 bg-surface2/80 backdrop-blur-sm border-t border-l border-r border-surface2/50 rounded-t-md hover:bg-surface2 transition-colors opacity-0 hover:opacity-100 group"
              title={isBottomPanelOpen ? 'Hide Bottom Panel' : 'Show Bottom Panel'}
            >
              {isBottomPanelOpen ? (
                <ChevronDownIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
              ) : (
                <ChevronUpIcon className="w-4 h-4 text-primary-muted group-hover:text-primary" />
              )}
            </button>
          </>
        )}

        {/* Status Bar */}
        {statusBar && (
          <div className="border-t border-surface2/50 bg-surface2/80 backdrop-blur-sm flex-shrink-0">
            {statusBar}
          </div>
        )}
      </div>
    </div>
  );
};

export default Workbench;
