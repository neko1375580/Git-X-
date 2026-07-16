import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppProvider } from './contexts/AppContext';
import { VaultProvider } from './contexts/VaultContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <VaultProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </VaultProvider>
    </ErrorBoundary>
  </StrictMode>,
);

