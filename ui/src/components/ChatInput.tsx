import { useState, useRef, useEffect } from 'react'

interface ChatInputProps {
  onSend: (question: string) => void
  disabled: boolean
}

/**
 * Chat input field with send button
 */
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Refocus after sending (when disabled changes from true to false)
  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus()
    }
  }, [disabled])

  const handleSubmit = () => {
    const trimmed = value.trim()
    if (trimmed && !disabled) {
      onSend(trimmed)
      setValue('')
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <footer className="chat-input" data-animate="input">
      <div className="input-wrapper">
        <input
          ref={inputRef}
          id="questionInput"
          type="text"
          placeholder="Ask a question about your documents..."
          aria-label="Question input"
          aria-describedby="inputInstructions"
          autoComplete="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
        />
        <span id="inputInstructions" className="sr-only">
          Type your question and press Enter or click the send button to submit
        </span>
        <div className="input-glow"></div>
      </div>
      <button
        id="sendBtn"
        className="send-btn"
        aria-label="Submit query"
        onClick={handleSubmit}
        disabled={disabled || !value.trim()}
      >
        <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 2L11 13"/>
          <path d="M22 2l-7 20-4-9-9-4 20-7z"/>
        </svg>
        <span className="btn-ripple"></span>
      </button>
    </footer>
  )
}
