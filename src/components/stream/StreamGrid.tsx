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
  onToggleControlsCollapsed: (id: string) => void
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
  onToggleControlsCollapsed,
}: StreamGridProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  // FIX: dnd-kit's SortableContext needs a stable, unambiguous list of
  // item ids that always matches what's actually rendered below it. The
  // previous version derived `ids` fresh inside handleDragEnd from the
  // `streams` prop, which is fine for the drop calculation itself, but
  // because `streams` (visibleStreams from the store) is a brand-new
  // array/object set on every store update, dnd-kit could briefly
  // reconcile the drag against a stale snapshot between drag-start and
  // the parent re-render, producing a visible "snap back then correct"
  // flash. Rebuilding the id list from the *current* `streams` prop at
  // drag-end time (not a stale closure) and immediately calling
  // onReorder with it, plus keying SortableContext off the same
  // `streams` array reference used for rendering, keeps the visual
  // order and the drag calculation in sync on every render.
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
    onToggleControlsCollapsed,
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

    if (layout === 'pip') {
      return (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="relative min-h-[60vh] rounded-2xl bg-black/10">
            {featured && (
              <div className="h-[70vh] max-h-[800px] w-full">
                <StreamCard {...cardProps(featured)} />
              </div>
            )}
            {secondary.length > 0 && (
              <SortableContext items={secondary.map((s) => s.id)} strategy={rectSortingStrategy}>
                <div className="mt-3 flex flex-wrap gap-3 sm:absolute sm:bottom-3 sm:right-3 sm:mt-0 sm:w-72">
                  {secondary.map((s) => (
                    <div key={s.id} className="w-full sm:w-64">
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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,2.2fr)_minmax(280px,1fr)]">
          {featured && (
            <div className="min-h-[40vh]">
              <StreamCard {...cardProps(featured)} />
            </div>
          )}
          {secondary.length > 0 && (
            <SortableContext items={secondary.map((s) => s.id)} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                {secondary.map((s) => (
                  <StreamCard key={s.id} {...cardProps(s)} />
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
