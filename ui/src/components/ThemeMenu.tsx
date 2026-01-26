import { useState, useRef, useEffect } from 'react'
import { ThemeName } from '../types'
import { THEMES, THEME_LABELS } from '../constants'

interface ThemeMenuProps {
  currentTheme: ThemeName
  onThemeChange: (theme: ThemeName) => void
}

/**
 * Theme selector dropdown with toggle button
 */
export function ThemeMenu({ currentTheme, onThemeChange }: ThemeMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const handleToggle = () => {
    setIsOpen(prev => !prev)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleToggle()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const handleOptionClick = (theme: ThemeName) => {
    onThemeChange(theme)
    setIsOpen(false)
  }

  return (
    <div className="theme-toggle-wrapper" ref={wrapperRef}>
      <button
        className={`header-btn theme-toggle${isOpen ? ' active' : ''}`}
        aria-label="Change theme"
        aria-haspopup="true"
        aria-expanded={isOpen}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 2a10 10 0 0 1 0 20"/>
          <circle cx="12" cy="12" r="6"/>
          <path d="M12 6a6 6 0 0 1 0 12"/>
          <circle cx="12" cy="12" r="2"/>
        </svg>
      </button>
      <div
        className={`theme-menu${isOpen ? ' open' : ''}`}
        role="menu"
        aria-label="Color themes"
        onKeyDown={(e) => e.key === 'Escape' && setIsOpen(false)}
      >
        {THEMES.map((theme) => (
          <button
            key={theme}
            className={`theme-option${currentTheme === theme ? ' active' : ''}`}
            role="menuitem"
            data-theme={theme}
            onClick={() => handleOptionClick(theme)}
          >
            <span className={`theme-swatch ${theme}`}></span>
            {THEME_LABELS[theme]}
          </button>
        ))}
      </div>
    </div>
  )
}
