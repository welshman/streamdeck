import { useEffect, useRef } from 'react'

export interface ShortcutHandlers {
  onAddStream: () => void
  onToggleSidebar: () => void
  onFocusMode: () => void
  onToggleTheater: () => void
  onResetLayout: () => void
  onShowHelp: () => void
  onToggleTheme: () => void
  onMuteAllToggle: () => void
  onToggleControls: () => void
  onCycleFocus: (direction: 1 | -1) => void
  onFocusIndex: (index: number) => void
  onEscape: () => void
}

/** Global keyboard shortcuts. Ignores keystrokes while the user is
 * typing in an input/textarea/select, and (apart from Escape) while a
 * dialog is open, so shortcuts never hijack forms or stack dialogs. */
export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  // Keep the latest handlers in a ref so the listener is registered once
  // instead of being torn down and re-added on every render.
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    function isTypingTarget(el: EventTarget | null): boolean {
      if (!(el instanceof HTMLElement)) return false
      const tag = el.tagName.toLowerCase()
      return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable
    }

    function onKeyDown(e: KeyboardEvent) {
      const h = handlersRef.current
      if (isTypingTarget(e.target)) {
        if (e.key === 'Escape') h.onEscape()
        return
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return

      if (e.key === 'Escape') {
        h.onEscape()
        return
      }
      if (document.querySelector('[aria-modal="true"]')) return

      if (/^[1-9]$/.test(e.key)) {
        h.onFocusIndex(Number(e.key) - 1)
        return
      }

      switch (e.key.toLowerCase()) {
        case 'a':
          h.onAddStream()
          break
        case 's':
          h.onToggleSidebar()
          break
        case 'f':
          h.onFocusMode()
          break
        case 'z':
          h.onToggleTheater()
          break
        case 'n':
          h.onCycleFocus(1)
          break
        case 'p':
          h.onCycleFocus(-1)
          break
        case 'c':
          h.onToggleControls()
          break
        case 'r':
          h.onResetLayout()
          break
        case '?':
          h.onShowHelp()
          break
        case 't':
          h.onToggleTheme()
          break
        case 'm':
          h.onMuteAllToggle()
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}
