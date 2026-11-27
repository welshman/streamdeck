import { Modal } from '@/components/ui/Modal'

interface ShortcutsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'A', description: 'Open the add-stream dialog' },
  { keys: 'Ctrl/Cmd + V', description: 'Paste a Twitch, Kick or YouTube link anywhere to add it' },
  { keys: 'S', description: 'Toggle the sidebar' },
  { keys: 'F', description: 'Toggle Single focus layout' },
  { keys: 'Z', description: 'Theater mode: hide the bars so streams fill the window' },
  { keys: 'N / P', description: 'Focus the next / previous stream (moves the audio too)' },
  { keys: '1 – 9', description: 'Focus the stream in that position' },
  { keys: 'C', description: 'Collapse or expand all card controls' },
  { keys: 'R', description: 'Reset the current layout' },
  { keys: 'T', description: 'Cycle the theme (dark / light / system)' },
  { keys: 'M', description: 'Mute or unmute all streams' },
  { keys: '?', description: 'Show this shortcuts panel' },
  { keys: 'Esc', description: 'Close any open dialog, or leave theater mode' },
]

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  return (
    <Modal title="Keyboard shortcuts" isOpen={isOpen} onClose={onClose} size="sm">
      <p className="mb-3 text-sm text-text-muted">
        Shortcuts are disabled while typing in a text field or while a dialog is open.
      </p>
      <dl className="flex flex-col divide-y divide-border">
        {SHORTCUTS.map((s) => (
          <div key={s.keys} className="flex items-center justify-between gap-3 py-2">
            <dt>
              <kbd className="rounded-md border border-border bg-surface px-2 py-1 text-xs font-mono text-text">
                {s.keys}
              </kbd>
            </dt>
            <dd className="text-right text-sm text-text-muted">{s.description}</dd>
          </div>
        ))}
      </dl>
    </Modal>
  )
}
