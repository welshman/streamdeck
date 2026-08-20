import { CheckCircle2, Info, XCircle, X } from 'lucide-react'
import { ToastMessage } from '@/hooks/useDashboardStore'
import { cx } from '@/utils/classNames'

interface ToastStackProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6"
      role="status"
      aria-live="polite"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const Icon = ICONS[toast.tone]

  return (
    <div
      className={cx(
        'pointer-events-auto flex w-full max-w-sm items-start gap-2 rounded-xl border border-border bg-surface-raised px-3 py-2.5 shadow-card-lg animate-slide-up motion-reduce:animate-none',
      )}
    >
      <Icon
        className={cx(
          'mt-0.5 h-4 w-4 shrink-0',
          toast.tone === 'success' && 'text-green-500',
          toast.tone === 'error' && 'text-red-500',
          toast.tone === 'info' && 'text-accent',
        )}
        aria-hidden="true"
      />
      <p className="flex-1 text-sm text-text">{toast.text}</p>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="rounded p-0.5 text-text-muted hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
