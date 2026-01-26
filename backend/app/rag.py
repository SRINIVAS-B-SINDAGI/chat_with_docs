"""RAG module for question answering with retrieval guardrails."""

import os
import json
from typing import List, Dict, Any

from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage

from app.config import settings


SYSTEM_PROMPT = """You are a question-answering assistant that provides precise, evidence-based answers.

Rules:
1. Answer ONLY using the provided context. Never use prior knowledge.
2. Include inline citations in your answer using the format: [source: filename, page X]
3. If the context mentions a section, include it: [source: filename, page X, section: "Section Name"]
4. If the answer is not clearly present in the context, say: "I cannot find this information in the provided documents."
5. Keep answers concise and factual.
6. Cite the specific source for each claim you make.

After answering, provide a confidence score from 1 to 10:
- 10: Direct, explicit answer found in context
- 7-9: Answer clearly supported by context
- 4-6: Answer partially supported, some inference required
- 1-3: Answer weakly supported or not found

Respond in the following JSON format ONLY:
{
  "answer": "<your answer with inline citations>",
  "confidence": <number from 1 to 10>
}
"""

# Refusal response when no relevant context is found
REFUSAL_RESPONSE = {
    "answer": "I don't have enough relevant context in the uploaded documents to answer this question. Please try uploading more relevant documents or rephrase your question.",
    "confidence": 1,
    "sources": []
}


def load_vectorstore():
    """Load the FAISS vector store."""
    embeddings = HuggingFaceEmbeddings(
        model_name="all-MiniLM-L6-v2"
    )

    return FAISS.load_local(
        settings.VECTOR_DB_PATH,
        embeddings,
        allow_dangerous_deserialization=True
    )


def format_source_info(doc) -> Dict[str, Any]:
    """Extract source information from a document."""
    metadata = doc.metadata
    return {
        "source": metadata.get("source", "unknown"),
        "page": metadata.get("page"),
        "section": metadata.get("section"),
        "chunk_index": metadata.get("chunk_index")
    }


def answer_question(question: str) -> dict:
    """
    Answer a question using RAG with retrieval guardrails.

    - Returns refusal WITHOUT calling LLM if no relevant chunks found
    - Removes fallback logic that defeats similarity threshold
    - Returns structured source objects with page/section info
    """
    vectorstore = load_vectorstore()

    # Retrieve with similarity scores
    results = vectorstore.similarity_search_with_score(
        question,
        k=settings.TOP_K
    )

    # Filter by similarity threshold (lower score = more similar in FAISS)
    filtered_docs = [
        doc for doc, score in results
        if score < settings.SIMILARITY_THRESHOLD
    ]

    # NO FALLBACK: If nothing passes threshold, refuse without LLM call
    if not filtered_docs:
        return REFUSAL_RESPONSE

    # Build context from filtered documents
    context_parts = []
    for doc in filtered_docs:
        source_info = format_source_info(doc)
        source_label = f"[{source_info['source']}"
        if source_info['page']:
            source_label += f", page {source_info['page']}"
        if source_info['section']:
            source_label += f", section: \"{source_info['section']}\""
        elif source_info.get('chunk_index'):
            source_label += f", chunk {source_info['chunk_index']}"
        source_label += "]"

        context_parts.append(f"{source_label}\n{doc.page_content}")

    context = "\n\n---\n\n".join(context_parts)

    # Extract unique sources with metadata
    sources: List[Dict[str, Any]] = []
    seen_sources = set()
    for doc in filtered_docs:
        source_info = format_source_info(doc)
        # Create a unique key for deduplication
        key = (
            source_info['source'],
            source_info.get('page'),
            source_info.get('section'),
            source_info.get('chunk_index')
        )
        if key not in seen_sources:
            seen_sources.add(key)
            sources.append(source_info)

    # Call LLM
    llm = ChatGroq(
        model="llama-3.1-8b-instant",
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )

    messages = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content=f"Context:\n{context}\n\nQuestion:\n{question}"
        )
    ]

    response = llm.invoke(messages)

    try:
        parsed = json.loads(response.content)
        return {
            "answer": parsed.get("answer", ""),
            "confidence": parsed.get("confidence", 5),
            "sources": sources
        }
    except json.JSONDecodeError:
        return {
            "answer": response.content,
            "confidence": 5,
            "sources": sources
        }
