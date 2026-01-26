import { ParticleField } from './components/ParticleField'
import { Sidebar } from './components/Sidebar'
import { ChatArea } from './components/ChatArea'
import { useTheme } from './hooks/useTheme'
import { useChat } from './hooks/useChat'
import { useFileUpload } from './hooks/useFileUpload'

/**
 * Root application component
 */
export default function App() {
  const { theme, setTheme } = useTheme()
  const { messages, isLoading, sendMessage } = useChat()
  const { status: uploadStatus, upload } = useFileUpload()

  return (
    <>
      {/* Skip Link for Keyboard Navigation */}
      <a href="#questionInput" className="skip-link">Skip to chat input</a>

      {/* Particle Background */}
      <ParticleField />

      {/* Cellular Texture Overlay */}
      <div className="cellular-overlay" aria-hidden="true"></div>

      {/* Main App Layout */}
      <div className="app">
        <Sidebar uploadStatus={uploadStatus} onFileSelect={upload} />
        <ChatArea
          messages={messages}
          isLoading={isLoading}
          theme={theme}
          onThemeChange={setTheme}
          onSendMessage={sendMessage}
        />
      </div>
    </>
  )
}
