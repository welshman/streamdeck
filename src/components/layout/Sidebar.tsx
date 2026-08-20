import { Eye, Trash2, Star, Clock, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { StreamEntry, RecentStream } from '@/types/stream'
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
  onUnhide: (id: string) => void
  onDelete: (stream: StreamEntry) => void
  onAddFromRecent: (recent: RecentStream) => void
}

type Tab = 'hidden' | 'favorites' | 'recent'

export function Sidebar({
  open,
  side,
  hiddenStreams,
  favoriteStreams,
  recents,
  onUnhide,
  onDelete,
  onAddFromRecent,
}: SidebarProps) {
  const [tab, setTab] = useState<Tab>('hidden')
  const [query, setQuery] = useState('')

  const filteredHidden = useMemo(
    () => hiddenStreams.filter((s) => s.label.toLowerCase().includes(query.toLowerCase())),
    [hiddenStreams, query],
  )

  if (!open) return null

  return (
    <aside
      className={cx(
        'flex w-72 shrink-0 flex-col border-border bg-surface-raised/60',
        side === 'left' ? 'border-r order-first' : 'border-l order-last',
      )}
      aria-label="Saved and hidden streams"
    >
      <div className="flex border-b border-border">
        {(['hidden', 'favorites', 'recent'] as Tab[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cx(
              'flex-1 px-2 py-2.5 text-xs font-semibold capitalize',
              tab === t ? 'border-b-2 border-accent text-accent' : 'text-text-muted hover:text-text',
            )}
            aria-pressed={tab === t}
          >
            {t === 'hidden'
              ? `Hidden (${hiddenStreams.length})`
              : t === 'favorites'
                ? `Favorites (${favoriteStreams.length})`
                : 'Recent'}
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
                  <Star className="h-3.5 w-3.5 shrink-0 fill-yellow-400 text-yellow-400" aria-hidden="true" />
                  <PlatformBadge platform={s.platform} />
                  <span className="min-w-0 flex-1 truncate text-sm text-text">{s.label}</span>
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
                </li>
              ))}
            </ul>
          ))}
      </div>
    </aside>
  )
}
