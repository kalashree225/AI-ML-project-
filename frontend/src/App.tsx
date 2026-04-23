import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

const NotFound = () => (
  <div className="min-h-screen bg-pattern flex items-center justify-center">
    <div className="text-center border-4 border-[#1a1f3a] p-12 bg-white">
      <p className="text-6xl font-black text-[#1a1f3a] mb-4">404</p>
      <p className="font-mono text-[#6c757d] uppercase tracking-wider mb-6">Page not found</p>
      <a href="/" className="btn btn-primary">Go Home</a>
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
              <Route path="/dashboard" element={<Navigate to="/" replace />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/papers" element={<PapersPage />} />
              <Route path="/chat/:id" element={<ChatView />} />
              <Route path="/chat" element={<ChatView />} />
              <Route path="/history" element={<HistoryView />} />
              <Route path="/library" element={<LibraryView />} />
              <Route path="/clusters" element={<ClustersView />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;
