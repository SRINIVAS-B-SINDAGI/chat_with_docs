import { ThemeName } from '../types'
import { ThemeMenu } from './ThemeMenu'

interface ChatHeaderProps {
  theme: ThemeName
  onThemeChange: (theme: ThemeName) => void
}

/**
 * Chat header with title, subtitle, and theme toggle
 */
export function ChatHeader({ theme, onThemeChange }: ChatHeaderProps) {
  return (
    <header className="chat-header" data-animate="header">
      <div className="header-content">
        <h2 className="header-title">Document Assistant</h2>
        <p className="header-subtitle">Ask questions about your uploaded documents</p>
      </div>
      <div className="header-actions">
        <ThemeMenu currentTheme={theme} onThemeChange={onThemeChange} />
        <button className="header-btn" aria-label="Settings">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
