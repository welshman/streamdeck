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
import { StreamCard } from './StreamCard'
import { cx } from '@/utils/classNames'

interface StreamGridProps {
  streams: StreamEntry[]
  layout: LayoutMode
  density: 'compact' | 'comfortable'
  featuredStreamId: string | null
  onReorder: (orderedIds: string[]) => void
  onRemove: (stream: StreamEntry) => void
  onHide: (id: string) => void
  onSetFeatured: (id: string | null) => void
  onToggleFavorite: (id: string) => void
  onToggleMute: (id: string) => void
  onToggleChat: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
}

const GRID_CLASSES: Record<LayoutMode, string> = {
  grid: 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  'columns-2': 'grid grid-cols-1 gap-4 sm:grid-cols-2',
  'columns-3': 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3',
  'columns-4': 'grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4',
  featured: '',
  pip: '',
  focus: '',
}

export function StreamGrid({
  streams,
  layout,
  density,
  featuredStreamId,
  onReorder,
  onRemove,
  onHide,
  onSetFeatured,
  onToggleFavorite,
  onToggleMute,
  onToggleChat,
  onUpdateLabel,
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
    onRemove,
    onHide,
    onSetFeatured,
    onToggleFavorite,
    onToggleMute,
    onToggleChat,
    onUpdateLabel,
  })

  if (layout === 'focus') {
    const focused = streams.find((s) => s.id === featuredStreamId) ?? streams[0]
    const rest = streams.filter((s) => s.id !== focused?.id)
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-4">
          {focused && (
            <div className="mx-auto w-full max-w-4xl">
              <StreamCard {...cardProps(focused)} />
            </div>
          )}
          {rest.length > 0 && (
            <SortableContext items={rest.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
                {rest.map((s) => (
                  <div key={s.id} className="aspect-video">
                    <StreamCard {...cardProps(s)} />
                  </div>
                ))}
              </div>
            </SortableContext>
          )}
        </div>
      </DndContext>
    )
  }

  if (layout === 'featured' || layout === 'pip') {
    const featured = streams.find((s) => s.id === featuredStreamId) ?? streams[0]
    const secondary = streams.filter((s) => s.id !== featured?.id)

    // Both "featured" and "pip" now share the same core idea: the featured
    // stream dominates the viewport (roughly 3/4 of the visible height) on
    // every screen size, with the remaining streams demoted to a compact,
    // horizontally-scrollable strip underneath. "pip" additionally overlays
    // that strip near the bottom-right corner of the featured player for a
    // picture-in-picture feel; "featured" keeps it as a normal row below.
    if (layout === 'pip') {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="relative flex flex-col gap-3">
            {featured && (
              <div className="h-[calc(100vh-11rem)] min-h-[420px] w-full">
                <StreamCard {...cardProps(featured)} />
              </div>
            )}
            {secondary.length > 0 && (
              <SortableContext items={secondary.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-end px-3">
                  <div className="pointer-events-auto flex max-w-full gap-2 overflow-x-auto rounded-xl bg-black/40 p-2 backdrop-blur-sm">
                    {secondary.map((s) => (
                      <div key={s.id} className="h-24 w-40 shrink-0 sm:h-28 sm:w-48">
                        <StreamCard {...cardProps(s)} />
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

    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col gap-3">
          {featured && (
            <div className="h-[calc(100vh-13rem)] min-h-[420px] w-full">
              <StreamCard {...cardProps(featured)} />
            </div>
          )}
          {secondary.length > 0 && (
            <SortableContext items={secondary.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {secondary.map((s) => (
                  <div key={s.id} className="h-28 w-48 shrink-0 sm:h-32 sm:w-56">
                    <StreamCard {...cardProps(s)} />
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
            <StreamCard key={s.id} {...cardProps(s)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
