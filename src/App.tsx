import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useDashboardStore } from '@/hooks/useDashboardStore'
import { useTheme } from '@/hooks/useTheme'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
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
import { StreamEntry, Platform, RecentStream, Scene } from '@/types/stream'
import { originalStreamUrl } from '@/utils/embed'
import { cx } from '@/utils/classNames'
import { Share2, Plus, Expand, Minimize2, WifiOff, MessageSquare } from 'lucide-react'

const STREAM_LINK_PATTERN = /^(https?:\/\/)?(www\.|m\.)?(twitch\.tv|kick\.com|youtube\.com|youtu\.be)\//i

function App() {
  const store = useDashboardStore()
  useTheme(store.settings.theme)

  const [addModalOpen, setAddModalOpen] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareLink, setShareLink] = useState('')
  const [pendingDelete, setPendingDelete] = useState<StreamEntry | null>(null)
  const [confirmClearAll, setConfirmClearAll] = useState(false)
  const [theater, setTheater] = useState(false)
  const [reloadSignal, setReloadSignal] = useState(0)
  const [online, setOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine))
  const wasOffline = useRef(false)
  const pushToastRef = useRef(store.pushToast)

  const activeCount = store.visibleStreams.length
  const focusedLabel = store.visibleStreams.find((s) => s.id === store.settings.featuredStreamId)?.label

  useEffect(() => {
    if (activeCount === 0) {
      document.title = 'StreamDeck'
    } else if (focusedLabel) {
      document.title = `${focusedLabel} · StreamDeck (${activeCount})`
    } else {
      document.title = `StreamDeck (${activeCount})`
    }
  }, [activeCount, focusedLabel])

  // On small screens the sidebar slides over the streams, so start with it closed.
  const { setSidebarOpen } = store
  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) setSidebarOpen(false)
  }, [setSidebarOpen])

  // Players that stalled while the connection was down will not recover on their own, so
  // when it comes back they are all reloaded once.
  useEffect(() => {
    const goOnline = () => {
      setOnline(true)
      if (wasOffline.current) {
        wasOffline.current = false
        setReloadSignal((n) => n + 1)
        pushToastRef.current('Back online — reloading players.', 'info')
      }
    }
    const goOffline = () => {
      wasOffline.current = true
      setOnline(false)
    }
    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)
    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

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

  // Paste a stream link anywhere on the page (outside text fields and dialogs) to add it.
  const handleAddRef = useRef(handleAdd)
  useEffect(() => {
    handleAddRef.current = handleAdd
    pushToastRef.current = store.pushToast
  })

  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      const target = e.target
      if (target instanceof HTMLElement) {
        const tag = target.tagName.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) return
      }
      if (document.querySelector('[aria-modal="true"]')) return
      const text = e.clipboardData?.getData('text') ?? ''
      const links = text.split(/\s+/).filter((part) => STREAM_LINK_PATTERN.test(part))
      if (links.length === 0) return
      e.preventDefault()
      for (const link of links) {
        const result = handleAddRef.current(link, null)
        if (!result.ok && result.error) pushToastRef.current(result.error, 'error')
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const handleAddFromRecent = useCallback(
    (recent: RecentStream) => {
      const added = store.addStream({
        platform: recent.platform,
        channelOrId: recent.channelOrId,
        originalUrl: originalStreamUrl(recent.platform, recent.channelOrId),
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
      const removed = pendingDelete
      store.removeStream(removed.id)
      store.pushToast(`Removed ${removed.label}.`, 'info', {
        label: 'Undo',
        onClick: () => store.restoreStream(removed),
      })
      setPendingDelete(null)
    }
  }, [pendingDelete, store])

  const confirmClearAllStreams = useCallback(() => {
    store.clearAllStreams()
    store.pushToast('Removed all streams.', 'info')
    setConfirmClearAll(false)
    setSettingsOpen(false)
  }, [store])

  const handleHide = useCallback(
    (id: string) => {
      const stream = store.streams.find((s) => s.id === id)
      store.hideStream(id)
      if (stream) {
        store.pushToast(`Hid ${stream.label}. You can unhide it from the sidebar.`, 'info', {
          label: 'Undo',
          onClick: () => store.unhideStream(id),
        })
      }
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

  const handleUnhideAll = useCallback(() => {
    const hidden = store.hiddenStreams
    hidden.forEach((s) => store.unhideStream(s.id))
    if (hidden.length > 0) {
      store.pushToast(`Unhid ${hidden.length} stream${hidden.length === 1 ? '' : 's'}.`, 'success')
    }
  }, [store])

  const handleSaveScene = useCallback(
    (name: string): boolean => {
      const ok = store.saveScene(name)
      if (ok) store.pushToast(`Saved scene "${name.trim()}".`, 'success')
      return ok
    },
    [store],
  )

  const handleApplyScene = useCallback(
    (scene: Scene) => {
      const movedToHidden = store.applyScene(scene)
      const extra =
        movedToHidden > 0
          ? ` ${movedToHidden} other stream${movedToHidden === 1 ? ' was' : 's were'} moved to Hidden.`
          : ''
      store.pushToast(`Loaded scene "${scene.name}".${extra}`, 'success')
    },
    [store],
  )

  const handleDeleteScene = useCallback(
    (scene: Scene) => {
      store.deleteScene(scene.id)
      store.pushToast(`Deleted scene "${scene.name}".`, 'info')
    },
    [store],
  )

  const handleReloadAll = useCallback(() => {
    setReloadSignal((n) => n + 1)
    store.pushToast('Reloading all players.', 'info')
  }, [store])

  const handleMuteAll = useCallback(() => {
    const anyUnmuted = store.visibleStreams.some((s) => !s.isMuted)
    store.setMuteAll(anyUnmuted, store.settings.featuredStreamId ?? undefined)
    store.pushToast(anyUnmuted ? 'Muted all streams.' : 'Unmuted all streams.', 'info')
  }, [store])

  const allControlsCollapsed = useMemo(
    () => store.visibleStreams.length > 0 && store.visibleStreams.every((s) => s.controlsCollapsed),
    [store.visibleStreams],
  )

  const handleToggleAllControlsCollapsed = useCallback(() => {
    const next = !allControlsCollapsed
    store.setAllControlsCollapsed(next)
    store.pushToast(next ? 'Collapsed all card controls.' : 'Expanded all card controls.', 'info')
  }, [allControlsCollapsed, store])

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

  // Choosing a sidebar side also opens the sidebar so the change is visible.
  const handleSetSidebarSide = useCallback(
    (side: 'left' | 'right') => {
      store.setSidebarSide(side)
      store.setSidebarOpen(true)
    },
    [store],
  )

  // Focusing a stream (via setFeatured) also moves the audio to it.
  const focusStreamAt = (index: number) => {
    const target = store.visibleStreams[index]
    if (!target) return
    store.setFeatured(target.id)
    store.pushToast(`Focused ${target.label}.`, 'info')
  }

  const cycleFocus = (direction: 1 | -1) => {
    const list = store.visibleStreams
    if (list.length === 0) return
    const currentId = store.settings.featuredStreamId ?? list[0].id
    const currentIndex = Math.max(0, list.findIndex((s) => s.id === currentId))
    focusStreamAt((currentIndex + direction + list.length) % list.length)
  }

  // The docked chat only exists in Single focus, so say so instead of silently doing nothing.
  const toggleDockChat = () => {
    if (store.settings.layout !== 'focus') {
      store.pushToast('Docked chat is available in the Single focus layout (press F).', 'info')
      return
    }
    store.setDockChat(!store.settings.dockChat)
  }

  useKeyboardShortcuts({
    onAddStream: () => setAddModalOpen(true),
    onToggleSidebar: () => store.setSidebarOpen(!store.settings.sidebarOpen),
    onFocusMode: () => store.setLayout(store.settings.layout === 'focus' ? 'grid' : 'focus'),
    onToggleTheater: () => setTheater((v) => !v),
    onToggleDockChat: toggleDockChat,
    onResetLayout: () => store.resetLayout(),
    onShowHelp: () => setShortcutsOpen(true),
    onToggleTheme: cycleTheme,
    onMuteAllToggle: handleMuteAll,
    onToggleControls: handleToggleAllControlsCollapsed,
    onCycleFocus: cycleFocus,
    onFocusIndex: focusStreamAt,
    onEscape: () => {
      setAddModalOpen(false)
      setSettingsOpen(false)
      setShortcutsOpen(false)
      setShareOpen(false)
      setTheater(false)
    },
  })

  const favoriteStreams = store.streams.filter((s) => s.isFavorite && !s.isHidden)

  return (
    <>
      <div className="flex h-screen flex-col bg-surface">
        {!theater && (
          <Navbar
            layout={store.settings.layout}
            onLayoutChange={store.setLayout}
            theme={store.settings.theme}
            onThemeChange={store.setTheme}
            sidebarOpen={store.settings.sidebarOpen}
            sidebarSide={store.settings.sidebarSide}
            onToggleSidebar={() => store.setSidebarOpen(!store.settings.sidebarOpen)}
            onAddStream={() => setAddModalOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenShortcuts={() => setShortcutsOpen(true)}
            onMuteAll={handleMuteAll}
            onToggleAllControlsCollapsed={handleToggleAllControlsCollapsed}
            allControlsCollapsed={allControlsCollapsed}
            streamCount={store.visibleStreams.length}
          />
        )}

        <div className="flex min-h-0 flex-1 overflow-hidden">
          <main className={cx('flex-1 overflow-y-auto', theater ? 'p-2' : 'p-4')}>
            {!store.storageAvailable && (
              <div className="mb-4 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-sm text-yellow-600 dark:text-yellow-400">
                localStorage is unavailable in this browser context (e.g. private browsing).
                Your changes will work during this session but won&apos;t be saved after you
                close the tab.
              </div>
            )}

            {!online && (
              <div
                role="status"
                className="mb-4 flex items-center gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
              >
                <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
                You&apos;re offline. Streams will stall until your connection returns — they&apos;ll be
                reloaded automatically when it does.
              </div>
            )}

            {!theater && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-sm font-medium text-text-muted">
                  {store.visibleStreams.length === 0
                    ? 'No active streams'
                    : `Viewing ${store.visibleStreams.length} stream${store.visibleStreams.length === 1 ? '' : 's'}`}
                </h1>
                <div className="flex gap-2">
                  {store.settings.layout === 'focus' && (
                    <button
                      type="button"
                      onClick={() => store.setDockChat(!store.settings.dockChat)}
                      aria-pressed={store.settings.dockChat}
                      disabled={store.visibleStreams.length === 0}
                      className={cx(
                        'hidden items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm hover:bg-surface-raised disabled:opacity-40 lg:inline-flex',
                        store.settings.dockChat ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text',
                      )}
                    >
                      <MessageSquare className="h-4 w-4" aria-hidden="true" />
                      Chat
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTheater(true)}
                    disabled={store.visibleStreams.length === 0}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-text hover:bg-surface-raised disabled:opacity-40"
                  >
                    <Expand className="h-4 w-4" aria-hidden="true" />
                    Theater
                  </button>
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
            )}

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
                theater={theater}
                dockChat={store.settings.dockChat}
                reloadSignal={reloadSignal}
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

          {!theater && (
            <Sidebar
              open={store.settings.sidebarOpen}
              side={store.settings.sidebarSide}
              hiddenStreams={store.hiddenStreams}
              favoriteStreams={favoriteStreams}
              recents={store.recents}
              scenes={store.scenes}
              activeCount={activeCount}
              onClose={() => store.setSidebarOpen(false)}
              onUnhide={handleUnhide}
              onUnhideAll={handleUnhideAll}
              onDelete={handleRemoveRequest}
              onToggleFavorite={store.toggleFavorite}
              onAddFromRecent={handleAddFromRecent}
              onRemoveRecent={store.removeRecent}
              onClearRecents={store.clearRecents}
              onSaveScene={handleSaveScene}
              onApplyScene={handleApplyScene}
              onDeleteScene={handleDeleteScene}
            />
          )}
        </div>

        {!theater && (
          <StatusBar
            visibleCount={store.visibleStreams.length}
            hiddenCount={store.hiddenStreams.length}
            storageAvailable={store.storageAvailable}
          />
        )}
      </div>

      {theater && (
        <button
          type="button"
          onClick={() => setTheater(false)}
          aria-label="Exit theater mode"
          title="Exit theater mode (Esc)"
          className="fixed right-3 top-3 z-50 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-surface-raised/80 text-text opacity-40 shadow-card backdrop-blur transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <Minimize2 className="h-4 w-4" aria-hidden="true" />
        </button>
      )}

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
        onSetSidebarSide={handleSetSidebarSide}
        onSetNewStreamsCollapsed={store.setNewStreamsCollapsed}
        onReloadAll={handleReloadAll}
        onExport={store.exportConfig}
        onImport={handleImport}
        onResetLayout={store.resetLayout}
        onClearAll={() => setConfirmClearAll(true)}
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

      <ConfirmDialog
        isOpen={confirmClearAll}
        title="Remove all streams?"
        message={`This will permanently remove all ${store.streams.length} saved streams (including hidden ones) from your dashboard. Export a backup from Settings first if you might want them back.`}
        confirmLabel="Remove all"
        onConfirm={confirmClearAllStreams}
        onCancel={() => setConfirmClearAll(false)}
      />

      <ToastStack toasts={store.toasts} onDismiss={store.dismissToast} />
    </>
  )
}

export default App
