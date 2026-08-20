import { Platform } from '@/types/stream'
import { cx } from '@/utils/classNames'
import { platformLabel } from '@/utils/streamParser'

const PLATFORM_STYLES: Record<Platform, string> = {
  twitch: 'bg-twitch/15 text-twitch border-twitch/30',
  kick: 'bg-kick/15 text-kick border-kick/30',
  youtube: 'bg-youtube/15 text-youtube border-youtube/30',
}

interface PlatformBadgeProps {
  platform: Platform
  className?: string
}

export function PlatformBadge({ platform, className }: PlatformBadgeProps) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide',
        PLATFORM_STYLES[platform],
        className,
      )}
    >
      {platformLabel(platform)}
    </span>
  )
}
