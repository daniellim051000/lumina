import React from 'react';
import './App.css';
import { apiService, HealthResponse, ApiInfoResponse } from './services/api';

function App() {
  const [platformInfo, setPlatformInfo] = React.useState<{
    platform: string;
    electronVersion: string;
  } | null>(null);
  
  const [apiHealth, setApiHealth] = React.useState<HealthResponse | null>(null);
  const [apiInfo, setApiInfo] = React.useState<ApiInfoResponse | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    // Get Electron info
    if (window.electronAPI) {
      setPlatformInfo({
        platform: window.electronAPI.platform,
        electronVersion: window.electronAPI.versions.electron,
      });
    }

    // Test API connectivity
    const testApi = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [healthData, infoData] = await Promise.all([
          apiService.getHealth(),
          apiService.getApiInfo()
        ]);
        
        setApiHealth(healthData);
        setApiInfo(infoData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    testApi();
  }, []);

  return (
    <div className="app">
      <div className="container">
        <div className="logo">✨</div>
        <h1>Lumina</h1>
        <p className="subtitle">Your powerful desktop application</p>
        
        {loading && (
          <div className="status loading">⏳ Connecting to backend...</div>
        )}
        
        {error && (
          <div className="status error">❌ Backend connection failed: {error}</div>
        )}
        
        {apiHealth && !loading && (
          <div className="status success">✅ Backend connected successfully!</div>
        )}
        
        <p>Full-stack desktop app with Electron + React + Django</p>
        
        {/* Platform Info */}
        {platformInfo && (
          <div className="info-section">
            <h3>Platform Information</h3>
            <div className="info">
              <p>Platform: <strong>{platformInfo.platform}</strong></p>
              <p>Electron: <strong>{platformInfo.electronVersion}</strong></p>
            </div>
          </div>
        )}
        
        {/* API Health */}
        {apiHealth && (
          <div className="info-section">
            <h3>API Health Check</h3>
            <div className="info">
              <p>Status: <strong>{apiHealth.status}</strong></p>
              <p>Message: <strong>{apiHealth.message}</strong></p>
              <p>Version: <strong>{apiHealth.version}</strong></p>
            </div>
          </div>
        )}
        
        {/* API Info */}
        {apiInfo && (
          <div className="info-section">
            <h3>Backend Information</h3>
            <div className="info">
              <p>API: <strong>{apiInfo.api_name}</strong></p>
              <p>Framework: <strong>{apiInfo.framework}</strong></p>
              <p>Database: <strong>{apiInfo.database}</strong></p>
              <p>CORS: <strong>{apiInfo.cors_enabled ? 'Enabled' : 'Disabled'}</strong></p>
              <p>Endpoints: <strong>{apiInfo.endpoints.join(', ')}</strong></p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;