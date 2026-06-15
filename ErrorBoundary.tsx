import React from 'react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

// Catches render-time errors anywhere below it so a single broken component
// shows a recoverable message instead of a blank white page.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    console.error('Unhandled UI error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-white text-zinc-800 px-6 text-center">
          <h1 className="font-serif text-2xl uppercase tracking-wider font-bold mb-3">
            Something went wrong
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            The page hit an unexpected error. Reloading usually fixes it. If it keeps happening,
            please contact us directly.
          </p>
          <button
            onClick={() => window.location.assign('/')}
            className="bg-[#C5A880] hover:bg-[#D5B890] text-black font-semibold text-xs uppercase tracking-widest py-3 px-8 rounded-sm transition-colors"
          >
            Return home
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
