import { useCallback, useState } from 'react'
import { useDashboardStore } from '@/hooks/useDashboardStore'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { DashboardContext } from '@/context/DashboardContext'
import { Navbar } from '@/components/layout/Navbar'
import { Sidebar } from '@/components/layout/Sidebar'
import { StatusBar } from '@/components/layout/StatusBar'
import { StreamGrid } from '@/components/stream/StreamGrid'
import { EmptyState } from '@/components/ui/EmptyState'
import { ToastStack } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { AddStreamModal } from '@/components/modals/AddStreamModal'
import { SettingsModal } from '@/components/modals/SettingsModal'
import { ShortcutsModal } from '@/components/modals/ShortcutsModal'
import { ShareLinkModal } from '@/components/stream/ShareLinkModal'
import { parseStreamInputWithHint } from '@/utils/streamParser'
import { encodeShareLink } from '@/utils/shareLink'
import { StreamEntry, Platform, RecentStream } from '@/types/stream'
import { Share2, Plus } from 'lucide-react'

function App() {
  const store = useDashboardStore()
  useTheme(store.settings.theme)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [pendingDelete, setPendingDelete] = useState<StreamEntry | null>(null)

  const handleAdd = useCallback(
    (input: string, hint: Platform | null): { ok: boolean; error?: string } => {
      try {
        const parsed = parseStreamInputWithHint(input, hint)
        const added = store.addStream(parsed)
        if (added) {
          store.pushToast(`Added ${parsed.label} (${parsed.platform}).`, 'success')
          return { ok: true }
        }
        return { ok: false, error: `"${parsed.label}" is already in your active stream list.` }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not add that stream.'
        return { ok: false, error: message }
      }
    },
    [store],
  )

  const handleAddFromRecent = useCallback(
    (recent: RecentStream) => {
      const added = store.addStream({
        platform: recent.platform,
        channelOrId: recent.channelOrId,
        originalUrl:
          recent.platform === 'youtube'
            ? `https://www.youtube.com/watch?v=${recent.channelOrId}`
            : recent.platform === 'kick'
              ? `https://kick.com/${recent.channelOrId}`
              : `https://www.twitch.tv/${recent.channelOrId}`,
        label: recent.label,
      })
      if (added) {
        store.pushToast(`Added ${recent.label}.`, 'success')
      } else {
        store.pushToast(`${recent.label} is already active.`, 'info')
      }
    },
    [store],
  )

  const handleRemoveRequest = useCallback((stream: StreamEntry) => {
    setPendingDelete(stream)
  }, [])

  const confirmDelete = useCallback(() => {
    if (pendingDelete) {
      store.removeStream(pendingDelete.id)
      store.pushToast(`Removed ${pendingDelete.label}.`, 'info')
      setPendingDelete(null)
    }
  }, [pendingDelete, store])

  const handleHide = useCallback(
    (id: string) => {
      const stream = store.streams.find((s) => s.id === id)
      store.hideStream(id)
      if (stream) store.pushToast(`Hid ${stream.label}. You can unhide it from the sidebar.`, 'info')
    },
    [store],
  )

  const handleUnhide = useCallback(
    (id: string) => {
      const stream = store.streams.find((s) => s.id === id)
      store.unhideStream(id)
      if (stream) store.pushToast(`Unhid ${stream.label}.`, 'success')
    },
    [store],
  )

  const handleMuteAll = useCallback(() => {
    const anyUnmuted = store.visibleStreams.some((s) => !s.isMuted)
    store.setMuteAll(anyUnmuted, store.settings.featuredStreamId ?? undefined)
    store.pushToast(anyUnmuted ? 'Muted all streams.' : 'Unmuted all streams.', 'info')
  }, [store])

  const handleShare = useCallback(() => {
    const link = encodeShareLink({
      streams: store.visibleStreams,
      layout: store.settings.layout,
      featuredStreamId: store.settings.featuredStreamId,
    })
    setShareLink(link)
    setShareOpen(true)
  }, [store])

  const handleImport = useCallback(
    (json: string) => {
      const result = store.importConfig(json)
      if (result.ok) {
        store.pushToast('Configuration imported.', 'success')
      }
      return result
    },
    [store],
  )

  const cycleTheme = useCallback(() => {
    const order: Array<typeof store.settings.theme> = ['dark', 'light', 'system']
    const next = order[(order.indexOf(store.settings.theme) + 1) % order.length]
    store.setTheme(next)
  }, [store])

  useKeyboardShortcuts({
    onAddStream: () => setAddModalOpen(true),
    onToggleSidebar: () => store.setSidebarOpen(!store.settings.sidebarOpen),
    onFocusMode: () => store.setLayout(store.settings.layout === 'focus' ? 'grid' : 'focus'),
    onResetLayout: () => store.resetLayout(),
    onShowHelp: () => setShortcutsOpen(true),
    onToggleTheme: cycleTheme,
    onMuteAllToggle: handleMuteAll,
    onEscape: () => {
      setAddModalOpen(false)
      setSettingsOpen(false)
      setShortcutsOpen(false)
      setShareOpen(false)
    },
  })

  const favoriteStreams = store.streams.filter((s) => s.isFavorite && !s.isHidden)

  return (
    <DashboardContext.Provider value={store}>
      <div className="flex h-screen flex-col bg-surface">
        <Navbar
          layout={store.settings.layout}
          onLayoutChange={store.setLayout}
          theme={store.settings.theme}
          onThemeChange={store.setTheme}
          sidebarOpen={store.settings.sidebarOpen}
          onToggleSidebar={() => store.setSidebarOpen(!store.settings.sidebarOpen)}
          onAddStream={() => setAddModalOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenShortcuts={() => setShortcutsOpen(true)}
          onMuteAll={handleMuteAll}
          streamCount={store.visibleStreams.length}
        />

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto p-4">
            {!store.storageAvailable && (
              <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                localStorage is unavailable in this browser context (e.g. private browsing).
                Your changes will work during this session but won&apos;t be saved after you
                close the tab.
              </div>
            )}

            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h1 className="text-sm font-medium text-text-muted">
                {store.visibleStreams.length === 0
                  ? 'No active streams'
                  : `Viewing ${store.visibleStreams.length} stream${store.visibleStreams.length === 1 ? '' : 's'}`}
              </h1>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  disabled={store.visibleStreams.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-raised disabled:opacity-40"
                >
                  <Share2 className="h-4 w-4" aria-hidden="true" />
                  Share
                </button>
              </div>
            </div>

            {store.visibleStreams.length === 0 ? (
              <EmptyState
                title="Add your first stream"
                description="Paste a Twitch, Kick, or YouTube URL — or just a channel name — to start building your multi-stream dashboard. Everything is saved locally in your browser."
                action={
                  <button
                    type="button"
                    onClick={() => setAddModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white hover:bg-accent-hover"
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Add a stream
                  </button>
                }
              />
            ) : (
              <StreamGrid
                streams={store.visibleStreams}
                layout={store.settings.layout}
                density={store.settings.density}
                featuredStreamId={store.settings.featuredStreamId}
                onReorder={store.reorderStreams}
                onRemove={handleRemoveRequest}
                onHide={handleHide}
                onSetFeatured={store.setFeatured}
                onToggleFavorite={store.toggleFavorite}
                onToggleMute={store.toggleMute}
                onToggleChat={store.toggleChat}
                onUpdateLabel={store.updateLabel}
                onToggleControlsCollapsed={store.toggleControlsCollapsed}
              />
            )}
          </main>

          <Sidebar
            open={store.settings.sidebarOpen}
            side={store.settings.sidebarSide}
            hiddenStreams={store.hiddenStreams}
            favoriteStreams={favoriteStreams}
            recents={store.recents}
            onUnhide={handleUnhide}
            onDelete={handleRemoveRequest}
            onAddFromRecent={handleAddFromRecent}
          />
        </div>

        <StatusBar
          visibleCount={store.visibleStreams.length}
          hiddenCount={store.hiddenStreams.length}
          storageAvailable={store.storageAvailable}
        />
      </div>

      <AddStreamModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onAdd={handleAdd}
        recents={store.recents}
        onAddFromRecent={handleAddFromRecent}
      />

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={store.settings}
        onSetDensity={store.setDensity}
        onSetSidebarSide={store.setSidebarSide}
        onSetHideOfflineStreams={store.setHideOfflineStreams}
        onExport={store.exportConfig}
        onImport={handleImport}
        onResetLayout={store.resetLayout}
        onClearAll={store.clearAllStreams}
      />

      <ShortcutsModal isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />

      <ShareLinkModal isOpen={shareOpen} onClose={() => setShareOpen(false)} link={shareLink} />

      <ConfirmDialog
        isOpen={pendingDelete !== null}
        title="Remove stream?"
        message={
          pendingDelete
            ? `This will permanently remove "${pendingDelete.label}" from your dashboard. If you just want to keep it without watching, use Hide instead.`
            : ''
        }
        confirmLabel="Remove"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ToastStack toasts={store.toasts} onDismiss={store.dismissToast} />
    </DashboardContext.Provider>
  )
}

export default App
