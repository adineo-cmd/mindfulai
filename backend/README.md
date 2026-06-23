<div align="center">

<br />

# Tideline — Backend

**FastAPI · SQLAlchemy · HuggingFace Transformers · PostgreSQL**

<br />

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co)

</div>

---

## Overview

The Tideline backend is a **FastAPI** application that exposes a REST API and a WebSocket endpoint for the Astro frontend. It runs two transformer-based ML models for real-time emotion classification, stores derived labels (never raw media) in a relational database, and provides analytics aggregations ready to be visualised by the frontend's chart components.

---

## Folder Structure

```
backend/
│
├── app/
│   │
│   ├── main.py                          # FastAPI app entrypoint — registers all routers, CORS, startup events
│   │
│   ├── core/
│   │   ├── config.py                    # Pydantic Settings — reads .env file
│   │   ├── security.py                  # JWT creation, password hashing (bcrypt)
│   │   └── exceptions.py                # Custom HTTP exception handlers
│   │
│   ├── api/
│   │   ├── deps.py                      # Dependency injection — DB session, current user
│   │   └── routes/
│   │       ├── auth.py                  # POST /api/auth/signup, POST /api/auth/login
│   │       ├── mood_logs.py             # CRUD  /api/mood/log, GET /api/mood/trends
│   │       ├── text_emotion.py          # POST /api/emotion/text
│   │       ├── facial_emotion.py        # POST /api/emotion/facial (single frame)
│   │       ├── chat.py                  # POST /api/chat
│   │       ├── analytics.py             # GET  /api/analytics/summary, /distribution, /correlation
│   │       └── privacy.py               # GET/DELETE /api/user/data
│   │
│   ├── models/                          # SQLAlchemy ORM table definitions
│   │   ├── user.py                      # users table
│   │   ├── consent_record.py            # consent_records table
│   │   ├── mood_log.py                  # mood_logs table
│   │   ├── text_emotion_record.py       # text_emotion_records table
│   │   ├── facial_emotion_record.py     # facial_emotion_records table
│   │   └── chat_message.py              # chat_messages table
│   │
│   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── auth.py                      # SignupRequest, LoginResponse, TokenData
│   │   ├── mood_log.py                  # MoodLogCreate, MoodLogRead
│   │   ├── emotion.py                   # TextEmotionResponse, FacialEmotionResponse
│   │   ├── chat.py                      # ChatRequest, ChatResponse
│   │   └── analytics.py                 # TrendPoint, EmotionSlice, CorrelationPoint
│   │
│   ├── services/                        # Business logic — one service per domain
│   │   ├── text_emotion_service.py      # Wraps DistilRoBERTa + VADER
│   │   ├── facial_emotion_service.py    # Wraps ViT face expression model
│   │   ├── face_detector.py             # OpenCV Haar Cascade face crop
│   │   ├── chatbot_service.py           # OpenAI chat + crisis keyword detection
│   │   ├── analytics_service.py         # DB aggregations → chart-ready JSON
│   │   └── crisis_detection_service.py  # Keyword scanner, returns bool + resources
│   │
│   ├── ml_models/
│   │   ├── transformer_loader.py        # Lazy-loading ModelCache singleton
│   │   └── model_cache/                 # HuggingFace model weights (auto-downloaded)
│   │
│   ├── db/
│   │   ├── base.py                      # SQLAlchemy Base + table imports for Alembic
│   │   └── session.py                   # Engine creation, SessionLocal, get_db()
│   │
│   └── websocket/
│       └── facial_stream.py             # /ws/facial-emotion WebSocket handler
│
├── tests/
│   ├── test_text_emotion.py             # Unit tests for TextEmotionService
│   ├── test_facial_emotion.py           # Unit tests for FacialEmotionService
│   └── test_analytics.py               # Unit tests for AnalyticsService aggregations
│
├── requirements.txt                     # All Python dependencies with pinned versions
├── .env.example                         # Template — copy to .env and fill in values
└── README.md                            # ← You are here
```

---

## ML Models

| Purpose | Model | How it's used |
|---|---|---|
| **Text emotion** (primary) | `j-hartmann/emotion-english-distilroberta-base` | Classifies journal entries and chat messages into 7 emotions: anger, disgust, fear, joy, neutral, sadness, surprise |
| **Text sentiment** (secondary) | VADER (`vaderSentiment`) | Instant polarity score (−1 to +1) without a second GPU model — runs in milliseconds |
| **Facial emotion** | `trpakov/vit-face-expression` | Vision Transformer classification per cropped face frame |
| **Face detection** | OpenCV Haar Cascade | Pre-crop step before ViT inference — crops the face region from the webcam frame |

All models are downloaded from HuggingFace on first inference and cached locally in `app/ml_models/model_cache/`. In production, pre-warm them during the FastAPI `startup` event so the first user request is not slow.

### ModelCache (singleton)

```python
# app/ml_models/transformer_loader.py
class ModelCache:
    def load_text_emotion(self):
        if not self.text_emotion_pipeline:
            self.text_emotion_pipeline = pipeline(
                "text-classification",
                model="j-hartmann/emotion-english-distilroberta-base",
            )
        return self.text_emotion_pipeline

    def load_facial_emotion(self):
        if not self.facial_emotion_pipeline:
            self.facial_emotion_pipeline = pipeline(
                "image-classification",
                model="trpakov/vit-face-expression",
            )
        return self.facial_emotion_pipeline

model_cache = ModelCache()
```

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT access token |

### Mood Logs

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/mood/log` | Save a manual mood check-in (slider value + optional note) |
| `GET` | `/api/mood/trends` | Mood trend data — accepts `?days=7` / `30` / `90` |
| `GET` | `/api/mood/emotions` | Emotion distribution for the current week |

### Emotion Analysis

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/emotion/text` | Run DistilRoBERTa on submitted text |
| `POST` | `/api/emotion/facial` | Run ViT on a single base64 frame |
| `WS` | `/ws/facial-emotion` | WebSocket stream — accepts frames, returns emotion labels at ~1 fps |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message; returns LLM reply + `requires_human_support` flag |

### Analytics

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/analytics/summary` | Composite wellness score + risk level |
| `GET` | `/api/analytics/distribution` | Emotion breakdown as pie/bar chart data |
| `GET` | `/api/analytics/correlation` | Facial vs. self-report scatter data |
| `GET` | `/api/analytics/burnout-trend` | Stress/burnout risk score over time |

### Privacy (GDPR)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/user/data` | Export all user data as a JSON object |
| `DELETE` | `/api/user/data` | Hard-delete all records for the current user |

### Interactive API Docs

Once the server is running, the full interactive Swagger UI is at:

```
http://localhost:8000/docs
```

ReDoc alternative:

```
http://localhost:8000/redoc
```

---

## Database Models

```
users
  id, email, hashed_password, is_active, created_at

consent_records
  id, user_id → users, camera_consent, voice_consent, data_storage_consent, updated_at

mood_logs
  id, user_id → users, mood_score (1–10), note (text, nullable),
  sleep_hours (nullable), activity_level (nullable), logged_at

text_emotion_records
  id, user_id → users, source_type ("journal" | "chat"),
  emotion_label, confidence, all_scores (JSON), created_at

facial_emotion_records
  id, user_id → users, emotion_label, confidence, created_at
  ── NO image_data column (by design — raw frames are never persisted)

chat_messages
  id, user_id → users, role ("user" | "assistant"),
  content, requires_human_support (bool), created_at
```

---

## WebSocket — Live Facial Emotion

The frontend `WebcamPanel.tsx` sends a base64-encoded JPEG frame over the WebSocket every ~100ms (30 fps capture rate). The backend throttles ML inference to **one prediction per second** to avoid GPU/CPU thrashing.

```python
# app/websocket/facial_stream.py (simplified)
async def facial_emotion_stream(websocket: WebSocket):
    await websocket.accept()
    last_inference = 0.0
    while True:
        data = await websocket.receive_text()          # base64 JPEG
        now = time.time()
        if now - last_inference >= 1.0:               # throttle to 1 fps
            frame = decode_base64_frame(data)
            face_crop = face_detector.crop(frame)     # OpenCV Haar Cascade
            if face_crop is not None:
                result = facial_emotion_service.predict(face_crop)
                await websocket.send_json(result)
                last_inference = now
```

---

## Prerequisites

- Python 3.11 or higher
- pip
- PostgreSQL 14+ (for production) or SQLite (for development, zero config)
- On Ubuntu, several system libraries are required — see the Ubuntu setup section below

---

## Setup & Installation

### 1 — Create a virtual environment

```bash
cd backend
python3 -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
```

### 2 — Install Python dependencies

```bash
pip install -r requirements.txt
```

> The `transformers` and `torch` packages are large (~2 GB). Initial install may take a few minutes depending on your connection.

### 3 — Configure environment variables

```bash
cp .env.example .env
nano .env          # or open in any editor
```

Fill in the values:

```env
# Database
# SQLite for local dev — zero config:
DATABASE_URL=sqlite:///./mindfulai.db

# PostgreSQL for production:
# DATABASE_URL=postgresql://user:password@localhost:5432/mindfulai

# Security
SECRET_KEY=change-this-to-a-long-random-string-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS — must match the domain your Astro site is served from
FRONTEND_URL=http://localhost:4321

# LLM (optional) — chat falls back to a mock response if not provided
OPENAI_API_KEY=sk-...
```

### 4 — Initialise the database

```bash
# SQLite: tables are created automatically on startup via SQLAlchemy
uvicorn app.main:app --reload --port 8000

# PostgreSQL: run Alembic migrations instead
alembic upgrade head
```

### 5 — Start the development server

```bash
uvicorn app.main:app --reload --port 8000
```

The API is now available at **http://localhost:8000**.
Interactive docs: **http://localhost:8000/docs**

---

## Ubuntu System Dependencies

On a fresh Ubuntu 22.04 or 24.04 installation you need the following before running `pip install`:

```bash
# System essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl

# Python
sudo apt install -y python3 python3-pip python3-venv python3-dev

# OpenCV system libraries (required by opencv-python)
sudo apt install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6

# PostgreSQL (if using for production)
sudo apt install -y postgresql postgresql-contrib libpq-dev

# Node.js 20 (for the frontend — not needed if running backend only)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

After installing system libraries, proceed with the Python setup above.

---

## Running Tests

The test suite covers the ML services and analytics aggregations.

```bash
# Make sure the virtual environment is activated
source venv/bin/activate

# Run all tests
pytest tests/ -v

# Run a specific test file
pytest tests/test_text_emotion.py -v

# Run with coverage report
pytest tests/ --cov=app --cov-report=term-missing
```

Test files:

| File | What it tests |
|---|---|
| `tests/test_text_emotion.py` | `TextEmotionService.predict()` — correct labels, confidence structure |
| `tests/test_facial_emotion.py` | `FacialEmotionService.predict()` — frame decoding, model output shape |
| `tests/test_analytics.py` | `AnalyticsService` — aggregation logic, chart-ready JSON shape |

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `sqlite:///./mindfulai.db` | SQLAlchemy connection string |
| `SECRET_KEY` | Yes | `super-secret-key` | JWT signing key — **change in production** |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token lifetime |
| `FRONTEND_URL` | Yes | `http://localhost:4321` | Allowed CORS origin |
| `OPENAI_API_KEY` | No | `None` | Enables GPT-powered chat; falls back to mock without it |

---

## Key Engineering Decisions

**Throttled WebSocket inference.**
The `/ws/facial-emotion` handler checks `time.time() - last_inference_time >= 1.0` before calling the ViT model. This prevents CPU/GPU thrashing from a 30 fps webcam stream while keeping the user experience feeling real-time.

**Strict privacy schema.**
`FacialEmotionRecord` has no `image_data` or `frame_url` column — by design. The face detector runs entirely in memory (`np.ndarray`) and the array is discarded after inference. Compliance with "never store raw frames" is enforced at the schema level, not just by convention.

**Dual-model text pipeline.**
VADER runs alongside DistilRoBERTa. VADER is near-instant and provides a compound polarity score (−1 to +1) as a secondary signal without requiring a second GPU model download, keeping the `/api/emotion/text` response time low even on CPU-only machines.

**Graceful LLM degradation.**
`ChatbotService` checks for `OPENAI_API_KEY` before calling the OpenAI API. Without it, it returns a warm, context-aware mock response based on the user's recent emotion history. This means the frontend chat widget works fully during local development without any API costs.

**Crisis detection before LLM call.**
`CrisisDetectionService` scans the user's message for keywords before it reaches the LLM. If a match is found, the endpoint returns `requires_human_support: true` plus crisis resource information and skips the LLM call entirely — ensuring sensitive conversations are never mishandled by the AI.

---

## Production Checklist

Before deploying to a production server, verify the following:

- [ ] `SECRET_KEY` is a long, random string (not the default)
- [ ] `DATABASE_URL` points to a PostgreSQL instance, not SQLite
- [ ] `FRONTEND_URL` is set to your deployed Astro domain (CORS)
- [ ] `OPENAI_API_KEY` is set if you want real LLM chat responses
- [ ] Alembic migrations have been run (`alembic upgrade head`)
- [ ] The `model_cache` is pre-warmed at startup (add to `@app.on_event("startup")`)
- [ ] HTTPS is enforced — the webcam WebSocket requires WSS in production
- [ ] The `get_current_user` dependency is wired into all protected routes (marked with comments throughout the codebase)

---

## Deployment (Production Server)

### Uvicorn with Gunicorn (Ubuntu)

```bash
pip install gunicorn

gunicorn app.main:app \
  --workers 2 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

> Use 2 workers if running ML models — each worker loads its own model copy into memory. Adjust based on available RAM.

### Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Required for WebSocket (/ws/facial-emotion)
    location /ws/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

<div align="center">
  <sub>Part of the Mindfulai project · Backend only — see <a href="../frontend/README.md">frontend/README.md</a> for the website</sub>
</div>