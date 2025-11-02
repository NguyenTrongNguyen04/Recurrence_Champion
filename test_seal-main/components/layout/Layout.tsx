import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

interface LayoutProps {
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ onLogout }) => {
  const location = useLocation();
  
  // Pages that should use VSCode-like workbench layout (no container padding)
  // Note: AnalyzePage và ExecutionPage đều dùng layout thông thường với scroll
  const useWorkbench = [].some(path => location.pathname.startsWith(path));

  return (
    <div className="flex h-screen bg-background text-primary relative overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden relative z-10">
        <TopBar onLogout={onLogout} />
        <main className={`flex-1 ${useWorkbench ? 'overflow-hidden' : 'overflow-y-auto'}`}>
          {!useWorkbench && (
            <>
              {/* Additional subtle depth layers */}
              <div className="fixed inset-0 pointer-events-none z-0">
                {/* Subtle light sources */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl animate-pulse-slow" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-violet/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
              </div>
              <div className="container mx-auto px-6 py-8 max-w-7xl relative z-10">
                <Outlet />
              </div>
            </>
          )}
          {useWorkbench && <Outlet />}
        </main>
        {!useWorkbench && (
          <footer className="text-center p-4 text-primary-muted text-xs border-t border-surface2/30 relative z-10 bg-background/30 backdrop-blur-sm">
            © {new Date().getFullYear()} TestStudio
          </footer>
        )}
      </div>
    </div>
  );
};

export default Layout;
