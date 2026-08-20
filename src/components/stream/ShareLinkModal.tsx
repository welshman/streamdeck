import { useState } from 'react'
import { Copy, Check, Link2 } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'

interface ShareLinkModalProps {
  isOpen: boolean
  onClose: () => void
  link: string
}

export function ShareLinkModal({ isOpen, onClose, link }: ShareLinkModalProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      /* clipboard API unavailable; user can still select and copy manually */
    }
  }

  return (
    <Modal title="Shareable link" isOpen={isOpen} onClose={onClose} size="md">
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 text-sm text-text-muted">
          <Link2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          This link encodes your current stream list and layout directly in the URL — no backend
          or account required. Anyone who opens it will see the same dashboard, on their own
          device, without affecting your saved configuration.
        </p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            onFocus={(e) => e.currentTarget.select()}
            className="w-full truncate rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
          >
            {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-text-muted">
          Very long stream lists can produce a long URL. Some browsers and messaging apps
          truncate extremely long links — use the JSON export in Settings for large backups.
        </p>
      </div>
    </Modal>
  )
}
