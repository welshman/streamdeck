import { describe, it, expect, beforeEach } from 'vitest'
import { loadState, saveState, clearState, importStateFromJson, exportStateToJson } from './storage'
import { DEFAULT_SETTINGS } from '@/types/stream'

beforeEach(() => {
  window.localStorage.clear()
})

describe('storage', () => {
  it('returns an empty state when nothing is saved', () => {
    const result = loadState()
    expect(result.ok).toBe(true)
    expect(result.value.streams).toEqual([])
    expect(result.value.scenes).toEqual([])
  })

  it('saves and loads state round-trip', () => {
    const state = {
      version: 1,
      streams: [],
      settings: { ...DEFAULT_SETTINGS, layout: 'focus' as const },
      recents: [],
      scenes: [],
    }
    expect(saveState(state).ok).toBe(true)
    const loaded = loadState()
    expect(loaded.ok).toBe(true)
    expect(loaded.value.settings.layout).toBe('focus')
  })

  it('migrates old data missing new fields without crashing', () => {
    const legacy = {
      version: 1,
      streams: [
        {
          id: 's1',
          platform: 'twitch',
          channelOrId: 'alice',
          originalUrl: 'https://twitch.tv/alice',
        },
      ],
      settings: {},
      recents: [],
    }
    window.localStorage.setItem('streamdeck:state:v1', JSON.stringify(legacy))
    const loaded = loadState()
    expect(loaded.ok).toBe(true)
    expect(loaded.value.streams).toHaveLength(1)
    expect(loaded.value.streams[0].controlsCollapsed).toBe(true)
    expect(loaded.value.streams[0].isMuted).toBe(true)
    expect(loaded.value.settings.newStreamsCollapsed).toBe(true)
    expect(loaded.value.settings.dockChat).toBe(false)
  })

  it('keeps a backup when saved data is corrupt', () => {
    window.localStorage.setItem('streamdeck:state:v1', 'not-json')
    const loaded = loadState()
    expect(loaded.ok).toBe(false)
    expect(window.localStorage.getItem('streamdeck:state:v1:corrupt-backup')).toBe('not-json')
  })

  it('importStateFromJson rejects invalid JSON and non-object payloads', () => {
    expect(importStateFromJson('not-json').ok).toBe(false)
    expect(importStateFromJson('[]').ok).toBe(false)
  })

  it('exportStateToJson produces valid JSON that importStateFromJson accepts', () => {
    const state = {
      version: 1,
      streams: [],
      settings: { ...DEFAULT_SETTINGS },
      recents: [],
      scenes: [],
    }
    const json = exportStateToJson(state)
    const result = importStateFromJson(json)
    expect(result.ok).toBe(true)
    expect(result.value?.settings.layout).toBe(DEFAULT_SETTINGS.layout)
  })

  it('clearState removes the saved key', () => {
    const state = {
      version: 1,
      streams: [],
      settings: { ...DEFAULT_SETTINGS },
      recents: [],
      scenes: [],
    }
    saveState(state)
    clearState()
    expect(window.localStorage.getItem('streamdeck:state:v1')).toBeNull()
  })
})
