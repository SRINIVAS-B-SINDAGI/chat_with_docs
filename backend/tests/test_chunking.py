"""Tests for document chunking and metadata extraction."""

import pytest
from langchain_core.documents import Document

from app.ingest import detect_section, enhance_metadata


class TestSectionDetection:
    """Tests for section header detection."""

    def test_detect_markdown_header(self):
        """Should detect markdown-style headers."""
        text = "# Introduction\n\nThis is the introduction."
        section = detect_section(text)
        assert section == "Introduction"

    def test_detect_numbered_section(self):
        """Should detect numbered sections."""
        text = "1. Overview\n\nThis section provides an overview."
        section = detect_section(text)
        assert section == "1. Overview"

    def test_detect_caps_header(self):
        """Should detect ALL CAPS headers."""
        text = "INTRODUCTION\n\nThis is the introduction."
        section = detect_section(text)
        assert section == "INTRODUCTION"

    def test_no_section_detected(self):
        """Should return None when no section header found."""
        text = "This is just regular text without any headers."
        section = detect_section(text)
        assert section is None

    def test_section_length_limit(self):
        """Should limit section name length to 100 characters."""
        long_header = "# " + "A" * 150
        text = f"{long_header}\n\nContent here."
        section = detect_section(text)
        assert len(section) <= 100


class TestMetadataEnhancement:
    """Tests for document metadata enhancement."""

    def test_source_filename_extracted(self):
        """Should extract just the filename from full path."""
        doc = Document(page_content="Test content", metadata={})
        enhanced = enhance_metadata(doc, "/path/to/document.pdf")
        assert enhanced.metadata["source"] == "document.pdf"

    def test_page_number_converted(self):
        """Should convert 0-indexed page to 1-indexed."""
        doc = Document(page_content="Test content", metadata={"page": 0})
        enhanced = enhance_metadata(doc, "/path/to/doc.pdf")
        assert enhanced.metadata["page"] == 1

    def test_section_detected_from_content(self):
        """Should detect and add section from content."""
        doc = Document(
            page_content="# Methods\n\nThis section describes methods.",
            metadata={}
        )
        enhanced = enhance_metadata(doc, "/path/to/doc.txt")
        assert enhanced.metadata.get("section") == "Methods"

    def test_all_metadata_fields_present(self):
        """Chunks should have source, page, and section metadata."""
        doc = Document(
            page_content="## Results\n\nThe results show...",
            metadata={"page": 2}
        )
        enhanced = enhance_metadata(doc, "/data/uploads/report.pdf")

        assert "source" in enhanced.metadata
        assert enhanced.metadata["source"] == "report.pdf"
        assert "page" in enhanced.metadata
        assert enhanced.metadata["page"] == 3  # 2 + 1
        assert "section" in enhanced.metadata
        assert enhanced.metadata["section"] == "Results"
