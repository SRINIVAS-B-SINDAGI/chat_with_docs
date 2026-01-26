// API Request/Response types matching backend schemas.py

export interface QueryRequest {
  question: string
}

export interface SourceInfo {
  source: string
  page?: number
  section?: string
  chunk_index?: number
}

export interface QueryResponse {
  answer: string
  confidence: number
  sources: SourceInfo[]
}

export interface IngestResponse {
  job_id: string
  message: string
}

export interface JobStatusResponse {
  job_id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  filename: string
  error?: string
  chunks_added: number
}

// UI types

export type ThemeName = 'sunset' | 'ocean' | 'forest' | 'midnight'

export type MessageType = 'user' | 'bot'

export interface Message {
  id: string
  type: MessageType
  text: string
  confidence?: number
  sources?: SourceInfo[]
  timestamp: Date
}

export type UploadStatus = {
  type: 'idle'
} | {
  type: 'uploading'
  filename: string
} | {
  type: 'processing'
  filename: string
  jobId: string
} | {
  type: 'success'
  filename: string
  chunksAdded: number
} | {
  type: 'error'
  message: string
}
