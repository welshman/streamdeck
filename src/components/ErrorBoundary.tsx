import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertOctagon } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StreamDeck crashed:', error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-4 text-center">
          <AlertOctagon className="h-10 w-10 text-red-500" aria-hidden="true" />
          <h1 className="text-lg font-semibold text-text">Something went wrong</h1>
          <p className="max-w-md text-sm text-text-muted">
            StreamDeck ran into an unexpected error. Your saved streams are safe in localStorage.
            Try reloading the page.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Reload StreamDeck
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
