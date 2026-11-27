import { Component, ErrorInfo, ReactNode } from 'react'
import { AlertOctagon, Trash2 } from 'lucide-react'

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
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
            >
              Reload StreamDeck
            </button>
            <button
              type="button"
              onClick={() => {
                // Last-resort escape hatch: if a crash is caused by corrupted saved
                // data, reloading alone won't help. This clears the saved state so the
                // app can start fresh (the corrupt-data backup copy is kept by
                // storage.ts, so nothing is truly unrecoverable).
                try {
                  window.localStorage.removeItem('streamdeck:state:v1')
                } catch {
                  /* ignore */
                }
                window.location.reload()
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Clear saved data and start fresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
