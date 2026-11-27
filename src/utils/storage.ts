/**
 * localStorage persistence layer. All reads/writes are wrapped in
 * try/catch because localStorage can throw in private-browsing modes,
 * when quota is exceeded, or when disabled entirely by the user.
 */
import {
  CURRENT_STATE_VERSION,
  DashboardSettings,
  DEFAULT_SETTINGS,
  PersistedState,
  RecentStream,
  Scene,
  SceneStream,
  StreamEntry,
  normalizeLayout,
} from '@/types/stream'

const STORAGE_KEY = 'streamdeck:state:v1'
const CORRUPT_BACKUP_KEY = 'streamdeck:state:v1:corrupt-backup'
const MAX_RECENTS = 12

export interface StorageResult<T> {
  ok: boolean
  value: T
  error?: string
}

function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__streamdeck_test__'
    window.localStorage.setItem(testKey, '1')
    window.localStorage.removeItem(testKey)
    return true
  } catch {
    return false
  }
}

export const storageAvailable = isLocalStorageAvailable()

function emptyState(): PersistedState {
  return {
    version: CURRENT_STATE_VERSION,
    streams: [],
    settings: { ...DEFAULT_SETTINGS },
    recents: [],
    scenes: [],
  }
}

/** Fills in fields that may be missing from streams persisted by an
 * older version of the app, so new optional/required fields never crash
 * the UI when reading old localStorage data or imported JSON files.
 * `controlsCollapsed` defaults to true (collapsed) so streams saved
 * before this field existed start in the same compact state as newly
 * added streams, rather than reverting to the older expanded look. */
function normalizeStream(raw: unknown): StreamEntry | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<StreamEntry>
  if (!s.id || !s.platform || !s.channelOrId || !s.originalUrl) return null
  return {
    id: s.id,
    platform: s.platform,
    channelOrId: s.channelOrId,
    originalUrl: s.originalUrl,
    label: s.label ?? s.channelOrId,
    note: s.note,
    accentColor: s.accentColor,
    isHidden: s.isHidden ?? false,
    isFavorite: s.isFavorite ?? false,
    isMuted: s.isMuted ?? true,
    showChat: s.showChat ?? false,
    chatPosition: s.chatPosition ?? 'side',
    controlsCollapsed: s.controlsCollapsed ?? true,
    order: s.order ?? 0,
    addedAt: s.addedAt ?? Date.now(),
    lastViewedAt: s.lastViewedAt,
  }
}

/** Validates a saved scene, dropping malformed streams inside it and
 * returning null if the scene itself is unusable. */
function normalizeScene(raw: unknown): Scene | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Partial<Scene>
  if (!s.id || typeof s.name !== 'string' || !Array.isArray(s.streams)) return null
  const streams: SceneStream[] = []
  for (const item of s.streams) {
    if (!item || typeof item !== 'object') continue
    const x = item as Partial<SceneStream>
    if (!x.platform || !x.channelOrId || !x.originalUrl) continue
    streams.push({
      platform: x.platform,
      channelOrId: x.channelOrId,
      originalUrl: x.originalUrl,
      label: x.label || x.channelOrId,
    })
  }
  const idx = s.featuredIndex
  return {
    id: s.id,
    name: s.name,
    streams,
    layout: normalizeLayout(s.layout),
    featuredIndex: typeof idx === 'number' && idx >= 0 && idx < streams.length ? idx : null,
    savedAt: s.savedAt ?? Date.now(),
  }
}

function migrate(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') return emptyState()
  const obj = raw as Partial<PersistedState>
  const streams = Array.isArray(obj.streams)
    ? obj.streams.map(normalizeStream).filter((s): s is StreamEntry => s !== null)
    : []
  const scenes = Array.isArray(obj.scenes)
    ? obj.scenes.map(normalizeScene).filter((s): s is Scene => s !== null)
    : []
  const savedLayout = obj.settings && typeof obj.settings === 'object' ? obj.settings.layout : undefined
  return {
    version: CURRENT_STATE_VERSION,
    streams,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(obj.settings ?? {}),
      layout: savedLayout === undefined ? DEFAULT_SETTINGS.layout : normalizeLayout(savedLayout),
    },
    recents: Array.isArray(obj.recents) ? (obj.recents as RecentStream[]) : [],
    scenes,
  }
}

export function loadState(): StorageResult<PersistedState> {
  if (!storageAvailable) {
    return { ok: false, value: emptyState(), error: 'localStorage is unavailable in this browser context.' }
  }
  let raw: string | null = null
  try {
    raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ok: true, value: emptyState() }
    const parsed = JSON.parse(raw)
    return { ok: true, value: migrate(parsed) }
  } catch (err) {
    // Keep a copy of data we couldn't read: the app is about to start from
    // an empty state and the next save would otherwise overwrite it.
    if (raw) {
      try {
        window.localStorage.setItem(CORRUPT_BACKUP_KEY, raw)
      } catch {
        /* ignore */
      }
    }
    return {
      ok: false,
      value: emptyState(),
      error: err instanceof Error ? err.message : 'Failed to read saved data.',
    }
  }
}

export function saveState(state: PersistedState): StorageResult<null> {
  if (!storageAvailable) {
    return { ok: false, value: null, error: 'localStorage is unavailable; changes will not persist.' }
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return { ok: true, value: null }
  } catch (err) {
    return {
      ok: false,
      value: null,
      error:
        err instanceof Error
          ? `Could not save: ${err.message}`
          : 'Could not save your changes (storage may be full).',
    }
  }
}

export function clearState(): void {
  if (!storageAvailable) return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
}

export function pushRecent(recents: RecentStream[], entry: RecentStream): RecentStream[] {
  const filtered = recents.filter(
    (r) => !(r.platform === entry.platform && r.channelOrId === entry.channelOrId),
  )
  return [entry, ...filtered].slice(0, MAX_RECENTS)
}

/** Serializes the full state to a pretty JSON string for export. */
export function exportStateToJson(state: PersistedState): string {
  return JSON.stringify(state, null, 2)
}

export interface ImportResult {
  ok: boolean
  value?: PersistedState
  error?: string
}

/** Parses and validates JSON text produced by exportStateToJson (or a
 * hand-edited equivalent) before it is applied to the app. */
export function importStateFromJson(json: string): ImportResult {
  try {
    const parsed = JSON.parse(json)
    if (typeof parsed !== 'object' || parsed === null) {
      return { ok: false, error: 'The provided file is not a valid StreamDeck configuration.' }
    }
    const migrated = migrate(parsed)
    if (!Array.isArray(migrated.streams)) {
      return { ok: false, error: 'The configuration is missing a valid stream list.' }
    }
    return { ok: true, value: migrated }
  } catch {
    return { ok: false, error: 'The provided text is not valid JSON.' }
  }
}

export const DEFAULT_DASHBOARD_SETTINGS: DashboardSettings = DEFAULT_SETTINGS
