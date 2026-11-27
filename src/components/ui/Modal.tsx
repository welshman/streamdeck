import { ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { createPortal } from 'react-dom'

interface ModalProps {
  title: string
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZES: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ title, isOpen, onClose, children, footer, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  // Always call the latest onClose without making it an effect dependency:
  // callers pass inline arrows, and re-running the effect on every parent
  // render used to yank focus back to the dialog (stealing it from inputs).
  const onCloseRef = useRef(onClose)
  const openerRef = useRef<HTMLElement | null>(null)
  const wasOpenRef = useRef(false)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  // Remember what had focus just before the dialog opened (read during
  // render, i.e. before any autoFocus inside the dialog has run).
  if (isOpen && !wasOpenRef.current) {
    openerRef.current = typeof document !== 'undefined' ? (document.activeElement as HTMLElement | null) : null
  }
  wasOpenRef.current = isOpen

  useEffect(() => {
    if (!isOpen) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)

    const dialog = dialogRef.current
    if (dialog && !dialog.contains(document.activeElement)) {
      dialog.focus()
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      openerRef.current?.focus?.()
    }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 animate-fade-in motion-reduce:animate-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCloseRef.current()
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        tabIndex={-1}
        className={`w-full ${SIZES[size]} max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-surface-raised p-5 shadow-card-lg animate-slide-up motion-reduce:animate-none`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-text">
            {title}
          </h2>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div>{children}</div>
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}
