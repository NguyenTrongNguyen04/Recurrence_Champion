import React from 'react';
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
  return (
    <ThemeProvider>
      <AuthProvider>
        <HashRouter>
          <AppRoutes />
        </HashRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
