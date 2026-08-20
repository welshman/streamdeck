import { describe, it, expect, beforeEach } from 'vitest'
import {
  exportStateToJson,
  importStateFromJson,
  pushRecent,
  DEFAULT_DASHBOARD_SETTINGS,
} from '../storage'
import { PersistedState, RecentStream, StreamEntry } from '@/types/stream'

function makeStream(overrides: Partial<StreamEntry> = {}): StreamEntry {
  return {
    id: 'stream_1',
    platform: 'twitch',
    channelOrId: 'shroud',
    originalUrl: 'https://www.twitch.tv/shroud',
    label: 'shroud',
    isHidden: false,
    isFavorite: false,
    isMuted: true,
    showChat: false,
    chatPosition: 'side',
    order: 0,
    addedAt: Date.now(),
    ...overrides,
  }
}

describe('exportStateToJson / importStateFromJson', () => {
  it('round-trips a valid state', () => {
    const state: PersistedState = {
      version: 1,
      streams: [makeStream()],
      settings: DEFAULT_DASHBOARD_SETTINGS,
      recents: [],
    }
    const json = exportStateToJson(state)
    const result = importStateFromJson(json)
    expect(result.ok).toBe(true)
    expect(result.value?.streams).toHaveLength(1)
    expect(result.value?.streams[0].channelOrId).toBe('shroud')
  })

  it('rejects invalid JSON text', () => {
    const result = importStateFromJson('not valid json {{{')
    expect(result.ok).toBe(false)
    expect(result.error).toBeTruthy()
  })

  it('rejects a JSON value that is not an object', () => {
    const result = importStateFromJson('42')
    expect(result.ok).toBe(false)
  })

  it('fills in missing settings with defaults on import', () => {
    const result = importStateFromJson(JSON.stringify({ streams: [] }))
    expect(result.ok).toBe(true)
    expect(result.value?.settings.theme).toBe(DEFAULT_DASHBOARD_SETTINGS.theme)
  })
})

describe('pushRecent', () => {
  it('adds a new recent to the front of the list', () => {
    const recents: RecentStream[] = []
    const updated = pushRecent(recents, {
      platform: 'twitch',
      channelOrId: 'shroud',
      label: 'shroud',
      lastUsedAt: Date.now(),
    })
    expect(updated).toHaveLength(1)
    expect(updated[0].channelOrId).toBe('shroud')
  })

  it('deduplicates by platform + channelOrId, keeping the newest entry first', () => {
    const existing: RecentStream[] = [
      { platform: 'twitch', channelOrId: 'shroud', label: 'shroud', lastUsedAt: 1000 },
      { platform: 'kick', channelOrId: 'xqc', label: 'xqc', lastUsedAt: 900 },
    ]
    const updated = pushRecent(existing, {
      platform: 'twitch',
      channelOrId: 'shroud',
      label: 'shroud (renamed)',
      lastUsedAt: 2000,
    })
    expect(updated).toHaveLength(2)
    expect(updated[0].label).toBe('shroud (renamed)')
  })

  it('caps the list at the maximum recents limit', () => {
    let recents: RecentStream[] = []
    for (let i = 0; i < 20; i++) {
      recents = pushRecent(recents, {
        platform: 'twitch',
        channelOrId: `channel${i}`,
        label: `channel${i}`,
        lastUsedAt: i,
      })
    }
    expect(recents.length).toBeLessThanOrEqual(12)
  })
})
