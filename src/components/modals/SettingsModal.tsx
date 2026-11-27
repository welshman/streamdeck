import { useEffect, useState } from 'react'
import { Download, Upload, Copy, Check, ShieldCheck, RefreshCw } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { DashboardSettings, Density } from '@/types/stream'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  settings: DashboardSettings
  onSetDensity: (density: Density) => void
  onSetSidebarSide: (side: 'left' | 'right') => void
  onSetNewStreamsCollapsed: (value: boolean) => void
  onReloadAll: () => void
  onExport: () => string
  onImport: (json: string) => { ok: boolean; error?: string }
  onResetLayout: () => void
  onClearAll: () => void
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSetDensity,
  onSetSidebarSide,
  onSetNewStreamsCollapsed,
  onReloadAll,
  onExport,
  onImport,
  onResetLayout,
  onClearAll,
}: SettingsModalProps) {
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState(false)
  const [copied, setCopied] = useState(false)

  // This component stays mounted while the dialog is closed, so clear it out on close.
  // Otherwise reopening it shows the old import text and old error/success messages.
  useEffect(() => {
    if (!isOpen) {
      setImportText('')
      setImportError(null)
      setImportSuccess(false)
      setCopied(false)
    }
  }, [isOpen])

  function handleExportDownload() {
    const json = onExport()
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `streamdeck-config-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleCopyToClipboard() {
    const json = onExport()
    // navigator.clipboard only exists in secure contexts (https or localhost). On plain
    // http (e.g. a LAN IP) fall back to the older execCommand approach so the button
    // still works.
    const fallback = () => {
      const ta = document.createElement('textarea')
      ta.value = json
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(json)
        setCopied(true)
        window.setTimeout(() => setCopied(false), 2000)
      } catch {
        fallback()
      }
    } else {
      fallback()
    }
  }

  function handleImport() {
    setImportError(null)
    setImportSuccess(false)
    const result = onImport(importText)
    if (!result.ok) {
      setImportError(result.error ?? 'Import failed.')
    } else {
      setImportSuccess(true)
      setImportText('')
    }
  }

  function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      setImportError(null)
      setImportSuccess(false)
      const result = onImport(text)
      if (!result.ok) {
        setImportError(result.error ?? 'Import failed.')
      } else {
        setImportSuccess(true)
      }
    }
    reader.onerror = () => {
      setImportError('Could not read that file.')
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <Modal title="Settings" isOpen={isOpen} onClose={onClose} size="lg">
      <div className="flex flex-col gap-6">
        <section>
          <h3 className="mb-1 text-sm font-semibold text-text">Display density</h3>
          <div className="flex gap-2">
            {(['comfortable', 'compact'] as Density[]).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onSetDensity(d)}
                aria-pressed={settings.density === d}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  settings.density === d
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold text-text">Sidebar position</h3>
          <div className="flex gap-2">
            {(['left', 'right'] as const).map((side) => (
              <button
                key={side}
                type="button"
                onClick={() => onSetSidebarSide(side)}
                aria-pressed={settings.sidebarSide === side}
                className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${
                  settings.sidebarSide === side
                    ? 'border-accent bg-accent/10 text-accent'
                    : 'border-border text-text-muted hover:text-text'
                }`}
              >
                {side}
              </button>
            ))}
          </div>
        </section>

        <section>
          <h3 className="mb-1 text-sm font-semibold text-text">Streams</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onSetNewStreamsCollapsed(!settings.newStreamsCollapsed)}
              aria-pressed={settings.newStreamsCollapsed}
              className={`rounded-lg border px-3 py-1.5 text-sm ${
                settings.newStreamsCollapsed
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border text-text-muted hover:text-text'
              }`}
            >
              New streams start with controls collapsed
            </button>
            <button
              type="button"
              onClick={onReloadAll}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface"
            >
              <RefreshCw className="h-4 w-4" aria-hidden="true" />
              Reload all players
            </button>
          </div>
        </section>

        <section className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-accent" aria-hidden="true" />
          <div>
            <h3 className="text-sm font-semibold text-text">Privacy &amp; local storage</h3>
            <p className="mt-1 text-sm text-text-muted">
              StreamDeck runs entirely in your browser. Your stream list, layout, and preferences
              are saved only in this browser&apos;s localStorage — nothing is sent to any server.
              Clearing your browser data, using a different browser, or using private/incognito
              mode will not carry your settings over. Use export/import below to back up or move
              your configuration.
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-sm font-semibold text-text">Backup &amp; restore</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportDownload}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface"
            >
              <Download className="h-4 w-4" aria-hidden="true" />
              Download JSON
            </button>
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
              {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface">
              <Upload className="h-4 w-4" aria-hidden="true" />
              Import file
              <input type="file" accept="application/json" onChange={handleFileImport} className="hidden" />
            </label>
          </div>

          <div className="mt-3">
            <label htmlFor="import-textarea" className="mb-1 block text-xs font-medium text-text-muted">
              Or paste configuration JSON
            </label>
            <textarea
              id="import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              placeholder="Paste exported JSON here"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="mt-2 rounded-lg bg-accent px-3 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              Import
            </button>
            {importError && <p className="mt-1.5 text-sm text-red-400">{importError}</p>}
            {importSuccess && <p className="mt-1.5 text-sm text-green-500">Configuration imported successfully.</p>}
          </div>
        </section>

        <section className="border-t border-border pt-4">
          <h3 className="mb-2 text-sm font-semibold text-text">Danger zone</h3>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onResetLayout}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface"
            >
              Reset layout
            </button>
            <button
              type="button"
              onClick={onClearAll}
              className="rounded-lg border border-red-500/40 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
            >
              Remove all streams
            </button>
          </div>
        </section>
      </div>
    </Modal>
  )
}
