import { useRef, useEffect } from 'react'
import { Message as MessageType } from '../types'
import { Message, ThinkingMessage } from './Message'

interface ChatBoxProps {
  messages: MessageType[]
  isLoading: boolean
}

/**
 * Scrollable chat message container with auto-scroll
 */
export function ChatBox({ messages, isLoading }: ChatBoxProps) {
  const chatBoxRef = useRef<HTMLElement>(null)

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTo({
        top: chatBoxRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [messages, isLoading])

  return (
    <section
      ref={chatBoxRef}
      id="chatBox"
      className="chat-box"
      data-animate="chat"
      aria-label="Chat messages"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((message) => (
        <Message key={message.id} message={message} />
      ))}
      {isLoading && <ThinkingMessage />}
    </section>
  )
}
