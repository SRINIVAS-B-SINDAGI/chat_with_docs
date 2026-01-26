import { API_BASE } from '../constants'
import { QueryResponse, IngestResponse, JobStatusResponse } from '../types'

/**
 * Send a question to the RAG API
 */
export async function askQuestion(question: string): Promise<QueryResponse> {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || 'Failed to get answer')
  }

  return response.json()
}

/**
 * Upload a document for ingestion
 */
export async function uploadDocument(file: File): Promise<IngestResponse> {
  const formData = new FormData()
  formData.append('file', file)

  const response = await fetch(`${API_BASE}/ingest`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Upload failed' }))
    throw new Error(error.detail || 'Failed to upload document')
  }

  return response.json()
}

/**
 * Get the status of an ingestion job
 */
export async function getJobStatus(jobId: string): Promise<JobStatusResponse> {
  const response = await fetch(`${API_BASE}/ingest/${jobId}/status`)

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Status check failed' }))
    throw new Error(error.detail || 'Failed to get job status')
  }

  return response.json()
}
