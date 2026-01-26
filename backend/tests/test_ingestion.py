"""Tests for document ingestion and job tracking."""

import os
import pytest
from unittest.mock import patch, MagicMock

from app.models import (
    JobStatus,
    Job,
    create_job,
    get_job,
    update_job,
    _job_store,
)


class TestJobStore:
    """Tests for in-memory job store operations."""

    def setup_method(self):
        """Clear job store before each test."""
        _job_store.clear()

    def test_create_job(self):
        """Should create a job with PENDING status."""
        job = create_job("test.pdf")

        assert job.job_id is not None
        assert job.status == JobStatus.PENDING
        assert job.filename == "test.pdf"
        assert job.error is None
        assert job.chunks_added == 0

    def test_get_job_exists(self):
        """Should return job when it exists."""
        created = create_job("test.pdf")
        retrieved = get_job(created.job_id)

        assert retrieved is not None
        assert retrieved.job_id == created.job_id

    def test_get_job_not_exists(self):
        """Should return None for non-existent job."""
        result = get_job("non-existent-id")
        assert result is None

    def test_update_job_status(self):
        """Should update job status."""
        job = create_job("test.pdf")
        updated = update_job(job.job_id, status=JobStatus.PROCESSING)

        assert updated is not None
        assert updated.status == JobStatus.PROCESSING

    def test_update_job_error(self):
        """Should update job error message."""
        job = create_job("test.pdf")
        update_job(job.job_id, status=JobStatus.FAILED, error="Test error")

        retrieved = get_job(job.job_id)
        assert retrieved.status == JobStatus.FAILED
        assert retrieved.error == "Test error"

    def test_update_job_chunks_added(self):
        """Should update chunks_added count."""
        job = create_job("test.pdf")
        update_job(job.job_id, status=JobStatus.COMPLETED, chunks_added=15)

        retrieved = get_job(job.job_id)
        assert retrieved.status == JobStatus.COMPLETED
        assert retrieved.chunks_added == 15


class TestIngestionEndpoint:
    """Tests for the /ingest endpoint."""

    def test_ingest_returns_job_id(self, test_client, sample_txt_file):
        """Should return a job_id when ingestion starts."""
        with open(sample_txt_file, "rb") as f:
            response = test_client.post(
                "/ingest",
                files={"file": ("sample.txt", f, "text/plain")}
            )

        assert response.status_code == 200
        data = response.json()
        assert "job_id" in data
        assert "message" in data

    def test_ingest_rejects_unsupported_file(self, test_client, temp_dir):
        """Should reject unsupported file types."""
        # Create an unsupported file type
        file_path = os.path.join(temp_dir, "test.docx")
        with open(file_path, "w") as f:
            f.write("test content")

        with open(file_path, "rb") as f:
            response = test_client.post(
                "/ingest",
                files={"file": ("test.docx", f, "application/vnd.openxmlformats")}
            )

        assert response.status_code == 400
        assert "Only PDF and TXT files are supported" in response.json()["detail"]


class TestJobStatusEndpoint:
    """Tests for the /ingest/{job_id}/status endpoint."""

    def setup_method(self):
        """Clear job store before each test."""
        _job_store.clear()

    def test_get_status_returns_job_info(self, test_client):
        """Should return job status information."""
        job = create_job("test.pdf")
        update_job(job.job_id, status=JobStatus.COMPLETED, chunks_added=10)

        response = test_client.get(f"/ingest/{job.job_id}/status")

        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] == job.job_id
        assert data["status"] == "completed"
        assert data["filename"] == "test.pdf"
        assert data["chunks_added"] == 10

    def test_get_status_not_found(self, test_client):
        """Should return 404 for non-existent job."""
        response = test_client.get("/ingest/non-existent-id/status")
        assert response.status_code == 404
