import { Modal } from '@/components/ui/Modal'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'A', description: 'Open the add-stream dialog' },
  { keys: 'S', description: 'Toggle the sidebar' },
  { keys: 'F', description: 'Toggle focus mode for the featured stream' },
  { keys: 'R', description: 'Reset the current layout' },
  { keys: 'T', description: 'Cycle the theme (dark / light / system)' },
  { keys: 'M', description: 'Mute or unmute all streams' },
  { keys: '?', description: 'Show this shortcuts panel' },
  { keys: 'Esc', description: 'Close any open dialog' },
]

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal title="Keyboard shortcuts" isOpen={isOpen} onClose={onClose} size="sm">
      <p className="mb-3 text-sm text-text-muted">
        Shortcuts are disabled while typing in a text field.
      </p>
      <dl className="flex flex-col divide-y divide-border">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between gap-3 py-2">
            <dt>
              <kbd className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-mono text-text">
                {s.keys}
              </kbd>
            </dt>
            <dd className="text-sm text-text-muted">{s.description}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
