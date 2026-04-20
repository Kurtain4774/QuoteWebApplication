import { Component } from "react";

// Catches render-time errors anywhere below in the tree and shows a friendly fallback
// instead of the white-screen-of-death. componentDidCatch is also where we forward
// to Sentry (or any other error reporter) once it's enabled.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    if (window.Sentry?.captureException) {
      window.Sentry.captureException(error, { extra: info });
    }
  }

  handleReload = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-6">
        <div className="max-w-md text-center">
          <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-3">
            Something went wrong
          </p>
          <h1 className="font-serif text-3xl text-gray-900 mb-3">
            We hit an unexpected error.
          </h1>
          <p className="text-sm text-gray-600 mb-6">
            The error has been logged. Reloading the page usually fixes it.
          </p>
          <button
            onClick={this.handleReload}
            className="px-5 py-2.5 bg-black text-white text-sm rounded-lg hover:bg-gray-800 transition-colors"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
