import { useState } from 'react'
import {
  Plus,
  LayoutGrid,
  Columns2,
  Columns3,
  Columns4,
  MonitorPlay,
  PictureInPicture2,
  Maximize2,
  Sun,
  Moon,
  Laptop,
  Settings,
  PanelRightClose,
  PanelRightOpen,
  Keyboard,
  VolumeX,
  ChevronsRight,
  ChevronsLeft,
} from 'lucide-react'
import { LayoutMode, ThemeMode } from '@/types/stream'
import { IconButton } from '@/components/ui/IconButton'
import { Tooltip } from '@/components/ui/Tooltip'
import { cx } from '@/utils/classNames'

interface NavbarProps {
  layout: LayoutMode
  onLayoutChange: (layout: LayoutMode) => void
  theme: ThemeMode
  onThemeChange: (theme: ThemeMode) => void
  sidebarOpen: boolean
  onToggleSidebar: () => void
  onAddStream: () => void
  onOpenSettings: () => void
  onOpenShortcuts: () => void
  onMuteAll: () => void
  onToggleAllControlsCollapsed: () => void
  allControlsCollapsed: boolean
  streamCount: number
}

const LAYOUTS: { id: LayoutMode; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'grid', label: 'Auto grid', icon: LayoutGrid },
  { id: 'columns-2', label: 'Two columns', icon: Columns2 },
  { id: 'columns-3', label: 'Three columns', icon: Columns3 },
  { id: 'columns-4', label: 'Four columns', icon: Columns4 },
  { id: 'featured', label: 'Featured + grid', icon: MonitorPlay },
  { id: 'pip', label: 'Picture-in-picture style', icon: PictureInPicture2 },
  { id: 'focus', label: 'Single focus', icon: Maximize2 },
]

const THEMES: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'system', label: 'System', icon: Laptop },
]

export function Navbar({
  layout,
  onLayoutChange,
  theme,
  onThemeChange,
  sidebarOpen,
  onToggleSidebar,
  onAddStream,
  onOpenSettings,
  onOpenShortcuts,
  onMuteAll,
  onToggleAllControlsCollapsed,
  allControlsCollapsed,
  streamCount,
}: NavbarProps) {
  const [layoutMenuOpen, setLayoutMenuOpen] = useState(false)
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="flex h-14 items-center gap-2 px-3 sm:px-4">
        <div className="flex items-center gap-2 pr-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white">
            <MonitorPlay className="h-[18px] w-[18px]" aria-hidden="true" />
          </div>
          <span className="hidden text-base font-bold tracking-tight text-text sm:inline">
            StreamDeck
          </span>
        </div>

        <button
          type="button"
          onClick={onAddStream}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[#1c1935] px-3 py-1.5 text-sm font-semibold text-white shadow-card hover:bg-[#2a2650] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#1c1935] focus-visible:outline-offset-2"
          >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Add stream</span>
        </button>

        <div className="relative">
          <IconButton
            label="Choose layout"
            active={layoutMenuOpen}
            onClick={() => setLayoutMenuOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={layoutMenuOpen}
          >
            <LayoutGrid className="h-[18px] w-[18px]" aria-hidden="true" />
          </IconButton>
          {layoutMenuOpen && (
            <div
              role="menu"
              className="absolute left-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-surface-raised p-1.5 shadow-card-lg animate-fade-in motion-reduce:animate-none"
              onMouseLeave={() => setLayoutMenuOpen(false)}
            >
              {LAYOUTS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  role="menuitemradio"
                  aria-checked={layout === id}
                  type="button"
                  onClick={() => {
                    onLayoutChange(id)
                    setLayoutMenuOpen(false)
                  }}
                  className={cx(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface',
                    layout === id ? 'bg-accent/10 text-accent' : 'text-text',
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <Tooltip content="Mute all streams">
          <IconButton label="Mute all streams" onClick={onMuteAll} disabled={streamCount === 0}>
            <VolumeX className="h-[18px] w-[18px]" aria-hidden="true" />
          </IconButton>
        </Tooltip>

        <Tooltip content={allControlsCollapsed ? 'Expand all card controls' : 'Collapse all card controls'}>
          <IconButton
            label={allControlsCollapsed ? 'Expand all card controls' : 'Collapse all card controls'}
            onClick={onToggleAllControlsCollapsed}
            disabled={streamCount === 0}
          >
            {allControlsCollapsed ? (
              <ChevronsLeft className="h-[18px] w-[18px]" aria-hidden="true" />
            ) : (
              <ChevronsRight className="h-[18px] w-[18px]" aria-hidden="true" />
            )}
          </IconButton>
        </Tooltip>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <IconButton
              label="Change theme"
              active={themeMenuOpen}
              onClick={() => setThemeMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={themeMenuOpen}
            >
              {theme === 'dark' ? (
                <Moon className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : theme === 'light' ? (
                <Sun className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <Laptop className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </IconButton>
            {themeMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-50 mt-2 w-40 rounded-xl border border-border bg-surface-raised p-1.5 shadow-card-lg animate-fade-in motion-reduce:animate-none"
                onMouseLeave={() => setThemeMenuOpen(false)}
              >
                {THEMES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    role="menuitemradio"
                    aria-checked={theme === id}
                    type="button"
                    onClick={() => {
                      onThemeChange(id)
                      setThemeMenuOpen(false)
                    }}
                    className={cx(
                      'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-surface',
                      theme === id ? 'bg-accent/10 text-accent' : 'text-text',
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Tooltip content="Keyboard shortcuts (?)">
            <IconButton label="Show keyboard shortcuts" onClick={onOpenShortcuts}>
              <Keyboard className="h-[18px] w-[18px]" aria-hidden="true" />
            </IconButton>
          </Tooltip>

          <Tooltip content="Settings">
            <IconButton label="Open settings" onClick={onOpenSettings}>
              <Settings className="h-[18px] w-[18px]" aria-hidden="true" />
            </IconButton>
          </Tooltip>

          <Tooltip content={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}>
            <IconButton
              label={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              onClick={onToggleSidebar}
            >
              {sidebarOpen ? (
                <PanelRightClose className="h-[18px] w-[18px]" aria-hidden="true" />
              ) : (
                <PanelRightOpen className="h-[18px] w-[18px]" aria-hidden="true" />
              )}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    </header>
  )
}
