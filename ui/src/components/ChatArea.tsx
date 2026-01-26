import { Message, ThemeName } from '../types'
import { ChatHeader } from './ChatHeader'
import { ChatBox } from './ChatBox'
import { ChatInput } from './ChatInput'

interface ChatAreaProps {
  messages: Message[]
  isLoading: boolean
  theme: ThemeName
  onThemeChange: (theme: ThemeName) => void
  onSendMessage: (question: string) => void
}

/**
 * Main chat area composing header, message box, and input
 */
export function ChatArea({
  messages,
  isLoading,
  theme,
  onThemeChange,
  onSendMessage
}: ChatAreaProps) {
  return (
    <main className="chat" data-animate="main">
      <ChatHeader theme={theme} onThemeChange={onThemeChange} />
      <ChatBox messages={messages} isLoading={isLoading} />
      <ChatInput onSend={onSendMessage} disabled={isLoading} />
    </main>
  )
}
