import React from 'react';
export default class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error) { console.error('UI error:', error); }
  render() {
    if (!this.state.hasError) return this.props.children;
    return <div className="min-h-[50vh] flex items-center justify-center px-6"><div className="max-w-md text-center bg-white rounded-3xl p-8 shadow-sm"><h1 className="text-2xl font-bold">Something went wrong</h1><p className="text-gray-500 mt-2">Please refresh the page and try again.</p><button onClick={() => window.location.reload()} className="mt-6 rounded-xl bg-indigo-600 px-5 py-3 text-white">Refresh</button></div></div>;
  }
}
