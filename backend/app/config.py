"""Application configuration settings."""

import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """Application settings loaded from environment variables."""

    # API Keys
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")

    # Paths
    VECTOR_DB_PATH: str = os.getenv("VECTOR_DB_PATH", "data/vectorstore")
    DOCS_PATH: str = os.getenv("DOCS_PATH", "data/uploads")

    # Chunking settings
    CHUNK_SIZE: int = int(os.getenv("CHUNK_SIZE", "500"))
    CHUNK_OVERLAP: int = int(os.getenv("CHUNK_OVERLAP", "50"))

    # Retrieval settings
    SIMILARITY_THRESHOLD: float = float("1.5")
    TOP_K: int = int(os.getenv("TOP_K", "3"))


settings = Settings()
