import { useEffect, useMemo } from 'react'
import { ThemeMode } from '@/types/stream'

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
}

/** Applies the resolved theme (dark/light) to the document root as a
 * class, so Tailwind's `dark:` variant and CSS custom properties react. */
export function useTheme(theme: ThemeMode) {
  const resolved = useMemo(() => {
    if (theme === 'system') return systemPrefersDark() ? 'dark' : 'light'
    return theme
  }, [theme])

  useEffect(() => {
    const root = document.documentElement
    root.classList.toggle('dark', resolved === 'dark')
    root.style.colorScheme = resolved
  }, [resolved])

  useEffect(() => {
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = () => {
      document.documentElement.classList.toggle('dark', mq.matches)
    }
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [theme])

  return resolved
}
