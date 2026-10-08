import React from 'react';
import { trackError } from '../lib/api';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    trackError(
      'react_render_error',
      error.message,
      errorInfo.componentStack || error.stack,
      window.location.pathname
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-rose-500/30 p-8 rounded-3xl max-w-lg w-full text-center shadow-lg">
            <h2 className="text-2xl font-bold text-white mb-4">Something went wrong</h2>
            <p className="text-slate-400 mb-6">An unexpected error occurred. Our team has been notified.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="px-6 py-3 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-medium transition-colors"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
