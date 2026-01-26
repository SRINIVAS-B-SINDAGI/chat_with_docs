"""FastAPI application for RAG-based document Q&A."""

import os
import shutil

from fastapi import FastAPI, HTTPException, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager

from app.schemas import (
    QueryRequest,
    QueryResponse,
    IngestResponse,
    JobStatusResponse,
)
from app.models import (
    JobStatus,
    create_job,
    get_job,
    update_job,
)
from app.rag import answer_question
from app.ingest import ingest_documents, ingest_single_document
from app.logger import logger
from app.constants import UPLOAD_DIR


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    logger.info("Application startup")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Insight AI - Document Intelligence",
    description="RAG-powered document Q&A system",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def process_ingestion_job(job_id: str, file_path: str):
    """Background task to process document ingestion."""
    try:
        update_job(job_id, status=JobStatus.PROCESSING)
        logger.info(f"Processing job {job_id}: {file_path}")

        chunks_added = ingest_single_document(file_path)

        update_job(
            job_id,
            status=JobStatus.COMPLETED,
            chunks_added=chunks_added
        )
        logger.info(f"Job {job_id} completed: {chunks_added} chunks added")

    except Exception as e:
        logger.exception(f"Job {job_id} failed")
        update_job(
            job_id,
            status=JobStatus.FAILED,
            error=str(e)
        )


@app.post("/ask", response_model=QueryResponse)
def ask_question(req: QueryRequest):
    """Ask a question about uploaded documents."""
    try:
        result = answer_question(req.question)
        return QueryResponse(
            answer=result["answer"],
            confidence=result["confidence"],
            sources=result["sources"]
        )

    except Exception as e:
        logger.exception("Error while answering question")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload")
def upload_file(file: UploadFile = File(...)):
    """Upload a file for later ingestion."""
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        return {
            "message": "File uploaded successfully",
            "filename": file.filename
        }

    except Exception as e:
        logger.exception("Error while uploading file")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ingest", response_model=IngestResponse)
async def ingest_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload and ingest a document asynchronously.

    Returns a job_id that can be used to track ingestion status.
    """
    try:
        # Validate file type
        if not (file.filename.endswith('.pdf') or file.filename.endswith('.txt')):
            raise HTTPException(
                status_code=400,
                detail="Only PDF and TXT files are supported"
            )

        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Create job and start background processing
        job = create_job(file.filename)
        background_tasks.add_task(process_ingestion_job, job.job_id, file_path)

        return IngestResponse(
            job_id=job.job_id,
            message=f"Ingestion started for {file.filename}"
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error while starting ingestion")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/ingest/{job_id}/status", response_model=JobStatusResponse)
def get_job_status(job_id: str):
    """Get the status of an ingestion job."""
    job = get_job(job_id)

    if job is None:
        raise HTTPException(status_code=404, detail="Job not found")

    return JobStatusResponse(
        job_id=job.job_id,
        status=job.status.value,
        filename=job.filename,
        error=job.error,
        chunks_added=job.chunks_added
    )


@app.post("/ingest-all")
def ingest_all_data():
    """Ingest all documents from the uploads directory (synchronous)."""
    chunks_added = ingest_documents()
    return {
        "message": "Ingestion completed",
        "chunks_added": chunks_added
    }


# Mount static files for UI
ui_path = os.path.join(os.path.dirname(__file__), "..", "..", "ui")
if os.path.exists(ui_path):
    app.mount("/static", StaticFiles(directory=ui_path), name="static")

    @app.get("/")
    async def serve_ui():
        """Serve the main UI page."""
        return FileResponse(os.path.join(ui_path, "index.html"))
