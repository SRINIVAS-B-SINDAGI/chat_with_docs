FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt

RUN pip install --no-cache-dir -r requirements.txt

COPY backend ./backend
COPY ui ./ui

RUN mkdir -p backend/data/uploads backend/data/vectorstore

EXPOSE 8000

WORKDIR /app/backend

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
