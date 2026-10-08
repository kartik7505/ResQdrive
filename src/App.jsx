import React, { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { trackEvent, trackError } from './lib/api';

const Home = lazy(() => import('./components/Home'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const EmergencyState = lazy(() => import('./components/EmergencyState'));
const NearbyHelp = lazy(() => import('./components/NearbyHelp'));
const Profile = lazy(() => import('./components/Profile'));
const ControlDashboard = lazy(() => import('./components/ControlDashboard'));
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const CrashAlertModal = lazy(() => import('./components/CrashAlertModal'));

const AnalyticsTracker = () => {
  const location = useLocation();

  useEffect(() => {
    trackEvent('page_view', location.pathname);
  }, [location]);

  return null;
};

const LoadingFallback = () => (
  <div className="min-h-screen bg-slate-900 flex items-center justify-center">
    <div className="w-10 h-10 border-4 border-slate-700 border-t-rose-500 rounded-full animate-spin" aria-label="Loading..."></div>
  </div>
);

function App() {
  useEffect(() => {
    const handleGlobalError = (event) => {
      trackError(
        'uncaught_js_error',
        event.error?.message || event.message,
        event.error?.stack,
        window.location.pathname
      );
    };

    const handleUnhandledRejection = (event) => {
      trackError(
        'unhandled_promise_rejection',
        event.reason?.message || String(event.reason),
        event.reason?.stack,
        window.location.pathname
      );
    };

    window.addEventListener('error', handleGlobalError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleGlobalError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  return (
    <ErrorBoundary>
      <Router>
        <AnalyticsTracker />
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans selection:bg-rose-500/30">
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/emergency" element={<EmergencyState />} />
              <Route path="/nearby" element={<NearbyHelp />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/control" element={<ControlDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
            <CrashAlertModal />
          </Suspense>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
