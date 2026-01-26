"""Job models for async ingestion tracking."""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Dict, Optional
import uuid


class JobStatus(str, Enum):
    """Status of an ingestion job."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Job:
    """Represents an ingestion job."""
    job_id: str
    status: JobStatus
    filename: str
    error: Optional[str] = None
    chunks_added: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)


# In-memory job store
_job_store: Dict[str, Job] = {}


def create_job(filename: str) -> Job:
    """Create a new job with PENDING status."""
    job_id = str(uuid.uuid4())
    job = Job(
        job_id=job_id,
        status=JobStatus.PENDING,
        filename=filename
    )
    _job_store[job_id] = job
    return job


def get_job(job_id: str) -> Optional[Job]:
    """Get a job by ID."""
    return _job_store.get(job_id)


def update_job(
    job_id: str,
    status: Optional[JobStatus] = None,
    error: Optional[str] = None,
    chunks_added: Optional[int] = None
) -> Optional[Job]:
    """Update a job's status and/or error message."""
    job = _job_store.get(job_id)
    if job is None:
        return None

    if status is not None:
        job.status = status
    if error is not None:
        job.error = error
    if chunks_added is not None:
        job.chunks_added = chunks_added

    job.updated_at = datetime.utcnow()
    return job


def list_jobs() -> list[Job]:
    """List all jobs."""
    return list(_job_store.values())
