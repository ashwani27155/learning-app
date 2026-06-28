import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleReset = () => this.setState({ hasError: false, error: null });

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#f7f4fc" }}>
          <div className="card p-10 text-center max-w-md w-full">
            <div className="text-5xl mb-4">⚠️</div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
            <p className="text-sm text-gray-500 mb-6 font-mono bg-red-50 p-3 rounded-xl border border-red-100 text-left break-all">
              {this.state.error?.message ?? "Unknown error"}
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={this.handleReset} className="btn-primary">Try Again</button>
              <button onClick={() => window.location.href = "/"} className="btn-ghost border border-gray-200">
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
