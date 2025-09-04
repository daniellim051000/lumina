import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { Navigation } from './components/Navigation';
import { Dashboard } from './pages/Dashboard';
import { TasksPage } from './pages/Tasks';
import { NotFoundPage } from './pages/NotFound';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <main>
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
