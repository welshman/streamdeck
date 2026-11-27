import { Eye, Trash2, Star, Clock, Search, X, Layers } from 'lucide-react'
import { FormEvent, useMemo, useState } from 'react'
import { LayoutMode, Scene, StreamEntry, RecentStream } from '@/types/stream'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { cx } from '@/utils/classNames'

interface SidebarProps {
  open: boolean
  side: 'left' | 'right'
  hiddenStreams: StreamEntry[]
  favoriteStreams: StreamEntry[]
  recents: RecentStream[]
  scenes: Scene[]
  activeCount: number
  onClose: () => void
  onUnhide: (id: string) => void
  onUnhideAll: () => void
  onDelete: (stream: StreamEntry) => void
  onToggleFavorite: (id: string) => void
  onAddFromRecent: (recent: RecentStream) => void
  onRemoveRecent: (recent: RecentStream) => void
  onClearRecents: () => void
  onSaveScene: (name: string) => boolean
  onApplyScene: (scene: Scene) => void
  onDeleteScene: (scene: Scene) => void
}

type Tab = 'hidden' | 'favorites' | 'recent' | 'scenes'

const TABS: Tab[] = ['hidden', 'favorites', 'recent', 'scenes']

const LAYOUT_NAMES: Record<LayoutMode, string> = {
  grid: 'Auto grid',
  'columns-2': '2 columns',
  'columns-3': '3 columns',
  'columns-4': '4 columns',
  pip: 'Picture-in-picture',
  focus: 'Single focus',
}

export function Sidebar({
  open,
  side,
  hiddenStreams,
  favoriteStreams,
  recents,
  scenes,
  activeCount,
  onClose,
  onUnhide,
  onUnhideAll,
  onDelete,
  onToggleFavorite,
  onAddFromRecent,
  onRemoveRecent,
  onClearRecents,
  onSaveScene,
  onApplyScene,
  onDeleteScene,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>('hidden')
  const [query, setQuery] = useState('')
  const [sceneName, setSceneName] = useState('')

  const filteredHidden = useMemo(
    () => hiddenStreams.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())),
    [hiddenStreams, query],
  )

  if (!open) return null

  const tabLabel = (t: Tab): string => {
    switch (t) {
      case 'hidden':
        return `Hidden ${hiddenStreams.length}`
      case 'favorites':
        return `Favorites ${favoriteStreams.length}`
      case 'recent':
        return `Recent ${recents.length}`
      case 'scenes':
        return `Scenes ${scenes.length}`
    }
  }

  const handleSaveScene = (e: FormEvent) => {
    e.preventDefault()
    if (onSaveScene(sceneName)) setSceneName('')
  }

  return (
    <>
      {/* Small screens only: tapping outside the slide-over sidebar closes it. */}
      <div
        className="fixed inset-x-0 bottom-8 top-14 z-20 bg-black/40 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={cx(
          // Small screens: slides over the streams instead of squeezing them. lg+: normal docked column.
          'fixed bottom-8 top-14 z-30 flex w-72 max-w-[85vw] flex-col border-border bg-surface-raised shadow-card-lg',
          'lg:static lg:z-auto lg:max-w-none lg:shrink-0 lg:bg-surface-raised/60 lg:shadow-none',
          side === 'left' ? 'left-0 border-r lg:order-first' : 'right-0 border-l lg:order-last',
        )}
        aria-label="Saved and hidden streams"
      >
        <div className="flex border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={cx(
                'flex-1 px-1 py-2.5 text-xs font-semibold capitalize',
                tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text',
              )}
              aria-pressed={tab === t}
            >
              {tabLabel(t)}
            </button>
          ))}
        </div>

        {tab === 'hidden' && (
          <div className="flex items-center gap-2 border-b border-border px-3 py-2">
            <Search className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search hidden streams"
              className="w-full bg-transparent text-sm text-text placeholder:text-text-muted focus:outline-none"
              aria-label="Search hidden streams"
            />
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {tab === 'hidden' &&
            (filteredHidden.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">
                No hidden streams. Hide a stream from the grid to store it here without deleting it.
              </p>
            ) : (
              <>
                {hiddenStreams.length > 1 && query.trim() === '' && (
                  <div className="mb-1.5 flex items-center justify-between px-1">
                    <span className="text-xs text-text-muted">{hiddenStreams.length} hidden</span>
                    <button
                      type="button"
                      onClick={onUnhideAll}
                      className="rounded text-xs text-text-muted underline hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                    >
                      Unhide all
                    </button>
                  </div>
                )}
                <ul className="flex flex-col gap-1.5">
                  {filteredHidden.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                      <PlatformBadge platform={s.platform} />
                      <span className="min-w-0 flex-1 truncate text-sm text-text">{s.label}</span>
                      <Tooltip content="Unhide stream">
                        <IconButton label={`Unhide ${s.label}`} onClick={() => onUnhide(s.id)}>
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip content="Delete permanently">
                        <IconButton label={`Permanently delete ${s.label}`} variant="danger" onClick={() => onDelete(s)}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </>
            ))}

          {tab === 'favorites' &&
            (favoriteStreams.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">
                No favorites yet. Star a stream card to pin it here for quick reference.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {favoriteStreams.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                    <PlatformBadge platform={s.platform} />
                    <span className="min-w-0 flex-1 truncate text-sm text-text">{s.label}</span>
                    <Tooltip content="Remove from favorites">
                      <IconButton label={`Remove ${s.label} from favorites`} onClick={() => onToggleFavorite(s.id)}>
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                      </IconButton>
                    </Tooltip>
                  </li>
                ))}
              </ul>
            ))}

          {tab === 'recent' &&
            (recents.length === 0 ? (
              <p className="p-3 text-sm text-text-muted">
                Streams you add will show up here for quick re-adding later.
              </p>
            ) : (
              <>
                <div className="mb-1.5 flex items-center justify-between px-1">
                  <span className="text-xs text-text-muted">Newest first</span>
                  <button
                    type="button"
                    onClick={onClearRecents}
                    className="rounded text-xs text-text-muted underline hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                  >
                    Clear all
                  </button>
                </div>
                <ul className="flex flex-col gap-1.5">
                  {recents.map((r) => (
                    <li key={`${r.platform}-${r.channelOrId}`} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                      <Clock className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                      <PlatformBadge platform={r.platform} />
                      <span className="min-w-0 flex-1 truncate text-sm text-text">{r.label}</span>
                      <button
                        type="button"
                        onClick={() => onAddFromRecent(r)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-text hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        Add
                      </button>
                      <Tooltip content="Remove from recents">
                        <IconButton label={`Remove ${r.label} from recents`} onClick={() => onRemoveRecent(r)}>
                          <X className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              </>
            ))}

          {tab === 'scenes' && (
            <>
              <form onSubmit={handleSaveScene} className="mb-2 flex gap-1.5">
                <input
                  type="text"
                  value={sceneName}
                  onChange={(e) => setSceneName(e.target.value)}
                  maxLength={40}
                  placeholder="Name this setup"
                  aria-label="Scene name"
                  className="min-w-0 flex-1 rounded-md border border-border bg-surface px-2 py-1 text-sm text-text placeholder:text-text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                />
                <button
                  type="submit"
                  disabled={activeCount === 0 || sceneName.trim() === ''}
                  className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white hover:bg-accent-hover disabled:opacity-40"
                >
                  Save
                </button>
              </form>
              <p className="mb-2 px-1 text-xs text-text-muted">
                Saves your current streams, layout and focused stream. Loading a scene moves any other
                streams to Hidden, so nothing is lost.
              </p>
              {scenes.length === 0 ? (
                <p className="p-3 text-sm text-text-muted">
                  No scenes yet. Set up your streams, name the setup above, and save it.
                </p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {scenes.map((scene) => (
                    <li key={scene.id} className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2">
                      <Layers className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-text">{scene.name}</p>
                        <p className="truncate text-xs text-text-muted">
                          {scene.streams.length} stream{scene.streams.length === 1 ? '' : 's'} · {LAYOUT_NAMES[scene.layout]}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onApplyScene(scene)}
                        className="rounded-md border border-border px-2 py-1 text-xs font-medium text-text hover:bg-surface-raised focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
                      >
                        Load
                      </button>
                      <Tooltip content="Delete scene">
                        <IconButton label={`Delete scene ${scene.name}`} variant="danger" onClick={() => onDeleteScene(scene)}>
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </IconButton>
                      </Tooltip>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
