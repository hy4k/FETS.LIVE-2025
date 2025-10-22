import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: any) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorId?: string
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    const errorId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return { hasError: true, error, errorId }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)
    
    // Send error to monitoring service (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined') {
      // Log error to console with additional context
      console.group(`🔴 Error Boundary - ${this.state.errorId}`)
      console.error('Error:', error)
      console.error('Component Stack:', errorInfo.componentStack)
      console.error('Error Boundary State:', this.state)
      console.groupEnd()
      
      // Send to external monitoring if available
      if ((window as any).Sentry) {
        (window as any).Sentry.captureException(error, {
          contexts: {
            react: {
              componentStack: errorInfo.componentStack
            }
          },
          tags: {
            errorBoundary: true,
            errorId: this.state.errorId
          }
        })
      }
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorId: undefined })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50">
          <div className="text-center max-w-md bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-gray-600 mb-4">
                We're sorry, but something unexpected happened. Our team has been notified.
              </p>
              
              {this.state.errorId && (
                <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                  <p className="text-sm text-gray-700">
                    <strong>Error ID:</strong> {this.state.errorId}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Please include this ID when reporting the issue.
                  </p>
                </div>
              )}
            </div>
            
            {/* Development error details */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 p-4 bg-red-50 rounded-lg text-left border border-red-200">
                <summary className="cursor-pointer font-medium text-red-800 hover:text-red-900">
                  🔧 Development Error Details
                </summary>
                <div className="mt-3 space-y-2">
                  <div>
                    <p className="text-sm font-medium text-red-800">Error Message:</p>
                    <p className="text-sm text-red-700 font-mono bg-red-100 p-2 rounded">
                      {this.state.error.message}
                    </p>
                  </div>
                  {this.state.error.stack && (
                    <div>
                      <p className="text-sm font-medium text-red-800">Stack Trace:</p>
                      <pre className="text-xs text-red-700 bg-red-100 p-2 rounded overflow-auto max-h-32">
                        {this.state.error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}
            
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                <Home className="h-4 w-4" />
                Go Home
              </button>
              <button
                onClick={this.handleReload}
                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Reload Page
              </button>
            </div>
            
            {/* Help text */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                If this problem persists, please contact support with the error ID above.
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary