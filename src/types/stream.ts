/**
 * Core domain types for StreamDeck.
 * Kept in one file so persistence, parsing, and UI code all share
 * a single source of truth for the shape of stream data.
 */

export type Platform = 'twitch' | 'kick' | 'youtube'

export type LayoutMode = 'grid' | 'columns-2' | 'columns-3' | 'columns-4' | 'pip' | 'focus'

const VALID_LAYOUTS: readonly string[] = ['grid', 'columns-2', 'columns-3', 'columns-4', 'pip', 'focus']

/** Coerces any saved/shared layout value into a valid LayoutMode. The
 * removed 'featured' layout maps to 'focus'; anything unknown falls
 * back to 'grid'. */
export function normalizeLayout(value: unknown): LayoutMode {
  if (value === 'featured') return 'focus'
  if (typeof value === 'string' && VALID_LAYOUTS.includes(value)) return value as LayoutMode
  return 'grid'
}

export type ChatPosition = 'side' | 'bottom' | 'hidden'

export type Density = 'compact' | 'comfortable'

export type ThemeMode = 'dark' | 'light' | 'system'

/** A single stream the user has added to their dashboard. */
export interface StreamEntry {
  /** Stable client-generated id, independent of platform/channel so
   * the same channel could theoretically be added twice if desired. */
  id: string
  platform: Platform
  /** Normalized channel name (Twitch/Kick) or video id (YouTube). */
  channelOrId: string
  /** The canonical, clickable URL to the original stream/video. */
  originalUrl: string
  /** User-facing label. Defaults to channelOrId, editable by the user. */
  label: string
  /** Optional freeform note/tag the user can attach. */
  note?: string
  /** Hex color used as a small accent strip / badge tint override. */
  accentColor?: string
  isHidden: boolean
  isFavorite: boolean
  isMuted: boolean
  showChat: boolean
  chatPosition: ChatPosition
  /** When true, the card's control toolbar is shrunk down to just the
   * drag handle, platform badge, and an expand button. */
  controlsCollapsed: boolean
  /** Sort position within the active (non-hidden) list. */
  order: number
  addedAt: number
  lastViewedAt?: number
}

export interface RecentStream {
  platform: Platform
  channelOrId: string
  label: string
  lastUsedAt: number
}

/** One stream inside a saved scene (just enough to recreate it). */
export interface SceneStream {
  platform: Platform
  channelOrId: string
  originalUrl: string
  label: string
}

/** A named, saved set of streams plus the layout and which one was focused. */
export interface Scene {
  id: string
  name: string
  streams: SceneStream[]
  layout: LayoutMode
  /** Index into `streams` of the focused stream, or null when none. */
  featuredIndex: number | null
  savedAt: number
}

export interface DashboardSettings {
  theme: ThemeMode
  layout: LayoutMode
  density: Density
  featuredStreamId: string | null
  sidebarOpen: boolean
  sidebarSide: 'left' | 'right'
  /** New streams start with their card toolbar collapsed. */
  newStreamsCollapsed: boolean
  /** In Single focus, show a chat column beside the focused stream. */
  dockChat: boolean
  chatsGloballyHidden: boolean
  hideOfflineStreams: boolean
  reducedMotionOverride: boolean | null
}

export interface PersistedState {
  version: number
  streams: StreamEntry[]
  settings: DashboardSettings
  recents: RecentStream[]
  /** Optional so data saved before scenes existed still loads. */
  scenes?: Scene[]
}

export const CURRENT_STATE_VERSION = 1

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'dark',
  layout: 'grid',
  density: 'comfortable',
  featuredStreamId: null,
  sidebarOpen: true,
  sidebarSide: 'right',
  newStreamsCollapsed: true,
  dockChat: false,
  chatsGloballyHidden: false,
  hideOfflineStreams: false,
  reducedMotionOverride: null,
}

export interface ParsedStreamInput {
  platform: Platform
  channelOrId: string
  originalUrl: string
  label: string
}

export class StreamParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'StreamParseError'
  }
}
