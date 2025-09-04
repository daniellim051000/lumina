import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Sidebar, SidebarProvider, useSidebar } from './components/Sidebar';
import { MobileHeader } from './components/MobileHeader';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { NotFoundPage } from './pages/NotFound';
import { injectCSSVariables } from './utils/cssVariables';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPage } from './components/auth/AuthPage';

const AppContent: React.FC = () => {
  const { isCollapsed } = useSidebar();
  const { isAuthenticated, isLoading } = useAuth();

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">✨</div>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
          <Route
            path="/journal"
            element={<ComingSoonPage section="Journal" />}
          />
          <Route
            path="/timer"
            element={<ComingSoonPage section="Focus Timer" />}
          />
          <Route
            path="/calendar"
            element={<ComingSoonPage section="Calendar" />}
          />
          <Route
            path="/settings"
            element={<ComingSoonPage section="Settings" />}
          />
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
        <SidebarProvider>
          <AppContent />
        </SidebarProvider>
      </AuthProvider>
    </Router>
  );
}

const ComingSoonPage: React.FC<{ section: string }> = ({ section }) => (
  <div className="max-w-4xl mx-auto px-4 py-12 text-center">
    <div className="text-6xl mb-6">🚧</div>
    <h1 className="text-3xl font-bold text-gray-900 mb-4">
      {section} - Coming Soon
    </h1>
    <p className="text-lg text-gray-600 mb-8">
      This feature is under development and will be available soon.
    </p>
    <a
      href="/"
      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      ← Back to Dashboard
    </a>
  </div>
);

export default App;
