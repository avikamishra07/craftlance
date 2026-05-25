/**
 * ErrorBoundary.tsx — M9 misc fix
 *
 * React error boundary that wraps <RouterProvider>.
 * Catches any unhandled render error and shows a recovery UI
 * instead of a blank/white screen.
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError:  boolean
  error:     Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo })
    // In production, forward to your error tracker (Sentry, Datadog, etc.)
    if (import.meta.env.PROD) {
      console.error('[ErrorBoundary]', error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Navigate to root so the app re-renders from a clean state
    window.location.href = '/'
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const isDev = import.meta.env.DEV
    const msg = this.state.error?.message ?? 'An unexpected error occurred'

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-2xl border border-red-500/20 bg-red-500/5 p-8 space-y-6 text-center">
          <div className="flex justify-center">
            <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20">
              <AlertTriangle size={32} className="text-red-400" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">Something went wrong</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The application encountered an unexpected error. Your data is safe — try
              refreshing the page or returning to the home screen.
            </p>
          </div>

          {isDev && msg && (
            <details className="text-left">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                Error details (dev only)
              </summary>
              <pre className="mt-2 text-[11px] text-red-300 bg-red-950/40 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
                {msg}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-white/8 hover:bg-white/12 text-sm font-medium transition-colors"
            >
              <RefreshCw size={14} />
              Reload page
            </button>
            <button
              onClick={this.handleReset}
              className="flex items-center gap-2 h-9 px-4 rounded-lg bg-brand-500/20 hover:bg-brand-500/30 text-brand-300 text-sm font-medium transition-colors border border-brand-500/25"
            >
              Go to home
            </button>
          </div>
        </div>
      </div>
    )
  }
}
