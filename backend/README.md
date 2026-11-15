<div align="center">

<br />

# MindfulAI — Backend

**FastAPI · SQLAlchemy · HuggingFace Transformers · PostgreSQL**

<br />

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org)
[![HuggingFace](https://img.shields.io/badge/HuggingFace-Transformers-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)](https://huggingface.co)

</div>

---

## Overview

The MindfulAI backend is a **FastAPI** application that exposes a REST API and two WebSocket endpoints for the Astro frontend. It runs two transformer-based ML models for real-time emotion classification, stores derived labels (never raw media) in a relational database, and provides analytics aggregations ready to be visualised by the frontend's chart components.

---

## Folder Structure

```
backend/
│
├── app/
│   │
│   ├── main.py                          # FastAPI app entrypoint — registers all routers, CORS, health check
│   │
│   ├── core/
│   │   ├── config.py                    # Pydantic Settings — reads .env file
│   │   ├── security.py                  # JWT creation, password hashing (bcrypt)
│   │   └── exceptions.py                # Custom HTTP exception handlers
│   │
│   ├── api/
│   │   ├── deps.py                      # Dependency injection — DB session, current user
│   │   └── routes/
│   │       ├── auth.py                  # POST /api/auth/register, POST /api/auth/login
│   │       ├── mood_logs.py             # POST/GET /api/journal
│   │       ├── analytics.py             # GET /api/mood/trends, /emotions, /heatmap, /correlation, /risk-score, /export/{pdf,csv}
│   │       ├── text_emotion.py          # POST /api/text-emotion/analyze
│   │       ├── facial_emotion.py        # POST /api/facial-emotion/analyze (single frame)
│   │       ├── connectors.py            # /api/connectors — external note sources (Keep, Notion, email, Apple Notes)
│   │       ├── pi_camera.py             # GET /api/pi-camera/latest, /status
│   │       ├── face_enroll.py           # POST /api/face/enroll
│   │       └── privacy.py               # GET/PUT /api/privacy/consent, GET /api/privacy/export, DELETE /api/privacy/data
│   │
│   ├── models/                          # SQLAlchemy ORM table definitions
│   │   ├── __init__.py                  # Imports every model so Base.metadata is complete
│   │   ├── user.py                      # users table
│   │   ├── consent_record.py            # consent_records table
│   │   ├── mood_log.py                  # mood_logs table
│   │   ├── text_emotion_record.py       # text_emotion_records table
│   │   ├── facial_emotion_record.py     # facial_emotion_records table
│   │   └── external_source.py           # external_sources + imported_notes tables
│   │
│   ├── schemas/                         # Pydantic request/response schemas
│   │   ├── user.py                      # Token, auth payloads
│   │   ├── mood_log.py                  # MoodLog request/response models
│   │   ├── emotion.py                   # TextAnalyzeResponse, FacialAnalyzeResponse
│   │   ├── connector.py                 # Connector/source schemas
│   │   └── privacy.py                   # Consent + export schemas
│   │
│   ├── services/                        # Business logic — one service per domain
│   │   ├── text_emotion_service.py      # Wraps DistilRoBERTa + VADER
│   │   ├── facial_emotion_service.py    # Wraps ViT face expression model
│   │   ├── face_detector.py             # OpenCV Haar Cascade face crop
│   │   ├── face_recognition_service.py  # DeepFace Facenet identity binding (optional)
│   │   ├── analytics_service.py         # DB aggregations → chart-ready JSON
│   │   ├── connector_service.py         # External source sync
│   │   └── pdf_export_service.py        # Wellness report PDF with crisis disclaimer
│   │
│   ├── ml_models/
│   │   ├── transformer_loader.py        # Lazy-loading ModelCache singleton
│   │   └── download_models.py           # Pre-download script for model weights
│   │
│   ├── db/
│   │   ├── base.py                      # SQLAlchemy declarative Base
│   │   └── session.py                   # Engine creation, SessionLocal, get_db()
│   │
│   ├── websocket/
│   │   ├── facial_stream.py             # /ws/facial-emotion WebSocket handler
│   │   └── pi_camera.py                 # /ws/pi-camera WebSocket handler
│   │
│   └── tests/
│       ├── conftest.py                  # Registers the model registry for tests
│       ├── test_text_emotion.py         # Unit tests for TextEmotionService
│       ├── test_facial_emotion.py       # Unit tests for FacialEmotionService
│       └── test_analytics.py            # Unit tests for AnalyticsService aggregations
│
├── requirements.txt                     # All Python dependencies with pinned versions
├── requirements-dev.txt                 # Lint and test tooling (ruff, pytest-cov)
├── ruff.toml                            # Linter configuration (CI-enforced)
├── .env.example                         # Template — copy to .env and fill in values
└── README.md                            # ← You are here
```

---

## ML Models

| Purpose | Model | How it's used |
|---|---|---|
| **Text emotion** (primary) | `j-hartmann/emotion-english-distilroberta-base` | Classifies journal entries into 7 emotions: anger, disgust, fear, joy, neutral, sadness, surprise |
| **Text sentiment** (secondary) | VADER (`vaderSentiment`) | Instant polarity score (−1 to +1) without a second GPU model — runs in milliseconds |
| **Facial emotion** | `trpakov/vit-face-expression` | Vision Transformer classification per cropped face frame |
| **Face detection** | OpenCV Haar Cascade | Pre-crop step before ViT inference — crops the face region from the webcam frame |

All models are downloaded from HuggingFace on first inference and cached locally in `app/ml_models/model_cache/`. In production, pre-warm them during the FastAPI `startup` event so the first user request is not slow.

### ModelCache (singleton)

```python
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
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login and receive a JWT access token |

### Journal

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/journal` | Save a mood entry (score, optional note, sleep, activity) |
| `GET` | `/api/journal` | List the user's mood entries |

### Analytics (`/api/mood`)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/mood/trends?days=` | Combined mood trend data (7 / 30 / 90 days) |
| `GET` | `/api/mood/emotions?source=` | Emotion distribution (`all` / `text` / `facial`) |
| `GET` | `/api/mood/emotions/text` | Text-emotion distribution breakdown |
| `GET` | `/api/mood/emotions/facial` | Facial-emotion distribution breakdown |
| `GET` | `/api/mood/heatmap` | Weekly heatmap data |
| `GET` | `/api/mood/correlation` | Facial vs. self-report correlation data |
| `GET` | `/api/mood/risk-score?days=` | Stress/burnout risk score |
| `GET` | `/api/mood/export/pdf` | Downloadable wellness report PDF (includes crisis disclaimer) |
| `GET` | `/api/mood/export/csv` | Downloadable CSV export |

### Emotion Analysis & Face

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/text-emotion/analyze` | Run DistilRoBERTa + VADER on submitted text |
| `POST` | `/api/facial-emotion/analyze` | Run ViT on a single base64 frame |
| `POST` | `/api/face/enroll` | Upload a reference photo for identity binding |
| `WS` | `/ws/facial-emotion` | WebSocket stream — accepts frames, returns emotion labels at ~1 fps |
| `WS` | `/ws/pi-camera` | WebSocket stream for the Raspberry Pi camera |

### Connectors

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/connectors/available` | List supported external note sources |
| `GET` | `/api/connectors/sources` | List the user's connected sources |
| `POST` | `/api/connectors/connect` | Connect a source (opt-in) |
| `POST` | `/api/connectors/sync` | Sync notes from a connected source |
| `GET` | `/api/connectors/notes` | List imported notes |

### Pi Camera

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/pi-camera/latest` | Latest emotion reading from the Pi camera |
| `GET` | `/api/pi-camera/status` | Pi camera connection status |

### Privacy (GDPR)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/privacy/consent` | Read the user's consent state |
| `PUT` | `/api/privacy/consent` | Update consent toggles (gates all camera activity) |
| `GET` | `/api/privacy/export` | Export all user data as a JSON object |
| `DELETE` | `/api/privacy/data` | Hard-delete all records for the current user |

### Health

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Service health check |

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
  id, user_id → users, camera_consent, text_consent, analytics_consent, created_at

mood_logs
  id, user_id → users, mood_score (1–5), note (nullable),
  sleep_hours (nullable), screen_time (nullable), activity_level (nullable), created_at

text_emotion_records
  id, user_id → users, text_snippet, emotion_label, confidence,
  sentiment_polarity (−1 to 1), created_at

facial_emotion_records
  id, user_id → users, emotion_label, confidence, created_at
  ── NO image_data column (by design — raw frames are never persisted)

external_sources
  id, user_id → users, source_type ("google_keep" | "notion" | "email" | "apple_notes"),
  source_name, is_connected, access_token, last_sync, created_at

imported_notes
  id, user_id → users, source_id → external_sources,
  external_id, content, title, created_at
```

---

## WebSocket — Live Facial Emotion

The frontend `WebcamPanel.tsx` sends a base64-encoded JPEG frame over the WebSocket every ~100ms (30 fps capture rate). The backend throttles ML inference to **one prediction per second** to avoid GPU/CPU thrashing.

```python
async def facial_emotion_stream(websocket: WebSocket):
    await websocket.accept()
    last_inference = 0.0
    while True:
        data = await websocket.receive_text()
        now = time.time()
        if now - last_inference >= 1.0:
            frame = decode_base64_frame(data)
            face_crop = face_detector.crop(frame)
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
DATABASE_URL=sqlite:///./mindfulai.db

SECRET_KEY=change-this-to-a-long-random-string-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

FRONTEND_URL=http://localhost:4321

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=tinyllama
```

### 4 — Start the development server

```bash
uvicorn app.main:app --reload --port 8000
```

Tables are created automatically on startup via SQLAlchemy `create_all`, for both SQLite and PostgreSQL. Adopt Alembic migrations before running against production data — see the production checklist below.

The API is now available at **http://localhost:8000**.
Interactive docs: **http://localhost:8000/docs**

---

## Ubuntu System Dependencies

On a fresh Ubuntu 22.04 or 24.04 installation you need the following before running `pip install`:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y build-essential git curl

sudo apt install -y python3 python3-pip python3-venv python3-dev

sudo apt install -y libgl1-mesa-glx libglib2.0-0 libsm6 libxrender1 libxext6

sudo apt install -y postgresql postgresql-contrib libpq-dev

curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

After installing system libraries, proceed with the Python setup above.

---

## Running Tests

The test suite covers the ML services and analytics aggregations.

```bash
source venv/bin/activate

pytest app/tests/ -v

pytest app/tests/test_analytics.py -v

pytest app/tests/ --cov=app --cov-report=term-missing
```

ML tests (`test_text_emotion.py`, `test_facial_emotion.py`) download HuggingFace models on first run. `test_analytics.py` runs against an in-memory SQLite database and is the same test CI executes.

Test files:

| File | What it tests |
|---|---|
| `app/tests/test_text_emotion.py` | `TextEmotionService.predict()` — correct labels, confidence structure |
| `app/tests/test_facial_emotion.py` | `FacialEmotionService.predict()` — frame decoding, model output shape |
| `app/tests/test_analytics.py` | `AnalyticsService` — aggregation logic, chart-ready JSON shape (no model download; runs in CI) |

---

## Linting

```bash
ruff check app
```

Configuration lives in `ruff.toml` and is enforced by CI. Install the linter with `pip install -r requirements-dev.txt`.

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | `sqlite:///./mindfulai.db` | SQLAlchemy connection string |
| `SECRET_KEY` | Yes | `super-secret-key-change-in-prod` | JWT signing key — **change in production** |
| `ALGORITHM` | No | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `30` | JWT token lifetime |
| `FRONTEND_URL` | Yes | `http://localhost:4321` | Allowed CORS origin |
| `OLLAMA_BASE_URL` | No | `http://localhost:11434` | Reserved for the roadmap LLM companion (not used yet) |
| `OLLAMA_MODEL` | No | `tinyllama` | Reserved for the roadmap LLM companion (not used yet) |

---

## Key Engineering Decisions

**Throttled WebSocket inference.**
The `/ws/facial-emotion` handler checks `time.time() - last_inference_time >= 1.0` before calling the ViT model. This prevents CPU/GPU thrashing from a 30 fps webcam stream while keeping the user experience feeling real-time.

**Strict privacy schema.**
`FacialEmotionRecord` has no `image_data` or `frame_url` column — by design. The face detector runs entirely in memory (`np.ndarray`) and the array is discarded after inference. Compliance with "never store raw frames" is enforced at the schema level, not just by convention.

**Complete model registry.**
`app/models/__init__.py` imports every ORM model so `Base.metadata` is always complete — `create_all` does not depend on router import order, and the test suite can build the full schema in an in-memory database.

**Dual-model text pipeline.**
VADER runs alongside DistilRoBERTa. VADER is near-instant and provides a compound polarity score (−1 to +1) as a secondary signal without requiring a second GPU model download, keeping the `/api/text-emotion/analyze` response time low even on CPU-only machines.

**Static crisis communication.**
The system deliberately ships no unmonitored conversational AI. Exported PDF reports (`pdf_export_service`) close with an explicit crisis disclaimer directing users to qualified professionals, and the interface carries the same notice. A supportive-dialogue companion with keyword-triggered escalation is designed as roadmap work, to be shipped only together with its safety machinery.

**Vestigial LLM configuration.**
`OLLAMA_BASE_URL` / `OLLAMA_MODEL` and the `ollama`/`langchain` dependencies are reserved for the roadmap companion; no route currently invokes them.

---

## Production Checklist

Before deploying to a production server, verify the following:

- [ ] `SECRET_KEY` is a long, random string (not the default)
- [ ] `DATABASE_URL` points to a PostgreSQL instance, not SQLite
- [ ] `FRONTEND_URL` is set to your deployed Astro domain (CORS)
- [ ] Adopt Alembic migrations (`alembic init` + revision history) before running against production data — the app currently creates tables via `create_all` on startup
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
  <sub>Part of the MindfulAI project · Backend only — see <a href="../frontend/README.md">frontend/README.md</a> for the website</sub>
</div>
