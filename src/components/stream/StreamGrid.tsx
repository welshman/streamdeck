import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from '@dnd-kit/sortable'
import { LayoutMode, StreamEntry } from '@/types/stream'
import { SafeStreamCard } from './CardBoundary'
import { ChatPanel } from '@/components/players/ChatPanel'
import { cx } from '@/utils/classNames'

interface StreamGridProps {
  streams: StreamEntry[]
  layout: LayoutMode
  density: 'compact' | 'comfortable'
  featuredStreamId: string | null
  theater?: boolean
  dockChat?: boolean
  reloadSignal?: number
  onReorder: (orderedIds: string[]) => void
  onRemove: (stream: StreamEntry) => void
  onHide: (id: string) => void
  onSetFeatured: (id: string | null) => void
  onToggleFavorite: (id: string) => void
  onToggleMute: (id: string) => void
  onToggleChat: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onToggleControlsCollapsed: (id: string) => void
}

const GRID_CLASSES: Record<LayoutMode, string> = {
  grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  'columns-2': 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  'columns-3': 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  'columns-4': 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  pip: '',
  focus: '',
}

// On large screens the focused stream is exactly 16:9: as wide as the screen height allows, but
// always leaving room for the rail (19rem) and/or the docked chat column (21rem incl. gap).
// Class names must be written out in full so Tailwind can see them. Theater mode has no
// navbar/status bar, so it gets a larger height budget.
const FOCUS_WIDTH = {
  normal: {
    both: 'lg:w-[min(calc((100dvh_-_9.5rem)*16/9),calc(100%_-_40rem))]',
    rail: 'lg:w-[min(calc((100dvh_-_9.5rem)*16/9),calc(100%_-_19rem))]',
    chat: 'lg:w-[min(calc((100dvh_-_9.5rem)*16/9),calc(100%_-_21rem))]',
    none: 'lg:w-[min(calc((100dvh_-_9.5rem)*16/9),100%)]',
  },
  theater: {
    both: 'lg:w-[min(calc((100dvh_-_2.5rem)*16/9),calc(100%_-_40rem))]',
    rail: 'lg:w-[min(calc((100dvh_-_2.5rem)*16/9),calc(100%_-_19rem))]',
    chat: 'lg:w-[min(calc((100dvh_-_2.5rem)*16/9),calc(100%_-_21rem))]',
    none: 'lg:w-[min(calc((100dvh_-_2.5rem)*16/9),100%)]',
  },
} as const

export function StreamGrid({
  streams,
  layout,
  density,
  featuredStreamId,
  theater = false,
  dockChat = false,
  reloadSignal = 0,
  onReorder,
  onRemove,
  onHide,
  onSetFeatured,
  onToggleFavorite,
  onToggleMute,
  onToggleChat,
  onUpdateLabel,
  onToggleControlsCollapsed,
}: StreamGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const ids = streams.map((s) => s.id)
    const fromIndex = ids.indexOf(String(active.id))
    const toIndex = ids.indexOf(String(over.id))
    if (fromIndex === -1 || toIndex === -1) return
    const next = ids.slice()
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, String(active.id))
    onReorder(next)
  }

  const cardProps = (stream: StreamEntry) => ({
    stream,
    isFeatured: stream.id === featuredStreamId,
    density,
    reloadSignal,
    onRemove,
    onHide,
    onSetFeatured,
    onToggleFavorite,
    onToggleMute,
    onToggleChat,
    onUpdateLabel,
    onToggleControlsCollapsed,
  })

  if (layout === 'focus') {
    const focused = streams.find((s) => s.id === featuredStreamId) ?? streams[0]
    const rest = streams.filter((s) => s.id !== focused?.id)
    const showDockedChat = dockChat && focused !== undefined
    const hasRail = rest.length > 0
    const widthKey = hasRail ? (showDockedChat ? 'both' : 'rail') : showDockedChat ? 'chat' : 'none'
    const focusedWidth = FOCUS_WIDTH[theater ? 'theater' : 'normal'][widthKey]
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-3 lg:flex-row">
          {focused && (
            <div className={cx('aspect-video min-w-0 lg:shrink-0', focusedWidth)}>
              <SafeStreamCard {...cardProps(focused)} fill />
            </div>
          )}
          {showDockedChat && focused && (
            <div className="relative hidden overflow-hidden rounded-xl border border-border bg-surface-raised lg:block lg:w-80 lg:shrink-0">
              <ChatPanel stream={focused} className="absolute inset-0" />
            </div>
          )}
          {hasRail && (
            <SortableContext items={rest.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="min-w-0 lg:relative lg:min-h-[240px] lg:flex-1">
                <div className="flex gap-3 overflow-x-auto pb-1 lg:absolute lg:inset-0 lg:flex-col lg:overflow-y-auto lg:overflow-x-hidden lg:pb-0">
                  {rest.map((s) => (
                    <div key={s.id} className="w-64 shrink-0 lg:w-full">
                      {/* Only the focused stream may play audio: rail streams are always muted. */}
                      <SafeStreamCard {...cardProps({ ...s, isMuted: true })} onFocus={() => onSetFeatured(s.id)} />
                    </div>
                  ))}
                </div>
              </div>
            </SortableContext>
          )}
        </div>
      </DndContext>
    )
  }

  if (layout === 'pip') {
    const featured = streams.find((s) => s.id === featuredStreamId) ?? streams[0]
    const secondary = streams.filter((s) => s.id !== featured?.id)
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="relative min-h-[60vh] rounded-2xl bg-black/10">
          {featured && (
            <div className="h-[70vh] max-h-[800px] w-full">
              <SafeStreamCard {...cardProps(featured)} />
            </div>
          )}
          {secondary.length > 0 && (
            <SortableContext items={secondary.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="mt-3 flex flex-wrap gap-3 sm:absolute sm:bottom-3 sm:right-3 sm:mt-0 sm:w-72">
                {secondary.map((s) => (
                  <div key={s.id} className="w-full sm:w-64">
                    <SafeStreamCard {...cardProps(s)} />
                  </div>
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </DndContext>
    )
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={streams.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className={cx(GRID_CLASSES[layout])}>
          {streams.map((s) => (
            <SafeStreamCard key={s.id} {...cardProps(s)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
