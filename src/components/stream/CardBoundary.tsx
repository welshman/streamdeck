import { Component, ComponentProps, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { StreamCard } from './StreamCard'

interface CardBoundaryProps {
  label: string
  children: ReactNode
}

interface CardBoundaryState {
  error: Error | null
}

/** Isolates a single stream card so one broken player can't take the whole dashboard down. */
class CardBoundary extends Component<CardBoundaryProps, CardBoundaryState> {
  state: CardBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error): CardBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`Stream card "${this.props.label}" crashed:`, error, info)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex aspect-video h-full w-full flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface-raised p-4 text-center">
          <AlertTriangle className="h-6 w-6 text-yellow-500" aria-hidden="true" />
          <p className="text-sm text-text">{this.props.label} hit a problem.</p>
          <button
            type="button"
            onClick={() => this.setState({ error: null })}
            className="rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

export function SafeStreamCard(props: ComponentProps<typeof StreamCard>) {
  return (
    <CardBoundary label={props.stream.label}>
      <StreamCard {...props} />
    </CardBoundary>
  )
}
