import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SharedProjectViewer } from './components/SharedProjectViewer';
import ErrorBoundary from './components/ErrorBoundary';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

const path = window.location.pathname;
if (path.startsWith('/share/')) {
  root.render(
    <React.StrictMode>
      <ErrorBoundary componentName="SharedProjectViewer">
        <SharedProjectViewer />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  root.render(
    <React.StrictMode>
      <AuthProvider>
        <ErrorBoundary componentName="AppRoot">
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </React.StrictMode>
  );
}