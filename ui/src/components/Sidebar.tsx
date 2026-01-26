import { UploadStatus } from '../types'
import { FileDropzone } from './FileDropzone'

interface SidebarProps {
  uploadStatus: UploadStatus
  onFileSelect: (file: File) => void
}

/**
 * Upload status display component
 */
function UploadStatusDisplay({ status }: { status: UploadStatus }) {
  if (status.type === 'idle') {
    return null
  }

  let message = ''
  let className = 'upload-status'

  switch (status.type) {
    case 'uploading':
      message = `Uploading ${status.filename}...`
      className += ' info'
      break
    case 'processing':
      message = `Processing ${status.filename}...`
      className += ' info'
      break
    case 'success':
      message = `Ingested ${status.chunksAdded} chunks from ${status.filename}`
      className += ' success'
      break
    case 'error':
      message = `Error: ${status.message}`
      className += ' error'
      break
  }

  return (
    <div className={className} aria-live="polite">
      {message}
    </div>
  )
}

/**
 * Left sidebar with branding, file upload, and status
 */
export function Sidebar({ uploadStatus, onFileSelect }: SidebarProps) {
  return (
    <aside className="sidebar" data-animate="sidebar" role="navigation" aria-label="Application navigation">
      {/* DNA Helix SVG */}
      <div className="dna-container" aria-hidden="true">
        <svg className="dna-helix" viewBox="0 0 100 200" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="helixGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#00d4aa', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#8b7cf6', stopOpacity: 1 }} />
            </linearGradient>
            <linearGradient id="helixGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#8b7cf6', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#00d4aa', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          {/* Helix Strand 1 */}
          <path
            className="helix-strand strand-1"
            d="M30,10 Q70,30 30,50 Q-10,70 30,90 Q70,110 30,130 Q-10,150 30,170 Q70,190 30,210"
            fill="none"
            stroke="url(#helixGradient1)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Helix Strand 2 */}
          <path
            className="helix-strand strand-2"
            d="M70,10 Q30,30 70,50 Q110,70 70,90 Q30,110 70,130 Q110,150 70,170 Q30,190 70,210"
            fill="none"
            stroke="url(#helixGradient2)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Base Pairs */}
          <g className="base-pairs">
            <line x1="35" y1="20" x2="65" y2="20" stroke="#00d4aa" strokeWidth="2" opacity="0.6"/>
            <line x1="25" y1="40" x2="75" y2="40" stroke="#8b7cf6" strokeWidth="2" opacity="0.6"/>
            <line x1="35" y1="60" x2="65" y2="60" stroke="#00d4aa" strokeWidth="2" opacity="0.6"/>
            <line x1="25" y1="80" x2="75" y2="80" stroke="#8b7cf6" strokeWidth="2" opacity="0.6"/>
            <line x1="35" y1="100" x2="65" y2="100" stroke="#00d4aa" strokeWidth="2" opacity="0.6"/>
            <line x1="25" y1="120" x2="75" y2="120" stroke="#8b7cf6" strokeWidth="2" opacity="0.6"/>
            <line x1="35" y1="140" x2="65" y2="140" stroke="#00d4aa" strokeWidth="2" opacity="0.6"/>
            <line x1="25" y1="160" x2="75" y2="160" stroke="#8b7cf6" strokeWidth="2" opacity="0.6"/>
            <line x1="35" y1="180" x2="65" y2="180" stroke="#00d4aa" strokeWidth="2" opacity="0.6"/>
          </g>
          {/* Nucleotide Nodes */}
          <g className="nucleotides">
            <circle cx="30" cy="10" r="4" fill="#00d4aa"/>
            <circle cx="70" cy="10" r="4" fill="#8b7cf6"/>
            <circle cx="30" cy="50" r="4" fill="#00d4aa"/>
            <circle cx="70" cy="50" r="4" fill="#8b7cf6"/>
            <circle cx="30" cy="90" r="4" fill="#00d4aa"/>
            <circle cx="70" cy="90" r="4" fill="#8b7cf6"/>
            <circle cx="30" cy="130" r="4" fill="#00d4aa"/>
            <circle cx="70" cy="130" r="4" fill="#8b7cf6"/>
            <circle cx="30" cy="170" r="4" fill="#00d4aa"/>
            <circle cx="70" cy="170" r="4" fill="#8b7cf6"/>
          </g>
        </svg>
      </div>

      <div className="sidebar-content">
        <div className="brand">
          <h1 className="brand-title">Insight</h1>
          <span className="brand-ai">AI</span>
        </div>
        <p className="brand-tagline">Document Intelligence</p>

        <div className="sidebar-badges">
          <div className="badge badge-primary">
            <span className="badge-icon">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </span>
            RAG Powered
          </div>
        </div>

        {/* File Upload Section */}
        <div className="upload-section">
          <h3 className="upload-title">Upload Documents</h3>
          <FileDropzone status={uploadStatus} onFileSelect={onFileSelect} />
          <UploadStatusDisplay status={uploadStatus} />
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="status-indicator" role="status" aria-live="polite">
          <span className="status-dot" aria-hidden="true"></span>
          <span className="status-text">System Active</span>
          <span className="sr-only">Insight AI is ready</span>
        </div>
      </div>
    </aside>
  )
}
