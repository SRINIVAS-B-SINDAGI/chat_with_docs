# # Insight AI - Document Intelligence  
  
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
| `SIMILARITY_THRESHOLD` | `0.8` | Max L2 distance for relevant chunks |  
| `TOP_K` | `3` | Number of chunks to retrieve |  
| `CHUNK_SIZE` | `500` | Characters per chunk |  
| `CHUNK_OVERLAP` | `50` | Overlap between chunks |  
  
## Cloud Deployment  
  
This section covers low-cost cloud hosting options for deploying Insight AI.  
  
### Resource Requirements  
  
| Resource | Requirement |  
|----------|-------------|  
| **Memory** | 1-2 GB (minimum 512 MB) |  
| **CPU** | 1-2 vCPU |  
| **Storage** | 10 GB persistent |  
| **Network** | Outbound internet for Groq API |  
| **Container** | Docker support required |  
  
### Hosting Options Comparison  
  
| Provider | Monthly Cost | Setup Difficulty | Best For |  
|----------|-------------|------------------|----------|  
| **Render** | $25 | Easy | Simplicity, recommended for most users |  
| **Railway** | $22-35 | Easy | Usage-based billing, pay for what you use |  
| **Oracle Cloud** | $0 | Moderate | Free forever, generous resources |  
| **Fly.io** | $31 | Moderate | Global edge deployment |  
  
---  
  
### Option 1: Render (Recommended)  
  
Render offers the simplest deployment experience with predictable pricing.  
  
**Steps:**  
  
1. **Create Account**: Sign up at [render.com](https://render.com) and connect your GitHub account  
  
2. **Create Web Service**:  
   - Click "New" → "Web Service"  
   - Connect your `chat_with_docs` repository  
   - Select the **Standard** plan ($25/month - 2 GB RAM, 1 vCPU)  
  
3. **Configure Settings**:  
   ```  
   Name: insight-ai  
   Region: Choose closest to your users  
   Branch: main  
   Root Directory: (leave empty)  
   Runtime: Docker  
   ```  
  
4. **Set Environment Variables**:  
   ```  
   GROQ_API_KEY=your_groq_api_key_here  
   ```  
  
5. **Add Persistent Disk**:  
   - Go to "Disks" tab  
   - Add disk: 10 GB mounted at `/app/backend/data`  
   - This persists your vectorstore and uploaded documents  
  
6. **Configure Health Check**:  
   - Health Check Path: `/docs`  
   - This ensures Render knows when your app is ready  
  
7. **Deploy**: Click "Create Web Service" and wait for deployment  
  
**Your app will be available at**: `https://insight-ai.onrender.com`  
  
---  
  
### Option 2: Railway  
  
Railway offers usage-based pricing, ideal if you have variable traffic.  
  
**Steps:**  
  
1. **Create Account**: Sign up at [railway.app](https://railway.app) with GitHub  
  
2. **Create New Project**:  
   - Click "New Project" → "Deploy from GitHub repo"  
   - Select your `chat_with_docs` repository  
  
3. **Configure Environment Variables**:  
   - Go to "Variables" tab  
   - Add: `GROQ_API_KEY=your_groq_api_key_here`  
  
4. **Set Up Volumes** (for persistent storage):  
   - Go to "Settings" → "Volumes"  
   - Create volume mounted at `/app/backend/data`  
  
5. **Configure Deployment**:  
   - Railway auto-detects the Dockerfile  
   - Set start command if needed: `uvicorn app.main:app --host 0.0.0.0 --port 8000`  
  
6. **Generate Domain**:  
   - Go to "Settings" → "Networking"  
   - Click "Generate Domain"  
  
**Pricing Notes:**  
- $5/month base + usage (~$17-30/month for light-moderate use)  
- Monitor usage in dashboard to avoid surprises  
- Set spending limits under "Usage" settings  
  
---  
  
### Option 3: Oracle Cloud Free Tier  
  
Oracle Cloud offers a truly free option with generous Always Free resources.  
  
**Steps:**  
  
1. **Create Always Free Account**:  
   - Sign up at [cloud.oracle.com](https://cloud.oracle.com)  
   - Choose "Always Free" tier (credit card required for verification only)  
  
2. **Create Compute Instance**:  
   - Go to "Compute" → "Instances" → "Create Instance"  
   - Select **Ampere A1** shape (ARM-based)  
   - Configure: 1 OCPU, 6 GB RAM (or up to 4 OCPU, 24 GB RAM within free tier)  
   - Choose Ubuntu 22.04 minimal image  
   - Add your SSH public key  
  
3. **Configure Security List**:  
   - Go to "Networking" → "Virtual Cloud Networks"  
   - Select your VCN → "Security Lists" → "Default Security List"  
   - Add Ingress Rule:  
     ```  
     Source CIDR: 0.0.0.0/0  
     Destination Port: 8000  
     Protocol: TCP  
     ```  
  
4. **SSH into Instance and Install Docker**:  
   ```bash  
   # Update system  
   sudo apt update && sudo apt upgrade -y  
  
   # Install Docker  
   curl -fsSL https://get.docker.com | sudo sh  
   sudo usermod -aG docker $USER  
  
   # Install docker-compose  
   sudo apt install docker-compose -y  
  
   # Log out and back in for group changes  
   exit  
   ```  
  
5. **Deploy the Application**:  
   ```bash  
   # Clone repository  
   git clone https://github.com/SRINIVAS-B-SINDAGI/chat_with_docs.git  
   cd chat_with_docs  
  
   # Create environment file  
   cp .env.example .env  
   nano .env  # Add your GROQ_API_KEY  
  
   # Start the application  
   docker compose up -d --build  
   ```  
  
6. **Optional: Set Up SSL with Caddy**:  
   ```bash  
   # Install Caddy  
   sudo apt install -y caddy  
  
   # Configure Caddy (edit /etc/caddy/Caddyfile)  
   your-domain.com {  
       reverse_proxy localhost:8000  
   }  
  
   # Restart Caddy  
   sudo systemctl restart caddy  
   ```  
  
**Your app will be available at**: `http://<instance-public-ip>:8000`  
  
---  
  
### Option 4: Fly.io  
  
[Fly.io](http://Fly.io) offers global edge deployment with persistent volumes.  
  
**Steps:**  
  
1. **Install Fly CLI**:  
   ```bash  
   # macOS  
   brew install flyctl  
  
   # Linux  
   curl -L https://fly.io/install.sh | sh  
  
   # Sign up / Login  
   fly auth signup  
   # or  
   fly auth login  
   ```  
  
2. **Create `fly.toml`** in project root:  
   ```toml  
   app = "insight-ai"  
   primary_region = "sjc"  # San Jose, or choose: iad, lhr, sin, etc.  
  
   [build]  
     dockerfile = "Dockerfile"  
  
   [env]  
     PORT = "8000"  
  
   [http_service]  
     internal_port = 8000  
     force_https = true  
     auto_stop_machines = false  
     auto_start_machines = true  
     min_machines_running = 1  
  
   [mounts]  
     source = "insight_data"  
     destination = "/app/backend/data"  
  
   [[vm]]  
     size = "shared-cpu-2x"  
     memory = "1gb"  
   ```  
  
3. **Create Persistent Volume**:  
   ```bash  
   fly volumes create insight_data --size 10 --region sjc  
   ```  
  
4. **Set Environment Variables**:  
   ```bash  
   fly secrets set GROQ_API_KEY=your_groq_api_key_here  
   ```  
  
5. **Deploy**:  
   ```bash  
   fly deploy  
   ```  
  
6. **Check Status**:  
   ```bash  
   fly status  
   fly logs  
   ```  
  
**Your app will be available at**: `https://insight-ai.fly.dev`  
  
**Pricing**: ~$31/month (shared-cpu-2x + 1GB RAM + 10GB volume)  
  
---  
  
### Cost Optimization Tips  
  
1. **Start Small**: Begin with the smallest tier that meets requirements, scale up only if needed  
  
2. **Choose by Use Case**:  
   - **Development/Testing**: Oracle Cloud Free Tier  
   - **Production with predictable traffic**: Render  
   - **Variable/sporadic traffic**: Railway  
   - **Global audience**: Fly.io  
  
3. **Monitor Usage**: Set up billing alerts on all platforms to avoid surprises  
  
4. **Shut Down When Idle**: For development deployments, stop instances when not in use  
  
5. **Use Oracle Cloud for Free Hosting**: If you're comfortable with more setup, Oracle's Always Free tier provides substantial resources at no cost  
  
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
