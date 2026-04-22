import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { NotificationProvider } from './components/NotificationSystem';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/design-system.css';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const ChatView = lazy(() => import('./pages/ChatView'));
const HistoryView = lazy(() => import('./pages/HistoryView'));
const LibraryView = lazy(() => import('./pages/LibraryView'));
const ClustersView = lazy(() => import('./pages/ClustersView'));
const UploadPage = lazy(() => import('./pages/UploadPage'));
const PapersPage = lazy(() => import('./pages/PapersPage'));

const LoadingFallback = () => (
  <div className="min-h-screen bg-pattern flex items-center justify-center">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-[#1a1f3a] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="font-mono text-[#6c757d]">Loading...</p>
    </div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/papers" element={<PapersPage />} />
              <Route path="/chat/:id" element={<ChatView />} />
              <Route path="/chat" element={<ChatView />} />
              <Route path="/history" element={<HistoryView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/clusters" element={<ClustersView />} />
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
