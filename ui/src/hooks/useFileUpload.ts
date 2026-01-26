import { useState, useCallback } from 'react'
import { UploadStatus } from '../types'
import { uploadDocument, getJobStatus } from '../services/api'
import { VALID_FILE_EXTENSIONS, POLL_INTERVAL, MAX_POLL_ATTEMPTS } from '../constants'

export function useFileUpload() {
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle' })

  const validateFile = useCallback((file: File): string | null => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!VALID_FILE_EXTENSIONS.includes(ext)) {
      return 'Only PDF and TXT files are supported'
    }
    return null
  }, [])

  const pollJobStatus = useCallback(async (jobId: string) => {
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      try {
        const data = await getJobStatus(jobId)

        if (data.status === 'completed') {
          setStatus({
            type: 'success',
            filename: data.filename,
            chunksAdded: data.chunks_added
          })
          return
        } else if (data.status === 'failed') {
          setStatus({
            type: 'error',
            message: data.error || 'Ingestion failed'
          })
          return
        }

        // Still processing
        setStatus({
          type: 'processing',
          filename: data.filename,
          jobId
        })
      } catch (error) {
        console.error('Error polling job status:', error)
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL))
    }

    // Timeout
    setStatus({
      type: 'error',
      message: 'Ingestion timeout - please check server logs'
    })
  }, [])

  const upload = useCallback(async (file: File) => {
    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setStatus({ type: 'error', message: validationError })
      return
    }

    // Start upload
    setStatus({ type: 'uploading', filename: file.name })

    try {
      const response = await uploadDocument(file)

      // Start polling for completion
      setStatus({
        type: 'processing',
        filename: file.name,
        jobId: response.job_id
      })

      await pollJobStatus(response.job_id)
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      })
    }
  }, [validateFile, pollJobStatus])

  const resetStatus = useCallback(() => {
    setStatus({ type: 'idle' })
  }, [])

  return { status, upload, resetStatus }
}
