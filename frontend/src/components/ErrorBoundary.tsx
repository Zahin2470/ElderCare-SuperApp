import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
  /** Changing this value (e.g. the current route) resets the boundary. */
  resetKey?: string;
}
interface State {
  error: Error | null;
}

/** Keeps one broken screen from white-screening the whole app. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('UI error boundary caught:', error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div role="alert" className="max-w-xl mx-auto mt-16 p-8 text-center space-y-4 bg-white rounded-xl border">
        <h2>Something went wrong on this page</h2>
        <p className="text-gray-600">Your data is safe. You can try again, or go back to the dashboard.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => this.setState({ error: null })}>Try again</Button>
          <Button variant="outline" onClick={() => (window.location.href = '/')}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }
}
