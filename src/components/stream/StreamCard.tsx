import { useEffect, useState, useRef, useCallback, CSSProperties } from 'react'
import {
  X,
  EyeOff,
  Star,
  MessageSquare,
  MessageSquareOff,
  Volume2,
  VolumeX,
  Maximize,
  ExternalLink,
  RefreshCw,
  GripVertical,
  PictureInPicture2,
  Pin,
  PinOff,
  ChevronsLeft,
  ChevronsRight,
  Focus,
  Link2,
  Check,
} from 'lucide-react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { StreamEntry } from '@/types/stream'
import { StreamPlayer } from '@/components/players/StreamPlayer'
import { ChatPanel } from '@/components/players/ChatPanel'
import { PlatformBadge } from '@/components/ui/PlatformBadge'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { chatSupported } from '@/utils/embed'
import { cx } from '@/utils/classNames'

interface StreamCardProps {
  stream: StreamEntry
  isFeatured: boolean
  density: 'compact' | 'comfortable'
  fill?: boolean
  /** Bumped by "Reload all players" to remount every player. */
  reloadSignal?: number
  onFocus?: () => void
  onRemove: (stream: StreamEntry) => void
  onHide: (id: string) => void
  onSetFeatured: (id: string | null) => void
  onToggleFavorite: (id: string) => void
  onToggleMute: (id: string) => void
  onToggleChat: (id: string) => void
  onUpdateLabel: (id: string, label: string) => void
  onToggleControlsCollapsed: (id: string) => void
}

export function StreamCard({
  stream,
  isFeatured,
  density,
  fill = false,
  reloadSignal = 0,
  onFocus,
  onRemove,
  onHide,
  onSetFeatured,
  onToggleFavorite,
  onToggleMute,
  onToggleChat,
  onUpdateLabel,
  onToggleControlsCollapsed,
}: StreamCardProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const [editingLabel, setEditingLabel] = useState(false)
  const [labelDraft, setLabelDraft] = useState(stream.label)
  const [copied, setCopied] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Keep the rename box in sync with the saved label (e.g. after Undo or a scene load).
  useEffect(() => {
    if (!editingLabel) setLabelDraft(stream.label)
  }, [stream.label, editingLabel])

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: stream.id,
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const handleFullscreen = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {})
    } else {
      el.requestFullscreen?.().catch(() => {
        // Browsers block this if the site isn't allowed to go fullscreen (e.g. some
        // embedded contexts). Tell the user instead of failing silently.
        alert('Fullscreen was blocked by the browser. Try again from the main page.')
      })
    }
  }, [])

  const handlePip = useCallback(() => {
    const iframe = containerRef.current?.querySelector('iframe') as
      | (HTMLIFrameElement & { requestPictureInPicture?: () => Promise<unknown> })
      | null
    if (!iframe) return
    // Cross-origin iframes generally cannot be handed to
    // requestPictureInPicture; tell the user instead of failing silently.
    if (typeof iframe.requestPictureInPicture === 'function') {
      iframe.requestPictureInPicture?.().catch(() => {
        alert('Picture-in-picture isn\'t available for this embedded player.')
      })
    } else {
      alert('Picture-in-picture isn\'t available for this embedded player.')
    }
  }, [])

  const handleCopyLink = useCallback(() => {
    // navigator.clipboard only exists in secure contexts (https or localhost). On plain
    // http (e.g. a LAN IP) fall back to the older execCommand approach so the button
    // still works.
    const fallback = () => {
      const ta = document.createElement('textarea')
      ta.value = stream.originalUrl
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      if (ok) {
        setCopied(true)
        window.setTimeout(() => setCopied(false), 1500)
      } else {
        alert('Copy failed. The link is: ' + stream.originalUrl)
      }
    }
    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(stream.originalUrl)
        .then(() => {
          setCopied(true)
          window.setTimeout(() => setCopied(false), 1500)
        })
        .catch(fallback)
    } else {
      fallback()
    }
  }, [stream.originalUrl])

  const commitLabel = () => {
    // Only save when the value actually changed, so clicking another button
    // (which blurs the input) doesn't fire a spurious save.
    if (labelDraft.trim() !== stream.label) {
      onUpdateLabel(stream.id, labelDraft)
    }
    setEditingLabel(false)
  }

  const showChatPanel = stream.showChat
  const isCompact = density === 'compact'
  const isCollapsed = stream.controlsCollapsed

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cx(
        'group relative flex flex-col overflow-hidden rounded-xl border bg-surface-raised shadow-card transition-shadow',
        fill && 'h-full',
        isFeatured ? 'border-accent/50 ring-1 ring-accent/30' : 'border-border',
        stream.accentColor && 'border-l-4',
      )}
      data-testid="stream-card"
    >
      <div
        ref={containerRef}
        className={cx('flex min-h-0 flex-1', showChatPanel ? 'flex-col sm:flex-row' : 'flex-col')}
      >
        <div
          className={cx(
            'relative flex-1',
            fill ? 'min-h-0 basis-0' : isCompact ? 'aspect-[16/10]' : 'aspect-video',
          )}
        >
          <StreamPlayer key={`${reloadKey}-${reloadSignal}`} stream={stream} />
        </div>
        {showChatPanel && (
          <ChatPanel
            stream={stream}
            className={cx('h-40 shrink-0 sm:h-auto sm:w-64', chatSupported(stream.platform) && 'sm:w-72')}
          />
        )}
      </div>

      <div className={cx('flex shrink-0 items-center gap-1.5 border-t border-border px-2', isCompact ? 'py-1' : 'py-1.5')}>
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label={`Reorder ${stream.label}`}
          className="cursor-grab touch-none rounded p-1 text-text-muted hover:text-text active:cursor-grabbing focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
        >
          <GripVertical className="h-4 w-4" aria-hidden="true" />
        </button>

        <PlatformBadge platform={stream.platform} />

        {editingLabel ? (
          <input
            autoFocus
            value={labelDraft}
            onChange={(e) => setLabelDraft(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitLabel()
              if (e.key === 'Escape') {
                setLabelDraft(stream.label)
                setEditingLabel(false)
              }
            }}
            className="min-w-0 flex-1 rounded-md border border-border bg-surface px-1.5 py-0.5 text-sm text-text focus:outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            aria-label="Edit stream label"
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingLabel(true)}
            className="min-w-0 flex-1 truncate rounded px-1 text-left text-sm font-medium text-text hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
            title="Click to rename"
          >
            {stream.label}
          </button>
        )}

        {onFocus && (
          <Tooltip content="Focus this stream">
            <IconButton label={`Focus ${stream.label}`} onClick={onFocus} className="shrink-0">
              <Focus className="h-4 w-4" aria-hidden="true" />
            </IconButton>
          </Tooltip>
        )}

        {/* Collapsing hides everything below except the essential controls,
            so a card with many streams doesn't force a wide toolbar to
            always take up space when the user doesn't need it. */}
        {!isCollapsed && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Tooltip content={stream.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton
                label={stream.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                active={stream.isFavorite}
                onClick={() => onToggleFavorite(stream.id)}
              >
                <Star className={cx('h-4 w-4', stream.isFavorite && 'fill-yellow-400 text-yellow-400')} aria-hidden="true" />
              </IconButton>
            </Tooltip>

            <Tooltip content={isFeatured ? 'Unset as featured' : 'Set as featured'}>
              <IconButton
                label={isFeatured ? 'Unset as featured stream' : 'Set as featured stream'}
                active={isFeatured}
                onClick={() => onSetFeatured(isFeatured ? null : stream.id)}
              >
                {isFeatured ? <PinOff className="h-4 w-4" aria-hidden="true" /> : <Pin className="h-4 w-4" aria-hidden="true" />}
              </IconButton>
            </Tooltip>

            <Tooltip content={stream.isMuted ? 'Unmute' : 'Mute'}>
              <IconButton label={stream.isMuted ? `Unmute ${stream.label}` : `Mute ${stream.label}`} onClick={() => onToggleMute(stream.id)}>
                {stream.isMuted ? <VolumeX className="h-4 w-4" aria-hidden="true" /> : <Volume2 className="h-4 w-4" aria-hidden="true" />}
              </IconButton>
            </Tooltip>

            <Tooltip content={showChatPanel ? 'Hide chat' : 'Show chat'}>
              <IconButton
                label={showChatPanel ? `Hide chat for ${stream.label}` : `Show chat for ${stream.label}`}
                active={showChatPanel}
                onClick={() => onToggleChat(stream.id)}
              >
                {showChatPanel ? <MessageSquareOff className="h-4 w-4" aria-hidden="true" /> : <MessageSquare className="h-4 w-4" aria-hidden="true" />}
              </IconButton>
            </Tooltip>

            <Tooltip content="Picture-in-picture">
              <IconButton label={`Try picture-in-picture for ${stream.label}`} onClick={handlePip}>
                <PictureInPicture2 className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>

            <Tooltip content="Fullscreen">
              <IconButton label={`Fullscreen ${stream.label}`} onClick={handleFullscreen}>
                <Maximize className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>

            <Tooltip content="Reload player">
              <IconButton label={`Reload ${stream.label}`} onClick={() => setReloadKey((k) => k + 1)}>
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>

            <Tooltip content={copied ? 'Link copied' : 'Copy stream link'}>
              <IconButton label={`Copy link to ${stream.label}`} onClick={handleCopyLink}>
                {copied ? (
                  <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                ) : (
                  <Link2 className="h-4 w-4" aria-hidden="true" />
                )}
              </IconButton>
            </Tooltip>

            <Tooltip content="Open original stream">
              <a
                href={stream.originalUrl}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={`Open ${stream.label} on ${stream.platform}`}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-surface hover:text-text focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            </Tooltip>

            <Tooltip content="Hide (keep saved)">
              <IconButton label={`Hide ${stream.label}`} onClick={() => onHide(stream.id)}>
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>

            <Tooltip content="Remove stream">
              <IconButton label={`Remove ${stream.label}`} variant="danger" onClick={() => onRemove(stream)}>
                <X className="h-4 w-4" aria-hidden="true" />
              </IconButton>
            </Tooltip>
          </div>
        )}

        <Tooltip content={isCollapsed ? 'Show all controls' : 'Collapse controls'}>
          <IconButton
            label={isCollapsed ? `Show all controls for ${stream.label}` : `Collapse controls for ${stream.label}`}
            active={isCollapsed}
            onClick={() => onToggleControlsCollapsed(stream.id)}
            className="shrink-0"
          >
            {isCollapsed ? (
              <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <ChevronsRight className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </IconButton>
        </Tooltip>
      </div>
    </div>
  )
}
