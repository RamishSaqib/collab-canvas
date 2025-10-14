import { Component } from 'react';
import type { ReactNode, ErrorInfo } from 'react';
import './ErrorBoundary.css';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component to catch and handle errors gracefully
 * Prevents the entire app from crashing due to component errors
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details for debugging
    console.error('🚨 Error Boundary caught an error:', error);
    console.error('Error Info:', errorInfo);
    
    // You could also log to an error reporting service here
    // Example: Sentry.captureException(error);
    
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    
    // Reload the page to reset state
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1 className="error-title">Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry, but something unexpected happened. Don't worry, your work is safe!
            </p>

            {this.state.error && (
              <details className="error-details">
                <summary>Technical Details</summary>
                <div className="error-details-content">
                  <p className="error-name">{this.state.error.name}</p>
                  <p className="error-text">{this.state.error.message}</p>
                  {this.state.errorInfo && (
                    <pre className="error-stack">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="error-actions">
              <button 
                className="error-button primary"
                onClick={this.handleReset}
              >
                🔄 Reload Page
              </button>
              <button 
                className="error-button secondary"
                onClick={() => window.location.href = '/'}
              >
                🏠 Go to Home
              </button>
            </div>

            <p className="error-help-text">
              If this problem persists, please{' '}
              <a 
                href="https://github.com/RamishSaqib/collab-canvas/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="error-link"
              >
                report the issue
              </a>
              .
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

