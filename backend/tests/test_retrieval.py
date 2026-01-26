"""Tests for retrieval guardrails and RAG behavior."""

import pytest
from unittest.mock import patch, MagicMock
from langchain_core.documents import Document

from app.rag import (
    format_source_info,
    REFUSAL_RESPONSE,
)


class TestSourceFormatting:
    """Tests for source information extraction."""

    def test_format_source_with_all_metadata(self):
        """Should extract all metadata fields."""
        doc = MagicMock()
        doc.metadata = {
            "source": "report.pdf",
            "page": 5,
            "section": "Introduction"
        }

        result = format_source_info(doc)

        assert result["source"] == "report.pdf"
        assert result["page"] == 5
        assert result["section"] == "Introduction"

    def test_format_source_with_missing_metadata(self):
        """Should handle missing optional metadata."""
        doc = MagicMock()
        doc.metadata = {"source": "doc.txt"}

        result = format_source_info(doc)

        assert result["source"] == "doc.txt"
        assert result["page"] is None
        assert result["section"] is None

    def test_format_source_unknown_source(self):
        """Should default to 'unknown' when source is missing."""
        doc = MagicMock()
        doc.metadata = {}

        result = format_source_info(doc)

        assert result["source"] == "unknown"


class TestRefusalBehavior:
    """Tests for refusal response when no relevant context found."""

    def test_refusal_response_structure(self):
        """Refusal response should have correct structure."""
        assert "answer" in REFUSAL_RESPONSE
        assert "confidence" in REFUSAL_RESPONSE
        assert "sources" in REFUSAL_RESPONSE

    def test_refusal_confidence_is_one(self):
        """Refusal should have confidence of 1."""
        assert REFUSAL_RESPONSE["confidence"] == 1

    def test_refusal_sources_empty(self):
        """Refusal should have empty sources list."""
        assert REFUSAL_RESPONSE["sources"] == []

    @patch("app.rag.load_vectorstore")
    @patch("app.rag.ChatGroq")
    def test_no_llm_call_on_refusal(self, mock_groq, mock_vectorstore):
        """LLM should NOT be called when no relevant docs found."""
        from app.rag import answer_question

        # Mock vectorstore to return results with high scores (not relevant)
        mock_vs = MagicMock()
        mock_doc = MagicMock()
        mock_doc.metadata = {"source": "test.pdf"}
        # Score of 1.5 is above default threshold of 0.8
        mock_vs.similarity_search_with_score.return_value = [
            (mock_doc, 1.5),
            (mock_doc, 1.8),
        ]
        mock_vectorstore.return_value = mock_vs

        result = answer_question("What is quantum computing?")

        # Verify LLM was never called
        mock_groq.assert_not_called()

        # Verify refusal response returned
        assert result["confidence"] == 1
        assert result["sources"] == []


class TestRelevantRetrieval:
    """Tests for behavior when relevant context is found."""

    @patch("app.rag.load_vectorstore")
    @patch("app.rag.ChatGroq")
    def test_llm_called_with_relevant_docs(self, mock_groq, mock_vectorstore):
        """LLM should be called when relevant docs found."""
        from app.rag import answer_question

        # Mock vectorstore to return relevant results (low scores)
        mock_vs = MagicMock()
        mock_doc = MagicMock()
        mock_doc.page_content = "Test content about AI"
        mock_doc.metadata = {"source": "ai.pdf", "page": 1}
        # Score of 0.3 is below default threshold of 0.8
        mock_vs.similarity_search_with_score.return_value = [
            (mock_doc, 0.3),
        ]
        mock_vectorstore.return_value = mock_vs

        # Mock LLM response
        mock_llm_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.content = '{"answer": "AI is...", "confidence": 8}'
        mock_llm_instance.invoke.return_value = mock_response
        mock_groq.return_value = mock_llm_instance

        result = answer_question("What is AI?")

        # Verify LLM was called
        mock_groq.assert_called_once()
        mock_llm_instance.invoke.assert_called_once()

        # Verify sources are included
        assert len(result["sources"]) > 0
        assert result["sources"][0]["source"] == "ai.pdf"

    @patch("app.rag.load_vectorstore")
    @patch("app.rag.ChatGroq")
    def test_sources_include_page_and_section(self, mock_groq, mock_vectorstore):
        """Sources should include page and section when available."""
        from app.rag import answer_question

        mock_vs = MagicMock()
        mock_doc = MagicMock()
        mock_doc.page_content = "Results section content"
        mock_doc.metadata = {
            "source": "paper.pdf",
            "page": 5,
            "section": "Results"
        }
        mock_vs.similarity_search_with_score.return_value = [(mock_doc, 0.2)]
        mock_vectorstore.return_value = mock_vs

        mock_llm_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.content = '{"answer": "The results...", "confidence": 9}'
        mock_llm_instance.invoke.return_value = mock_response
        mock_groq.return_value = mock_llm_instance

        result = answer_question("What are the results?")

        assert result["sources"][0]["page"] == 5
        assert result["sources"][0]["section"] == "Results"
