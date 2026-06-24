import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from './i18n';
import './App.css';
import { Sidebar, SidebarProvider, useSidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { Settings } from './pages/Settings';
import { NotFoundPage } from './pages/NotFound';
import { PomodoroTimer } from './pages/PomodoroTimer';
import { JournalPage } from './pages/Journal';
import { CalendarPage } from './pages/Calendar';
import { injectCSSVariables } from './utils/cssVariables';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { AuthPage } from './components/auth/AuthPage';

const AppContent: React.FC = () => {
  const { t } = useTranslation();
  const { isCollapsed } = useSidebar();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('app.loading')}</p>
        </div>
      </div>
    );
  }

  // Show authentication page if user is not authenticated
  if (!isAuthenticated) {
    return <AuthPage initialMode="signin" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Title bar drag area for Electron */}
      <div className="electron-drag fixed top-0 left-0 w-full h-8 z-50 bg-transparent" />

      <MobileHeader />
      <Sidebar />
      <main
        className={`transition-all duration-300 ease-in-out pt-8 ${
          isCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/journal" element={<JournalPage />} />
          <Route path="/timer" element={<PomodoroTimer />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  useEffect(() => {
    injectCSSVariables();
  }, []);

  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <SidebarProvider>
            <AppContent />
          </SidebarProvider>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
