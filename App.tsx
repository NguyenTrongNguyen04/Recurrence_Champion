import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/layout/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import AnalyzePage from './pages/AnalyzePage';
import ExecutionPage from './pages/ExecutionPage';
import DashboardPage from './pages/DashboardPage';
import HistoryPage from './pages/HistoryPage';
import SettingsPage from './pages/SettingsPage';
import RequirementPage from './pages/RequirementPage';
import ClickSpark from './components/ui/ClickSpark';

function AppRoutes() {
  const { currentUser, loading } = useAuth();

  // Hiển thị loading state khi đang kiểm tra authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary">Đang tải...</div>
      </div>
    );
  }

  return (
    <Routes>
      {currentUser ? (
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="analyze" element={<AnalyzePage />} />
          <Route path="requirement" element={<RequirementPage />} />
          <Route path="runs" element={<ExecutionPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Route>
      ) : (
        <>
          <Route path="/login" element={<AuthPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </>
      )}
    </Routes>
  );
}

function App() {
  const [spark, setSpark] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      // Tạo spark cho mọi click trên toàn bộ ứng dụng
      setSpark({
        x: e.clientX,
        y: e.clientY,
      });
    };

    document.addEventListener('click', handleClick, true);
    
    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
          {spark && (
            <ClickSpark
              x={spark.x}
              y={spark.y}
              onComplete={() => setSpark(null)}
            />
          )}
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
