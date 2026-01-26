import { useRef, useState, useCallback } from 'react'
import { UploadStatus } from '../types'

interface FileDropzoneProps {
  status: UploadStatus
  onFileSelect: (file: File) => void
}

/**
 * Drag-and-drop file upload area with click-to-browse
 */
export function FileDropzone({ status, onFileSelect }: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isUploading = status.type === 'uploading' || status.type === 'processing'

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !isUploading) {
      e.preventDefault()
      fileInputRef.current?.click()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file)
    }
    // Reset input so same file can be selected again
    e.target.value = ''
  }

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!isUploading) {
      setIsDragOver(true)
    }
  }, [isUploading])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)

    if (isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      onFileSelect(files[0])
    }
  }, [isUploading, onFileSelect])

  const dropzoneClasses = [
    'dropzone',
    isDragOver && 'dragover',
    isUploading && 'uploading'
  ].filter(Boolean).join(' ')

  return (
    <div
      className={dropzoneClasses}
      role="button"
      tabIndex={0}
      aria-label="Drop zone for file upload"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt"
        hidden
        aria-hidden="true"
        onChange={handleFileChange}
      />
      <div className="dropzone-content">
        <svg className="dropzone-icon" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
        <p className="dropzone-text">Drop PDF or TXT files here</p>
        <p className="dropzone-hint">or click to browse</p>
      </div>
    </div>
  )
}
