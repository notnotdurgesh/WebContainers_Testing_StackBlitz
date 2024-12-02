import React, { useEffect, useState, useRef } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Create a singleton pattern for WebContainer instance
let webcontainerInstance = null;

const App = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [logs, setLogs] = useState([]);
  const iframeRef = useRef(null);

  useEffect(() => {
    const bootWebContainer = async () => {
      try {
        if (!webcontainerInstance) {
          webcontainerInstance = await WebContainer.boot();
        }
        setIsInitialized(true);
      } catch (err) {
        if (err.message === "Only a single WebContainer instance can be booted") {
          setIsInitialized(true);
        } else {
          setError('Failed to initialize WebContainer: ' + err.message);
        }
      }
    };

    bootWebContainer();
  }, []);

  const appendLog = (message) => {
    setLogs(prevLogs => [...prevLogs, message]);
  };

  const fetchProjectFiles = async () => {
    try {
      const response = await fetch('http://localhost:4000/api/project-files');
      if (!response.ok) {
        throw new Error('Failed to fetch project files');
      }
      return await response.json();
    } catch (err) {
      throw new Error('Error fetching project files: ' + err.message);
    }
  };

  const startDevServer = async () => {
    if (!webcontainerInstance || !isInitialized) {
      setError('WebContainer is not initialized');
      return;
    }

    setLoading(true);
    setError(null);
    setLogs([]);

    try {
      // Fetch files from backend
      appendLog('Fetching project files...');
      const files = await fetchProjectFiles();

      // Mount the files
      appendLog('Mounting files...');
      await webcontainerInstance.mount(files);

      // Install dependencies
      appendLog('Installing dependencies...');
      const installProcess = await webcontainerInstance.spawn('npm', ['install']);
      
      // Handle install process output
      installProcess.output.pipeTo(new WritableStream({
        write(data) {
          appendLog(`[Install] ${data}`);
        }
      }));

      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        throw new Error('Installation failed');
      }

      appendLog('Dependencies installed successfully');

      // Start dev server
      appendLog('Starting development server...');
      const devProcess = await webcontainerInstance.spawn('npm', ['run', 'dev']);
      
      // Handle server process output
      devProcess.output.pipeTo(new WritableStream({
        write(data) {
          appendLog(`[Server] ${data}`);
        }
      }));

      // Listen for server-ready event
      webcontainerInstance.on('server-ready', (port, url) => {
        appendLog(`Server ready at ${url}`);
        if (iframeRef.current) {
          iframeRef.current.src = url;
        }
      });

    } catch (err) {
      console.error('Dev server error:', err);
      setError('Failed to start dev server: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>WebContainer Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <button
              onClick={startDevServer}
              disabled={loading || !isInitialized}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Starting...' : !isInitialized ? 'Initializing...' : 'Start Dev Server'}
            </button>
          </div>
          
          {error && (
            <div className="p-4 mb-4 text-red-500 bg-red-50 rounded border border-red-200">
              {error}
            </div>
          )}

          {logs.length > 0 && (
            <div className="mb-4 p-2 bg-gray-50 rounded border border-gray-200 max-h-40 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="font-mono text-sm py-1">
                  {log}
                </div>
              ))}
            </div>
          )}

          <div className="border rounded overflow-hidden">
            <iframe
              ref={iframeRef}
              className="w-full h-64 md:h-[600px]"
              title="WebContainer Preview"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default App;