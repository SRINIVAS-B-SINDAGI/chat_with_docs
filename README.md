# Insight AI - Document Intelligence

A production-ready RAG (Retrieval-Augmented Generation) system for question answering over documents.

## Architecture

```
                                    INSIGHT AI - RAG PIPELINE

    +-------------------+     +-------------------+     +-------------------+
    |                   |     |                   |     |                   |
    |   PDF/TXT Files   | --> |   Text Extractor  | --> |   Text Chunker    |
    |                   |     |   (PyPDF/Text)    |     |   (500 chars)     |
    +-------------------+     +-------------------+     +-------------------+
                                                                  |
                                                                  v
    +-------------------+     +-------------------+     +-------------------+
    |                   |     |                   |     |                   |
    |   FAISS Index     | <-- |   Embeddings      | <-- |   Chunks +        |
    |   (Vector Store)  |     |   (MiniLM-L6)     |     |   Metadata        |
    +-------------------+     +-------------------+     +-------------------+
              |
              |  Query Time
              v
    +-------------------+     +-------------------+     +-------------------+
    |                   |     |                   |     |                   |
    |   Similarity      | --> |   Context         | --> |   Groq LLM        |
    |   Search          |     |   Assembly        |     |   (Llama 3.1)     |
    +-------------------+     +-------------------+     +-------------------+
                                                                  |
                                                                  v
    +-------------------+
    |   Answer +        |
    |   Citations +     |
    |   Confidence      |
    +-------------------+
```

## Pipeline Overview

| Step | Component | Description |
|------|-----------|-------------|
| 1. **Upload** | FastAPI `/ingest` | Accept PDF/TXT files, create background job |
| 2. **Extract** | PyPDFLoader/TextLoader | Extract text with page numbers |
| 3. **Chunk** | RecursiveCharacterTextSplitter | Split into 500-char chunks with 50 overlap |
| 4. **Embed** | HuggingFace MiniLM-L6-v2 | Generate 384-dim vectors |
| 5. **Store** | FAISS | Index vectors for similarity search |
| 6. **Retrieve** | Similarity search | Find top-k relevant chunks (threshold: 0.8) |
| 7. **Generate** | Groq Llama 3.1 8B | Answer with inline citations |

## Quick Start

### Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/SRINIVAS-B-SINDAGI/chat_with_docs.git
cd chat_with_docs

# Create .env file with your API key
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start the application
docker compose up --build

# Access the UI at http://localhost:8000
```

### Local Development

```bash
# Clone and navigate to project
git clone https://github.com/SRINIVAS-B-SINDAGI/chat_with_docs.git
cd chat_with_docs/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment
cp ../.env.example .env
# Edit .env and add your GROQ_API_KEY

# Run the server
uvicorn app.main:app --reload

# Access the API at http://localhost:8000
# Access the UI at http://localhost:8000 (static files served)

# Run UI app
cd chat_with_docs/ui

# Install Dependencies
npm install

# Run in Development Mode
npm run dev

```

### Running Tests

```bash
cd backend

# Create virtual env to run tests
python -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install packages
pip install -r requirements.txt 

# Run tests
pytest tests/ -v
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Serve the web UI |
| `/ask` | POST | Ask a question about documents |
| `/ingest` | POST | Upload and ingest a document (async) |
| `/ingest/{job_id}/status` | GET | Check ingestion job status |
| `/upload` | POST | Upload a file (without ingestion) |
| `/ingest-all` | POST | Ingest all files in uploads folder |
| `/docs` | GET | OpenAPI documentation |

### Example Usage

```bash
# Upload and ingest a document
curl -X POST http://localhost:8000/ingest \
  -F "file=@document.pdf"

# Response: {"job_id": "abc-123", "message": "Ingestion started for document.pdf"}

# Check job status
curl http://localhost:8000/ingest/abc-123/status

# Response: {"job_id": "abc-123", "status": "completed", "filename": "document.pdf", "chunks_added": 15}

# Ask a question
curl -X POST http://localhost:8000/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "What is the main topic of the document?"}'

# Response includes answer, confidence, and structured sources with page/section info
```

## Design Trade-offs

### Why FAISS?
- **Pro**: Fast, in-memory similarity search; no external dependencies
- **Pro**: Works well for small-to-medium document collections (< 1M vectors)
- **Con**: Not persistent by default (we save/load to disk)
- **Con**: No built-in filtering or hybrid search
- **Alternative**: For production scale, consider Pinecone, Weaviate, or Qdrant

### Why This Chunking Strategy?
- **500 chars** balances context preservation with retrieval precision
- **50 char overlap** prevents information loss at chunk boundaries
- **Section detection** via regex provides cheap metadata enrichment
- **Trade-off**: Fixed-size chunks may split semantic units; consider semantic chunking for complex documents

### Why Groq?
- **Pro**: Fast inference (sub-second responses)
- **Pro**: Free tier available for development
- **Pro**: Llama 3.1 8B is capable and efficient
- **Con**: Rate limits on free tier
- **Alternative**: OpenAI GPT-4, Anthropic Claude, or local Ollama

### Retrieval Guardrails
- **No fallback**: If no chunks pass similarity threshold, return refusal (no LLM call)
- **Rationale**: Prevents hallucination; saves API costs; honest "I don't know"
- **Trade-off**: May refuse valid questions if threshold is too strict

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | (required) | API key from console.groq.com |
| `SIMILARITY_THRESHOLD` | `1.5` | Max L2 distance for relevant chunks |
| `TOP_K` | `3` | Number of chunks to retrieve |
| `CHUNK_SIZE` | `500` | Characters per chunk |
| `CHUNK_OVERLAP` | `50` | Overlap between chunks |

## Limitations & Roadmap

### Current Limitations
- **No authentication**: All endpoints are public
- **In-memory job store**: Jobs lost on restart
- **No streaming**: Responses are synchronous
- **Single-node**: FAISS index not distributed
- **Limited file types**: Only PDF and TXT supported

### Roadmap
- [ ] Add JWT authentication
- [ ] Persistent job storage (Redis/PostgreSQL)
- [ ] Streaming responses (SSE)
- [ ] Support for DOCX, HTML, Markdown
- [ ] Multi-tenant document isolation
- [ ] Hybrid search (keyword + semantic)
- [ ] Evaluation framework (RAGAS)
- [ ] Observability (LangSmith/Phoenix)

## Project Structure

```
chat_with_docs/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   ├── rag.py           # RAG logic with guardrails
│   │   ├── ingest.py        # Document ingestion
│   │   ├── models.py        # Job tracking models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── config.py        # Settings
│   │   ├── constants.py     # Constants
│   │   └── logger.py        # Logging config
│   ├── tests/
│   │   ├── conftest.py      # Test fixtures
│   │   ├── test_chunking.py
│   │   ├── test_ingestion.py
│   │   └── test_retrieval.py
│   ├── data/
│   │   ├── uploads/         # Uploaded documents
│   │   └── vectorstore/     # FAISS index
│   └── requirements.txt
├── ui/                      # UI Code
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Credits

Built with FastAPI, LangChain, FAISS, HuggingFace, and Groq.
