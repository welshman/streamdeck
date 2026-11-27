import { describe, it, expect } from 'vitest'
import { exportStateToJson, importStateFromJson, DEFAULT_DASHBOARD_SETTINGS } from '../storage'
import { PersistedState, Scene } from '@/types/stream'

const scene: Scene = {
  id: 'scene_1',
  name: 'Night shift',
  layout: 'focus',
  featuredIndex: 1,
  savedAt: 1000,
  streams: [
    { platform: 'twitch', channelOrId: 'shroud', originalUrl: 'https://www.twitch.tv/shroud', label: 'shroud' },
    { platform: 'kick', channelOrId: 'xqc', originalUrl: 'https://kick.com/xqc', label: 'xqc' },
  ],
}

describe('scenes persistence', () => {
  it('round-trips saved scenes through export and import', () => {
    const state: PersistedState = {
      version: 1,
      streams: [],
      settings: DEFAULT_DASHBOARD_SETTINGS,
      recents: [],
      scenes: [scene],
    }
    const result = importStateFromJson(exportStateToJson(state))
    expect(result.ok).toBe(true)
    expect(result.value?.scenes).toHaveLength(1)
    expect(result.value?.scenes?.[0].name).toBe('Night shift')
    expect(result.value?.scenes?.[0].featuredIndex).toBe(1)
    expect(result.value?.scenes?.[0].streams).toHaveLength(2)
  })

  it('imports older data without scenes as an empty scene list', () => {
    const result = importStateFromJson(JSON.stringify({ streams: [] }))
    expect(result.ok).toBe(true)
    expect(result.value?.scenes).toEqual([])
  })

  it('drops malformed scenes and malformed streams inside scenes', () => {
    const result = importStateFromJson(
      JSON.stringify({
        streams: [],
        scenes: [
          { nonsense: true },
          'not a scene',
          {
            id: 'ok',
            name: 'Partly valid',
            layout: 'bogus-layout',
            featuredIndex: 9,
            streams: [{ platform: 'twitch' }, scene.streams[0]],
          },
        ],
      }),
    )
    expect(result.ok).toBe(true)
    expect(result.value?.scenes).toHaveLength(1)
    const kept = result.value?.scenes?.[0]
    expect(kept?.streams).toHaveLength(1)
    expect(kept?.layout).toBe('grid')
    expect(kept?.featuredIndex).toBeNull()
  })
})
