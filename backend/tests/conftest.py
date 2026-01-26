"""Pytest fixtures for RAG backend tests."""

import os
import tempfile
import shutil
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.config import settings


@pytest.fixture
def test_client():
    """Create a test client for the FastAPI app."""
    return TestClient(app)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    dirpath = tempfile.mkdtemp()
    yield dirpath
    shutil.rmtree(dirpath)


@pytest.fixture
def sample_txt_file(temp_dir):
    """Create a sample text file for testing."""
    content = """# Introduction

This is a sample document for testing the RAG system.

## Section 1: Overview

The RAG system uses vector embeddings to find relevant documents.
It then uses an LLM to generate answers based on the context.

## Section 2: Features

Key features include:
- Document ingestion
- Semantic search
- Answer generation with citations

## Conclusion

This concludes the sample document.
"""
    file_path = os.path.join(temp_dir, "sample.txt")
    with open(file_path, "w") as f:
        f.write(content)
    return file_path


@pytest.fixture
def sample_pdf_content():
    """Return sample content that would be extracted from a PDF."""
    return "This is sample PDF content on page 1."


@pytest.fixture
def mock_vectorstore_path(temp_dir):
    """Create a temporary path for the vector store."""
    return os.path.join(temp_dir, "vectorstore")


@pytest.fixture
def mock_uploads_path(temp_dir):
    """Create a temporary path for uploads."""
    uploads_path = os.path.join(temp_dir, "uploads")
    os.makedirs(uploads_path, exist_ok=True)
    return uploads_path
