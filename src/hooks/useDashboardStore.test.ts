import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDashboardStore } from './useDashboardStore'
import { StreamEntry, ParsedStreamInput, Scene } from '@/types/stream'

function makeStream(id: string, order: number, overrides: Partial<StreamEntry> = {}): StreamEntry {
  return {
    id,
    platform: 'twitch',
    channelOrId: id,
    originalUrl: `https://twitch.tv/${id}`,
    label: id,
    isHidden: false,
    isFavorite: false,
    isMuted: true,
    showChat: false,
    chatPosition: 'side',
    controlsCollapsed: true,
    order,
    addedAt: 0,
    ...overrides,
  }
}

function makeParsed(id: string): ParsedStreamInput {
  return {
    platform: 'twitch',
    channelOrId: id,
    originalUrl: `https://twitch.tv/${id}`,
    label: id,
  }
}

function makeScene(id: string, name: string, channels: string[], featuredIndex: number | null = null): Scene {
  return {
    id,
    name,
    streams: channels.map((c) => ({
      platform: 'twitch' as const,
      channelOrId: c,
      originalUrl: `https://twitch.tv/${c}`,
      label: c,
    })),
    layout: 'grid' as const,
    featuredIndex,
    savedAt: 0,
  }
}

beforeEach(() => {
  window.localStorage.clear()
})

describe('useDashboardStore', () => {
  it('adds a stream and rejects a duplicate of the same platform/channel', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('alice'))
    })
    expect(result.current.visibleStreams).toHaveLength(1)
    expect(result.current.visibleStreams[0].channelOrId).toBe('alice')
    act(() => {
      const added = result.current.addStream(makeParsed('alice'))
      expect(added).toBe(false)
    })
    expect(result.current.visibleStreams).toHaveLength(1)
  })

  it('reorders visible streams and persists the new order', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.addStream(makeParsed('b'))
      result.current.addStream(makeParsed('c'))
    })
    const ids = result.current.visibleStreams.map((s) => s.id)
    act(() => {
      result.current.reorderStreams([ids[2], ids[0], ids[1]])
    })
    const labels = result.current.visibleStreams.map((s) => s.channelOrId)
    expect(labels).toEqual(['c', 'a', 'b'])
    const orders = result.current.visibleStreams.map((s) => s.order)
    expect(orders).toEqual([0, 1, 2])
  })

  it('restores a removed stream via undo at roughly its old position', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.addStream(makeParsed('b'))
      result.current.addStream(makeParsed('c'))
    })
    const removed = result.current.visibleStreams[1]
    act(() => {
      result.current.removeStream(removed.id)
    })
    expect(result.current.visibleStreams).toHaveLength(2)
    act(() => {
      result.current.restoreStream(removed)
    })
    expect(result.current.visibleStreams).toHaveLength(3)
    expect(result.current.visibleStreams.map((s) => s.channelOrId)).toEqual(['a', 'b', 'c'])
  })

  it('hides a stream and unhides it without deleting it', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
    })
    const id = result.current.visibleStreams[0].id
    act(() => {
      result.current.hideStream(id)
    })
    expect(result.current.visibleStreams).toHaveLength(0)
    expect(result.current.hiddenStreams).toHaveLength(1)
    act(() => {
      result.current.unhideStream(id)
    })
    expect(result.current.visibleStreams).toHaveLength(1)
    expect(result.current.hiddenStreams).toHaveLength(0)
  })

  it('saving a scene captures visible streams, layout and focus; applying it reuses existing streams', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.addStream(makeParsed('b'))
    })
    const focusedId = result.current.visibleStreams[1].id
    act(() => {
      result.current.setFeatured(focusedId)
    })
    let saved = false
    act(() => {
      saved = result.current.saveScene('My scene')
    })
    expect(saved).toBe(true)
    expect(result.current.scenes).toHaveLength(1)
    expect(result.current.scenes[0].name).toBe('My scene')
    expect(result.current.scenes[0].featuredIndex).toBe(1)

    // Remove both streams, then load the scene: streams should come back (reused, not duplicated).
    act(() => {
      result.current.visibleStreams.forEach((s) => result.current.removeStream(s.id))
    })
    expect(result.current.visibleStreams).toHaveLength(0)
    act(() => {
      result.current.applyScene(result.current.scenes[0])
    })
    expect(result.current.visibleStreams.map((s) => s.channelOrId)).toEqual(['a', 'b'])
    expect(result.current.settings.featuredStreamId).toBe(focusedId)
  })

  it('applying a scene moves streams not in the scene to Hidden, not deleted', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.addStream(makeParsed('b'))
      result.current.addStream(makeParsed('c'))
    })
    const scene = makeScene('s1', 'Only a', ['a'])
    act(() => {
      const moved = result.current.applyScene(scene)
      expect(moved).toBe(2)
    })
    expect(result.current.visibleStreams.map((s) => s.channelOrId)).toEqual(['a'])
    expect(result.current.hiddenStreams.map((s) => s.channelOrId).sort()).toEqual(['b', 'c'])
  })

  it('saving a scene with the same name replaces the old one', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
    })
    act(() => {
      result.current.saveScene('Same name')
    })
    act(() => {
      result.current.addStream(makeParsed('b'))
    })
    act(() => {
      result.current.saveScene('Same name')
    })
    expect(result.current.scenes).toHaveLength(1)
    expect(result.current.scenes[0].streams).toHaveLength(2)
  })

  it('defaults: new streams start collapsed, muted, and not featured', () => {
    const { result } = renderHook(() => useDashboardStore())
    expect(result.current.settings.newStreamsCollapsed).toBe(true)
    expect(result.current.settings.dockChat).toBe(false)
    act(() => {
      result.current.addStream(makeParsed('a'))
    })
    const added = result.current.visibleStreams[0]
    expect(added.controlsCollapsed).toBe(true)
    expect(added.isMuted).toBe(true)
    expect(result.current.settings.featuredStreamId).toBeNull()
  })

  it('setFeatured unmutes the focused stream and mutes all others', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.addStream(makeParsed('b'))
    })
    const a = result.current.visibleStreams[0]
    const b = result.current.visibleStreams[1]
    act(() => {
      result.current.setFeatured(a.id)
    })
    expect(result.current.visibleStreams.find((s) => s.id === a.id)?.isMuted).toBe(false)
    expect(result.current.visibleStreams.find((s) => s.id === b.id)?.isMuted).toBe(true)
  })

  it('export and import round-trip preserves streams and scenes', () => {
    const { result } = renderHook(() => useDashboardStore())
    act(() => {
      result.current.addStream(makeParsed('a'))
      result.current.saveScene('Round trip')
    })
    let json = ''
    act(() => {
      json = result.current.exportConfig()
    })
    act(() => {
      result.current.clearAllStreams()
    })
    expect(result.current.visibleStreams).toHaveLength(0)
    act(() => {
      const res = result.current.importConfig(json)
      expect(res.ok).toBe(true)
    })
    expect(result.current.visibleStreams.map((s) => s.channelOrId)).toEqual(['a'])
    expect(result.current.scenes).toHaveLength(1)
    expect(result.current.scenes[0].name).toBe('Round trip')
  })
})
