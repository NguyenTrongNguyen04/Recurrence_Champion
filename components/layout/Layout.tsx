import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import ChatWidget from '../ui/ChatWidget';

const Layout: React.FC = () => {
  return (
    <div className="flex h-screen bg-background text-primary">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-background">
          <div className="container mx-auto px-6 py-8 max-w-7xl">
            <Outlet />
          </div>
        </main>
        <footer className="text-center p-4 text-primary-muted text-xs">
          © {new Date().getFullYear()} Test Studio AI
        </footer>
      </div>
      <ChatWidget />
    </div>
  );
};

export default Layout;
