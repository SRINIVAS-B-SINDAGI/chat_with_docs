import { useState, useEffect, useCallback } from 'react'
import { ThemeName } from '../types'

const STORAGE_KEY = 'theme'
const DEFAULT_THEME: ThemeName = 'sunset'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && ['sunset', 'ocean', 'forest', 'midnight'].includes(saved)) {
      return saved as ThemeName
    }
    return DEFAULT_THEME
  })

  // Apply theme to document when it changes
  useEffect(() => {
    if (theme === 'sunset') {
      document.documentElement.removeAttribute('data-theme')
    } else {
      document.documentElement.setAttribute('data-theme', theme)
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = useCallback((newTheme: ThemeName) => {
    setThemeState(newTheme)
  }, [])

  return { theme, setTheme }
}
