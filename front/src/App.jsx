import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx';
import { ThemeProvider, useTheme } from './contexts/ThemeContext.jsx';
import LoginPage from './components/auth/LoginPage.jsx';
import Layout from './components/layout/Layout.jsx';
import Dashboard from './components/dashboard/Dashboard.jsx';
import Sites from './components/sites/Sites.jsx';
import FileManager from './components/files/FileManager.jsx';
import Terminal from './components/terminal/Terminal.jsx';
import AIInsights from './components/ai/AIInsights.jsx';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'sites':
        return <Sites />;
      case 'files':
        return <FileManager />;
      case 'terminal':
        return <Terminal />;
      case 'ai-insights':
        return <AIInsights />;
      default:
        return <Dashboard />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage}>
      {renderPage()}
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
