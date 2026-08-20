import { useMemo, useState } from 'react'
import { AlertCircle, Plus, Sparkles } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Platform, RecentStream } from '@/types/stream'
import { splitMultipleInputs } from '@/utils/streamParser'
import { PlatformBadge } from '@/components/ui/PlatformBadge'

interface AddStreamModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (input: string, hint: Platform | null) => { ok: boolean; error?: string }
  recents: RecentStream[]
  onAddFromRecent: (recent: RecentStream) => void
}

const PLATFORM_HINTS: { id: Platform | null; label: string }[] = [
  { id: null, label: 'Auto-detect' },
  { id: 'twitch', label: 'Twitch' },
  { id: 'kick', label: 'Kick' },
  { id: 'youtube', label: 'YouTube' },
]

export function AddStreamModal({ isOpen, onClose, onAdd, recents, onAddFromRecent }: AddStreamModalProps) {
  const [value, setValue] = useState('')
  const [hint, setHint] = useState<Platform | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [addedCount, setAddedCount] = useState(0)

  const candidateLines = useMemo(() => splitMultipleInputs(value), [value])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!value.trim()) return

    const lines = candidateLines.length > 0 ? candidateLines : [value]
    const newErrors: string[] = []
    let successCount = 0

    for (const line of lines) {
      const result = onAdd(line, hint)
      if (!result.ok && result.error) {
        newErrors.push(result.error)
      } else if (result.ok) {
        successCount++
      }
    }

    setErrors(newErrors)
    setAddedCount(successCount)
    if (newErrors.length === 0) {
      setValue('')
      onClose()
    }
  }

  return (
    <Modal title="Add a stream" isOpen={isOpen} onClose={onClose} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="stream-input" className="mb-1.5 block text-sm font-medium text-text">
            Twitch, Kick, or YouTube URL / channel name
          </label>
          <textarea
            id="stream-input"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={'twitch.tv/somechannel\nkick.com/somechannel\nhttps://youtube.com/watch?v=dQw4w9WgXcQ\n\nPaste multiple lines to add several streams at once.'}
            rows={4}
            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            autoFocus
          />
          {candidateLines.length > 1 && (
            <p className="mt-1 flex items-center gap-1 text-xs text-text-muted">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {candidateLines.length} streams detected — all will be added at once.
            </p>
          )}
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium text-text">
            Platform hint (only used for bare channel names)
          </span>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Platform hint">
            {PLATFORM_HINTS.map((p) => (
              <button
                key={p.label}
                type="button"
                role="radio"
                aria-checked={hint === p.id}
                onClick={() => setHint(p.id)}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${
                  hint === p.id
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {errors.length > 0 && (
          <div className="flex flex-col gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
            {errors.map((err, i) => (
              <p key={i} className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                {err}
              </p>
            ))}
          </div>
        )}

        {addedCount > 0 && errors.length === 0 && (
          <p className="text-sm text-green-500">Added {addedCount} stream{addedCount === 1 ? '' : 's'}.</p>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-text hover:bg-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add stream{candidateLines.length > 1 ? 's' : ''}
          </button>
        </div>

        {recents.length > 0 && (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">
              Quick add from recent
            </p>
            <div className="flex flex-wrap gap-1.5">
              {recents.slice(0, 6).map((r) => (
                <button
                  key={`${r.platform}-${r.channelOrId}`}
                  type="button"
                  onClick={() => {
                    onAddFromRecent(r)
                    onClose()
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-text hover:bg-surface"
                >
                  <PlatformBadge platform={r.platform} className="px-1.5 py-0 text-[10px]" />
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Modal>
  )
}
