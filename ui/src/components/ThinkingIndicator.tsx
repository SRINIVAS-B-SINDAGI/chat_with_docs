/**
 * DNA spinner with animated dots shown while waiting for response
 */
export function ThinkingIndicator() {
  return (
    <div className="thinking-indicator">
      <div className="dna-spinner" aria-hidden="true"></div>
      <div className="thinking-text">
        Analyzing documents
        <span className="thinking-dots" aria-hidden="true">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
    </div>
  )
}
