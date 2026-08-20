import { useEffect } from 'react'

export interface ShortcutHandlers {
  onAddStream: () => void
  onToggleSidebar: () => void
  onFocusMode: () => void
  onResetLayout: () => void
  onShowHelp: () => void
  onToggleTheme: () => void
  onMuteAllToggle: () => void
  onEscape: () => void
}

/** Global keyboard shortcuts. Ignores keystrokes while the user is
 * typing in an input/textarea/select so shortcuts don't hijack forms. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') handlers.onEscape()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      switch (e.key.toLowerCase()) {
        case 'a':
          handlers.onAddStream()
          break
        case 's':
          handlers.onToggleSidebar()
          break
        case 'f':
          handlers.onFocusMode()
          break
        case 'r':
          handlers.onResetLayout()
          break
        case '?':
          handlers.onShowHelp()
          break
        case 't':
          handlers.onToggleTheme()
          break
        case 'm':
          handlers.onMuteAllToggle()
          break
        case 'escape':
          handlers.onEscape()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handlers])
}
