/**
 * Central client-side "store" for StreamDeck. Implemented as a single
 * hook (no external state library needed) that owns streams + settings,
 * persists to localStorage on every change, and exposes a typed API
 * to the rest of the app.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DashboardSettings,
  LayoutMode,
  ParsedStreamInput,
  PersistedState,
  RecentStream,
  StreamEntry,
} from '@/types/stream'
import { generateId } from '@/utils/id'
import {
  exportStateToJson,
  importStateFromJson,
  loadState,
  pushRecent,
  saveState,
  storageAvailable,
} from '@/utils/storage'
import { decodeShareHash } from '@/utils/shareLink'

export interface ToastMessage {
  id: string
  text: string
  tone: 'info' | 'success' | 'error'
}

function reorder(streams: StreamEntry[]): StreamEntry[] {
  return streams
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s, idx) => ({ ...s, order: idx }))
}

export function useDashboardStore() {
  const initial = useMemo(() => loadState(), [])
  const [streams, setStreams] = useState<StreamEntry[]>(initial.value.streams)
  const [settings, setSettings] = useState<DashboardSettings>(initial.value.settings)
  const [recents, setRecents] = useState<RecentStream[]>(initial.value.recents)
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const hydratedFromShare = useRef(false)
  const saveWarned = useRef(false)

  const pushToast = useCallback((text: string, tone: ToastMessage['tone'] = 'info') => {
    const id = generateId('toast')
    setToasts((t) => [...t, { id, text, tone }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((toast) => toast.id !== id))
    }, 4000)
  }, [])

  // Tell the user once if their saved data couldn't be read (a backup copy
  // of the unreadable data is kept by loadState before it is replaced).
  useEffect(() => {
    if (!initial.ok && storageAvailable) {
      pushToast("Your saved data couldn't be read, so StreamDeck started fresh. A backup copy was kept in this browser.", 'error')
    }
  }, [initial, pushToast])

  // Apply a shared config from the URL hash exactly once on first load.
  useEffect(() => {
    if (hydratedFromShare.current) return
    hydratedFromShare.current = true
    const shared = decodeShareHash(window.location.hash)
    if (shared && shared.streams.length > 0) {
      setStreams(reorder(shared.streams))
      setSettings((prev) => ({
        ...prev,
        layout: shared.layout,
        featuredStreamId: shared.featuredStreamId,
      }))
      pushToast('Loaded shared configuration from link.', 'success')
      history.replaceState(null, '', window.location.pathname + window.location.search)
    }
  }, [pushToast])

  useEffect(() => {
    const state: PersistedState = { version: 1, streams, settings, recents }
    const result = saveState(state)
    if (result.ok) {
      saveWarned.current = false
    } else if (result.error && storageAvailable && !saveWarned.current) {
      saveWarned.current = true
      pushToast(result.error, 'error')
    }
  }, [streams, settings, recents, pushToast])

  const dismissToast = useCallback((id: string) => {
    setToasts((t) => t.filter((toast) => toast.id !== id))
  }, [])

  const addStream = useCallback(
    (parsed: ParsedStreamInput, options?: { label?: string }) => {
      let didAdd = false
      setStreams((prev) => {
        const isDuplicate = prev.some(
          (s) => s.platform === parsed.platform && s.channelOrId === parsed.channelOrId && !s.isHidden,
        )
        if (isDuplicate) {
          return prev
        }
        didAdd = true
        const maxOrder = prev.reduce((max, s) => Math.max(max, s.order), -1)
        const entry: StreamEntry = {
          id: generateId(),
          platform: parsed.platform,
          channelOrId: parsed.channelOrId,
          originalUrl: parsed.originalUrl,
          label: options?.label?.trim() || parsed.label,
          isHidden: false,
          isFavorite: false,
          isMuted: true,
          showChat: false,
          chatPosition: 'side',
          controlsCollapsed: true,
          order: maxOrder + 1,
          addedAt: Date.now(),
        }
        return [...prev, entry]
      })
      setRecents((prev) =>
        pushRecent(prev, {
          platform: parsed.platform,
          channelOrId: parsed.channelOrId,
          label: options?.label?.trim() || parsed.label,
          lastUsedAt: Date.now(),
        }),
      )
      return didAdd
    },
    [],
  )

  const removeStream = useCallback((id: string) => {
    setStreams((prev) => reorder(prev.filter((s) => s.id !== id)))
    setSettings((prev) => (prev.featuredStreamId === id ? { ...prev, featuredStreamId: null } : prev))
  }, [])

  const hideStream = useCallback((id: string) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, isHidden: true } : s)))
    setSettings((prev) => (prev.featuredStreamId === id ? { ...prev, featuredStreamId: null } : prev))
  }, [])

  const unhideStream = useCallback((id: string) => {
    setStreams((prev) => {
      const maxOrder = prev.reduce((max, s) => Math.max(max, s.order), -1)
      return prev.map((s) => (s.id === id ? { ...s, isHidden: false, order: maxOrder + 1 } : s))
    })
  }, [])

  const toggleFavorite = useCallback((id: string) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, isFavorite: !s.isFavorite } : s)))
  }, [])

  const toggleMute = useCallback((id: string) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, isMuted: !s.isMuted } : s)))
  }, [])

  const setMuteAll = useCallback((muted: boolean, exceptId?: string) => {
    setStreams((prev) => prev.map((s) => (s.id === exceptId ? s : { ...s, isMuted: muted })))
  }, [])

  const toggleChat = useCallback((id: string) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, showChat: !s.showChat } : s)))
  }, [])

  const updateLabel = useCallback((id: string, label: string) => {
    setStreams((prev) => prev.map((s) => (s.id === id ? { ...s, label: label.trim() || s.label } : s)))
  }, [])

  const toggleControlsCollapsed = useCallback((id: string) => {
    setStreams((prev) =>
      prev.map((s) => (s.id === id ? { ...s, controlsCollapsed: !s.controlsCollapsed } : s)),
    )
  }, [])

  const setAllControlsCollapsed = useCallback((collapsed: boolean) => {
    setStreams((prev) => prev.map((s) => ({ ...s, controlsCollapsed: collapsed })))
  }, [])

  // Setting a stream as featured swaps audio to it: the newly-featured
  // stream is unmuted and every other stream is muted, so only one audio
  // source ever plays at a time. Un-featuring (passing null) leaves mute
  // states as they are, since there's no longer a single "main" stream to
  // prefer audio from.
  const setFeatured = useCallback((id: string | null) => {
    setSettings((prev) => ({ ...prev, featuredStreamId: id }))
    if (id) {
      setStreams((prev) => prev.map((s) => ({ ...s, isMuted: s.id !== id })))
    }
  }, [])

  const setLayout = useCallback((layout: LayoutMode) => {
    setSettings((prev) => ({ ...prev, layout }))
  }, [])

  const setTheme = useCallback((theme: DashboardSettings['theme']) => {
    setSettings((prev) => ({ ...prev, theme }))
  }, [])

  const setDensity = useCallback((density: DashboardSettings['density']) => {
    setSettings((prev) => ({ ...prev, density }))
  }, [])

  const setSidebarOpen = useCallback((open: boolean) => {
    setSettings((prev) => ({ ...prev, sidebarOpen: open }))
  }, [])

  const setSidebarSide = useCallback((side: DashboardSettings['sidebarSide']) => {
    setSettings((prev) => ({ ...prev, sidebarSide: side }))
  }, [])

  // `orderedIds` is the desired order of the visible streams. We must
  // assign each stream its new position explicitly: reorder() sorts by the
  // existing `order` field, so passing a re-arranged array straight into it
  // would just restore the old order (the "snaps back" bug).
  const reorderStreams = useCallback((orderedIds: string[]) => {
    setStreams((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]))
      const reordered = orderedIds
        .map((id) => byId.get(id))
        .filter((s): s is StreamEntry => Boolean(s))
      const untouched = prev.filter((s) => !orderedIds.includes(s.id))
      return [...reordered, ...untouched].map((s, idx) => ({ ...s, order: idx }))
    })
  }, [])

  const resetLayout = useCallback(() => {
    setSettings((prev) => ({
      ...prev,
      layout: 'grid',
      featuredStreamId: null,
    }))
    pushToast('Layout reset to automatic grid.', 'info')
  }, [pushToast])

  const removeRecent = useCallback((recent: RecentStream) => {
    setRecents((prev) =>
      prev.filter((r) => !(r.platform === recent.platform && r.channelOrId === recent.channelOrId)),
    )
  }, [])

  const clearRecents = useCallback(() => {
    setRecents([])
  }, [])

  const exportConfig = useCallback((): string => {
    return exportStateToJson({ version: 1, streams, settings, recents })
  }, [streams, settings, recents])

  const importConfig = useCallback(
    (json: string): { ok: boolean; error?: string } => {
      const result = importStateFromJson(json)
      if (!result.ok || !result.value) {
        return { ok: false, error: result.error }
      }
      setStreams(reorder(result.value.streams))
      setSettings(result.value.settings)
      setRecents(result.value.recents)
      return { ok: true }
    },
    [],
  )

  const clearAllStreams = useCallback(() => {
    setStreams([])
    setSettings((prev) => ({ ...prev, featuredStreamId: null }))
  }, [])

  const visibleStreams = useMemo(
    () => reorder(streams.filter((s) => !s.isHidden)),
    [streams],
  )
  const hiddenStreams = useMemo(() => streams.filter((s) => s.isHidden), [streams])

  return {
    streams,
    visibleStreams,
    hiddenStreams,
    settings,
    recents,
    toasts,
    storageAvailable,
    pushToast,
    dismissToast,
    addStream,
    removeStream,
    hideStream,
    unhideStream,
    toggleFavorite,
    toggleMute,
    setMuteAll,
    toggleChat,
    updateLabel,
    toggleControlsCollapsed,
    setAllControlsCollapsed,
    setFeatured,
    setLayout,
    setTheme,
    setDensity,
    setSidebarOpen,
    setSidebarSide,
    reorderStreams,
    resetLayout,
    removeRecent,
    clearRecents,
    exportConfig,
    importConfig,
    clearAllStreams,
  }
}

export type DashboardStore = ReturnType<typeof useDashboardStore>
