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
  StreamEntry,
} from '@/types/stream'

const STORAGE_KEY = 'streamdeck:state:v1'
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
  }
}

/** Fills in fields that may be missing from streams persisted by an
 * older version of the app, so new optional/required fields never crash
 * the UI when reading old localStorage data or imported JSON files. */
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
    controlsCollapsed: s.controlsCollapsed ?? false,
    order: s.order ?? 0,
    addedAt: s.addedAt ?? Date.now(),
    lastViewedAt: s.lastViewedAt,
  }
}

function migrate(raw: unknown): PersistedState {
  if (!raw || typeof raw !== 'object') return emptyState()
  const obj = raw as Partial<PersistedState>
  const streams = Array.isArray(obj.streams)
    ? obj.streams.map(normalizeStream).filter((s): s is StreamEntry => s !== null)
    : []
  return {
    version: CURRENT_STATE_VERSION,
    streams,
    settings: { ...DEFAULT_SETTINGS, ...(obj.settings ?? {}) },
    recents: Array.isArray(obj.recents) ? (obj.recents as RecentStream[]) : [],
  }
}

export function loadState(): StorageResult<PersistedState> {
  if (!storageAvailable) {
    return { ok: false, value: emptyState(), error: 'localStorage is unavailable in this browser context.' }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ok: true, value: emptyState() }
    const parsed = JSON.parse(raw)
    return { ok: true, value: migrate(parsed) }
  } catch (err) {
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
