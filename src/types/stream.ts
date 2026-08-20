/**
 * Core domain types for StreamDeck.
 * Kept in one file so persistence, parsing, and UI code all share
 * a single source of truth for the shape of stream data.
 */

export type Platform = 'twitch' | 'kick' | 'youtube'

export type LayoutMode =
  | 'grid'
  | 'columns-2'
  | 'columns-3'
  | 'columns-4'
  | 'featured'
  | 'pip'
  | 'focus'

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

export interface DashboardSettings {
  theme: ThemeMode
  layout: LayoutMode
  density: Density
  featuredStreamId: string | null
  sidebarOpen: boolean
  sidebarSide: 'left' | 'right'
  chatsGloballyHidden: boolean
  hideOfflineStreams: boolean
  reducedMotionOverride: boolean | null
}

export interface PersistedState {
  version: number
  streams: StreamEntry[]
  settings: DashboardSettings
  recents: RecentStream[]
}

export const CURRENT_STATE_VERSION = 1

export const DEFAULT_SETTINGS: DashboardSettings = {
  theme: 'dark',
  layout: 'grid',
  density: 'comfortable',
  featuredStreamId: null,
  sidebarOpen: true,
  sidebarSide: 'right',
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
