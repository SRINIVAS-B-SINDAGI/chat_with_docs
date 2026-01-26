"""Pydantic schemas for API request/response models."""

from pydantic import BaseModel
from typing import List, Optional


class QueryRequest(BaseModel):
    """Request model for /ask endpoint."""
    question: str


class SourceInfo(BaseModel):
    """Information about a document source."""
    source: str
    page: Optional[int] = None
    section: Optional[str] = None
    chunk_index: Optional[int] = None


class QueryResponse(BaseModel):
    """Response model for /ask endpoint."""
    answer: str
    confidence: int
    sources: List[SourceInfo]


class IngestResponse(BaseModel):
    """Response model for /ingest endpoint."""
    job_id: str
    message: str


class JobStatusResponse(BaseModel):
    """Response model for /ingest/{job_id}/status endpoint."""
    job_id: str
    status: str
    filename: str
    error: Optional[str] = None
    chunks_added: int = 0
