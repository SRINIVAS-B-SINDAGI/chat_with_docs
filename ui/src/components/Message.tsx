import { Message as MessageType, SourceInfo } from '../types'
import { ThinkingIndicator } from './ThinkingIndicator'

interface MessageProps {
  message: MessageType
}

/**
 * Format a source object for display
 */
function formatSource(source: SourceInfo): string {
  let text = source.source || 'unknown'
  const parts: string[] = []

  if (source.page) {
    parts.push(`p. ${source.page}`)
  }
  if (source.section) {
    parts.push(`"${source.section}"`)
  }

  if (parts.length > 0) {
    text += ` (${parts.join(', ')})`
  }

  return text
}

/**
 * User avatar SVG
 */
function UserAvatar() {
  return (
    <div className="message-avatar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>
  )
}

/**
 * Bot avatar SVG
 */
function BotAvatar() {
  return (
    <div className="message-avatar">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    </div>
  )
}

/**
 * Message component for user and bot messages
 */
export function Message({ message }: MessageProps) {
  const isUser = message.type === 'user'

  return (
    <div className={`message ${message.type} message-enter`}>
      {isUser ? <UserAvatar /> : <BotAvatar />}
      <div className="bubble">
        {!isUser && (
          <div className="answer-label">
            {message.id === 'welcome' ? 'System Initialization' : 'Analysis Result'}
          </div>
        )}
        <div className="answer-text">{message.text}</div>

        {/* Confidence badge for bot messages */}
        {!isUser && message.confidence !== undefined && (
          <div className="confidence-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22,4 12,14.01 9,11.01"/>
            </svg>
            Confidence: {message.confidence}/10
          </div>
        )}

        {/* Sources section for bot messages */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <>
            <div className="sources-title">Referenced Sources</div>
            <div className="sources-container">
              {message.sources.map((src, index) => (
                <span key={index} className="source">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                    <polyline points="14,2 14,8 20,8"/>
                  </svg>
                  {formatSource(src)}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Thinking message shown while waiting for bot response
 */
export function ThinkingMessage() {
  return (
    <div
      className="message bot message-enter"
      role="status"
      aria-live="polite"
      aria-label="Processing your query"
    >
      <BotAvatar />
      <div className="bubble">
        <ThinkingIndicator />
      </div>
    </div>
  )
}
