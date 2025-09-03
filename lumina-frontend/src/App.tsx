import React from 'react';
import './App.css';

function App() {
  const [platformInfo, setPlatformInfo] = React.useState<{
    platform: string;
    electronVersion: string;
  } | null>(null);

  React.useEffect(() => {
    if (window.electronAPI) {
      setPlatformInfo({
        platform: window.electronAPI.platform,
        electronVersion: window.electronAPI.versions.electron,
      });
    }
  }, []);

  return (
    <div className="app">
      <div className="container">
        <div className="logo">✨</div>
        <h1>Lumina</h1>
        <p className="subtitle">Your powerful desktop application</p>
        <div className="status">🚀 React + TypeScript Ready</div>
        <p>Welcome to Lumina! Built with modern React and TypeScript.</p>
        
        {platformInfo && (
          <div className="info">
            <p>Platform: <strong>{platformInfo.platform}</strong></p>
            <p>Electron: <strong>{platformInfo.electronVersion}</strong></p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;