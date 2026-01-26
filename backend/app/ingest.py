"""Document ingestion module with chunking and embedding."""

import os
import re
from typing import List, Optional

from langchain_community.document_loaders import TextLoader, PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document

from app.config import settings
from app.logger import logger


# Section header patterns for detection
SECTION_PATTERNS = [
    r'^#+\s+(.+)$',  # Markdown headers
    r'^([A-Z][A-Z\s]{2,}):?\s*$',  # ALL CAPS HEADERS
    r'^(\d+\.?\s+[A-Z].+)$',  # Numbered sections like "1. Introduction"
    r'^(Chapter\s+\d+[:\s].+)$',  # Chapter headers
    r'^(Section\s+\d+[:\s].+)$',  # Section headers
    r'^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*):$',  # Title Case Headers:
    # More flexible patterns for menus and informal documents
    r'^([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)$',  # Single/multi word title case (Biryanis, Main Course)
    r'^([A-Z][a-z]+(?:\s+[A-Z]?[a-z]+)*)\s*[-–—]\s*$',  # Title with dash (Appetizers -)
    r'^[-–—*•]\s*([A-Z][a-z].+)$',  # Bulleted headers
]


def is_likely_header(line: str) -> bool:
    """Check if a line is likely a section header based on heuristics."""
    line = line.strip()
    if not line:
        return False
    # Too long for a header
    if len(line) > 60:
        return False
    # Contains price indicators - not a header
    if re.search(r'[$₹€£]\s*\d+|\d+\s*[$₹€£]', line):
        return False
    # Looks like a sentence (ends with period, has many words)
    if line.endswith('.') and len(line.split()) > 5:
        return False
    # Short title-case line is likely a header
    if len(line) < 40 and line[0].isupper():
        words = line.split()
        if len(words) <= 4:
            return True
    return False


def detect_section(text: str) -> Optional[str]:
    """Detect section header from text using regex patterns and heuristics."""
    lines = text.strip().split('\n')
    for line in lines[:5]:  # Check first 5 lines
        line = line.strip()
        # Try regex patterns first
        for pattern in SECTION_PATTERNS:
            match = re.match(pattern, line, re.MULTILINE)
            if match:
                return match.group(1).strip()[:100]  # Limit length
        # Fall back to heuristic detection
        if is_likely_header(line):
            return line[:100]
    return None


def enhance_metadata(doc: Document, file_path: str) -> Document:
    """Enhance document metadata with source filename and section detection."""
    # Extract just the filename from the path
    filename = os.path.basename(file_path)
    doc.metadata['source'] = filename

    # PyPDFLoader already provides page numbers (0-indexed), convert to 1-indexed
    if 'page' in doc.metadata:
        doc.metadata['page'] = doc.metadata['page'] + 1

    # Detect section from content
    section = detect_section(doc.page_content)
    if section:
        doc.metadata['section'] = section

    return doc


def get_embeddings():
    """Get HuggingFace embeddings model."""
    return HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")


def load_vectorstore():
    """Load existing FAISS vectorstore or return None."""
    embeddings = get_embeddings()
    if os.path.exists(settings.VECTOR_DB_PATH):
        return FAISS.load_local(
            settings.VECTOR_DB_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )
    return None


def ingest_single_document(file_path: str) -> int:
    """
    Ingest a single document into the vector store.

    Args:
        file_path: Path to the document to ingest

    Returns:
        Number of chunks added to the vector store
    """
    documents = []
    filename = os.path.basename(file_path)

    if file_path.endswith(".txt"):
        docs = TextLoader(file_path).load()
        for doc in docs:
            doc = enhance_metadata(doc, file_path)
        documents.extend(docs)

    elif file_path.endswith(".pdf"):
        docs = PyPDFLoader(file_path).load()
        for doc in docs:
            doc = enhance_metadata(doc, file_path)
        documents.extend(docs)

    else:
        logger.warning(f"Unsupported file type: {filename}")
        return 0

    if not documents:
        logger.warning(f"No content extracted from: {filename}")
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )

    chunks = splitter.split_documents(documents)

    # Propagate sections across chunks and add chunk indexing
    current_section = None
    for i, chunk in enumerate(chunks):
        # Add chunk index for reference
        chunk.metadata['chunk_index'] = i + 1
        chunk.metadata['total_chunks'] = len(chunks)

        # Detect section in this chunk
        detected = detect_section(chunk.page_content)
        if detected:
            current_section = detected

        # Assign current section if chunk doesn't have one
        if 'section' not in chunk.metadata and current_section:
            chunk.metadata['section'] = current_section
        elif detected:
            chunk.metadata['section'] = detected

    embeddings = get_embeddings()

    if os.path.exists(settings.VECTOR_DB_PATH):
        logger.info("Loading existing FAISS index")
        vectorstore = FAISS.load_local(
            settings.VECTOR_DB_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )
        vectorstore.add_documents(chunks)
    else:
        logger.info("Creating new FAISS index")
        vectorstore = FAISS.from_documents(chunks, embeddings)

    vectorstore.save_local(settings.VECTOR_DB_PATH)

    logger.info(f"Ingested {len(chunks)} chunks from {filename}")
    return len(chunks)


def ingest_documents() -> int:
    """
    Ingest all documents from the uploads directory.

    Returns:
        Total number of chunks added to the vector store
    """
    documents = []

    for file in os.listdir(settings.DOCS_PATH):
        path = os.path.join(settings.DOCS_PATH, file)

        if file.endswith(".txt"):
            docs = TextLoader(path).load()
            for doc in docs:
                doc = enhance_metadata(doc, path)
            documents.extend(docs)

        elif file.endswith(".pdf"):
            docs = PyPDFLoader(path).load()
            for doc in docs:
                doc = enhance_metadata(doc, path)
            documents.extend(docs)

    if not documents:
        logger.warning("No documents found to ingest")
        return 0

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP
    )

    chunks = splitter.split_documents(documents)

    # Propagate sections across chunks and add chunk indexing
    current_section = None
    for i, chunk in enumerate(chunks):
        # Add chunk index for reference
        chunk.metadata['chunk_index'] = i + 1
        chunk.metadata['total_chunks'] = len(chunks)

        # Detect section in this chunk
        detected = detect_section(chunk.page_content)
        if detected:
            current_section = detected

        # Assign current section if chunk doesn't have one
        if 'section' not in chunk.metadata and current_section:
            chunk.metadata['section'] = current_section
        elif detected:
            chunk.metadata['section'] = detected

    embeddings = get_embeddings()

    if os.path.exists(settings.VECTOR_DB_PATH):
        logger.info("Loading existing FAISS index")
        vectorstore = FAISS.load_local(
            settings.VECTOR_DB_PATH,
            embeddings,
            allow_dangerous_deserialization=True
        )
        vectorstore.add_documents(chunks)
    else:
        logger.info("Creating new FAISS index")
        vectorstore = FAISS.from_documents(chunks, embeddings)

    vectorstore.save_local(settings.VECTOR_DB_PATH)

    logger.info(f"Ingested {len(chunks)} chunks successfully.")
    return len(chunks)


if __name__ == "__main__":
    ingest_documents()
