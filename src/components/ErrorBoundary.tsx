import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Shows a friendly recovery screen instead of a blank page when a render crashes. */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Structured so a log drain or error tracker can pick it up consistently.
    console.error(
      JSON.stringify({
        level: "error",
        source: "react-error-boundary",
        message: error.message,
        stack: error.stack,
        componentStack: info.componentStack,
        path: typeof window !== "undefined" ? window.location.pathname : null,
        at: new Date().toISOString(),
      })
    );
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="max-w-sm text-center space-y-4">
          <h1 className="netflix-title text-2xl text-foreground">Something went wrong</h1>
          <p className="text-sm text-muted-foreground">
            The page hit an unexpected problem. Reloading usually fixes it — your account and payment are safe.
          </p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => window.location.reload()} className="bg-primary text-primary-foreground">
              Reload page
            </Button>
            <Button variant="outline" onClick={() => (window.location.href = "/support")}>
              Contact support
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
