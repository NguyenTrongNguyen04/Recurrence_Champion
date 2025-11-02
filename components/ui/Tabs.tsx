import React, { useState } from 'react';

interface Tab {
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: number | string;
  onTabChange?: (tab: number | string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab: controlledActiveTab, onTabChange }) => {
  const [internalActiveTab, setInternalActiveTab] = useState(0);
  
  // Use controlled if provided, otherwise use internal state
  const activeTab = controlledActiveTab !== undefined ? 
    (typeof controlledActiveTab === 'number' ? controlledActiveTab : 
     tabs.findIndex(t => t.label.toLowerCase().replace(/\s+/g, '') === String(controlledActiveTab).toLowerCase())) :
    internalActiveTab;
  
  const handleTabChange = (index: number) => {
    if (onTabChange) {
      onTabChange(index);
    } else {
      setInternalActiveTab(index);
    }
  };

  return (
    <div>
      <div className="border-b border-surface2">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab, index) => (
            <button
              key={tab.label}
              onClick={() => handleTabChange(index)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === index
                    ? 'border-accent-cyan text-accent-cyan'
                    : 'border-transparent text-primary-muted hover:text-primary hover:border-gray-500'
                }
              `}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="pt-6">
        {tabs[activeTab].content}
      </div>
    </div>
  );
};

export default Tabs;
