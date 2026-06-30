import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // In production, this could be sent to an error tracking service
    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-10 max-w-md w-full text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-red-400"></div>
            
            <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-amber-100/50">
              <AlertTriangle className="w-10 h-10 text-amber-500" strokeWidth={1.5} />
            </div>
            
            <h1 className="text-2xl font-bold text-slate-900 mb-2 tracking-tight">Something went wrong</h1>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">
              We encountered an unexpected error. Don't worry — your data is safe. Please try refreshing the page.
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-white text-slate-700 font-semibold border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors text-sm shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <a 
                href="/"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-900 text-white font-semibold rounded-xl hover:bg-slate-800 transition-colors text-sm shadow-md"
              >
                <Home className="w-4 h-4" />
                Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
