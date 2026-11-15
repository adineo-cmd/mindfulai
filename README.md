<div align="center">

<br />

<img src="https://raw.githubusercontent.com/adineo-cmd/mindfulai/main/frontend/public/favicon.svg" width="60" height="60" alt="MindfulAI logo" />

# MindfulAI — AI Mental Wellness Platform

**A privacy-first, multi-modal mental wellness website powered by transformer-based emotion AI.**

<br />

[![CI](https://github.com/adineo-cmd/mindfulai/actions/workflows/ci.yml/badge.svg)](https://github.com/adineo-cmd/mindfulai/actions/workflows/ci.yml)
[![Astro](https://img.shields.io/badge/Frontend-Astro_4.5-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI_0.110-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![License](https://img.shields.io/badge/License-MIT-6E5A73?style=for-the-badge)](LICENSE)

<br />

> ⚠️ **Disclaimer** — MindfulAI is a final-year academic project. It is a wellness tracking tool and is **not** a substitute for professional diagnosis, therapy, or clinical treatment. If you or someone you know is in crisis, please contact a qualified mental health professional.

<br />

</div>

---

## What is MindfulAI?

MindfulAI reads the emotional tide of your day through three complementary signals — what you **write**, what your **face shows**, and what you **tell it directly** — and turns those signals into a clear, honest picture of how you're doing over time.

Unlike single-modal mood apps, MindfulAI combines:

- **Text emotion analysis** via a fine-tuned DistilRoBERTa transformer (`j-hartmann/emotion-english-distilroberta-base`) — classifying journal entries into seven emotion classes
- **Live facial emotion detection** via a Vision Transformer (`trpakov/vit-face-expression`) fed from a WebSocket webcam stream, throttled to one inference per second
- **Self-reported mood logs** via a simple emoji/slider daily check-in

All three signals are stored as derived labels — **raw video and audio are never persisted**.

📖 **Research paper** — the design, its positioning against published mental-health agents (Woebot, Wysa, Tess), and a proposed validation protocol are described in [`paper/main.tex`](./paper/main.tex) (*MindfulAI: A Privacy-First Multi-Modal Framework for Emotion-Aware Mental Wellness Support*). Build it with `tectonic paper/main.tex`.

---

## Repository Layout

```
MindfulAI/
├── frontend/          # Astro + Tailwind multi-page website
│   ├── src/
│   │   ├── pages/     # One .astro file per route
│   │   ├── components/
│   │   ├── layouts/
│   │   └── lib/
│   └── README.md      ← Frontend setup guide
│
├── backend/           # FastAPI + SQLAlchemy REST + WebSocket API
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── services/
│   │   └── ml_models/
│   └── README.md      ← Backend setup guide
│
├── paper/             # LaTeX source of the research paper
│
└── README.md          ← You are here
```

---

## Architecture at a Glance

```
┌───────────────────────────────────────────────────────┐
│                     Browser (User)                     │
│                                                        │
│  Astro website (static HTML + React islands)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │Dashboard │ │  Journal │ │ Live Check│ │  Trends  │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘  │
│       │             │             │             │         │
│       └─────────────┴─────────────┴─────────────┘        │
│                     apiClient.ts                          │
│                  (fetch + WebSocket)                      │
└──────────────────────────┬──────────────────────────────┘
                           │  HTTP / WebSocket
                           ▼
┌───────────────────────────────────────────────────────┐
│               FastAPI Backend  :8000                    │
│                                                        │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  REST API   │  │  WebSocket   │  │  ML Services  │  │
│  │  /api/...   │  │ /ws/facial-  │  │  DistilRoBERTa│  │
│  │             │  │   emotion    │  │  ViT-face     │  │
│  └──────┬──────┘  └──────┬───────┘  └───────┬───────┘  │
│         └────────────────┴──────────────────┘           │
│                     SQLAlchemy ORM                        │
│                           │                              │
│          ┌────────────────┴──────────────┐               │
│          │     PostgreSQL (prod)          │               │
│          │     SQLite     (dev)           │               │
│          └───────────────────────────────┘               │
└───────────────────────────────────────────────────────┘
```

---

## Feature Overview

| Feature | What it does |
|---|---|
| **Dashboard** | Mood trend line chart, emotion distribution donut, stress/burnout risk score, quick check-in slider |
| **Live check** | Webcam stream → face crop → ViT emotion classification at ~1 fps via WebSocket |
| **Pi camera** | Remote live-check from a Raspberry Pi camera stream over its own WebSocket |
| **Journal** | Mood entries with instant transformer-based emotion tagging, plus opt-in note-source connectors (Keep, Notion, email, Apple Notes) |
| **Trends** | Weekly heatmap, facial-vs-self-report correlation, risk score, PDF/CSV export |
| **Settings** | Consent toggles, data export, GDPR-style data deletion |

---

## Tech Stack

### Frontend
| Layer | Choice | Why |
|---|---|---|
| Framework | Astro 4.5 | Static-first multi-page site; JS only where needed via islands |
| Styling | Tailwind CSS 3.4 | Design tokens in `tailwind.config.mjs` for consistency |
| Interactive islands | React 18 + `client:visible` | Charts, webcam panel, journal composer |
| Charts | Recharts 2.12 | Composable, accessible chart components |
| HTTP client | Native `fetch` wrapper | Lightweight; typed via `apiClient.ts` |

### Backend
| Layer | Choice | Why |
|---|---|---|
| API framework | FastAPI 0.110 | Async-native, auto-generates OpenAPI docs |
| Text emotion | `j-hartmann/emotion-english-distilroberta-base` | 7-class emotion (not just pos/neg) |
| Facial emotion | `trpakov/vit-face-expression` | Vision Transformer; consistent with text transformer theme |
| Face detector | OpenCV Haar Cascade | Fast pre-crop step before ViT inference |
| Backup sentiment | VADER | Near-instant polarity score without a second GPU model |
| ORM | SQLAlchemy 2.0 | Typed, async-compatible |
| Auth | JWT via `python-jose` | Stateless, easy to scale |
| DB (dev) | SQLite | Zero config local development |
| DB (prod) | PostgreSQL | Production durability |

---

## Getting Started (Both Services)

### Prerequisites

```bash
node --version    # >= 18.0
python3 --version # >= 3.11
```

### 1 — Clone the repository

```bash
git clone https://github.com/adineo-cmd/mindfulai.git
cd mindfulai
```

### 2 — Start the backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env          # then edit .env
uvicorn app.main:app --reload --port 8000
```

→ API running at **http://localhost:8000** · Docs at **http://localhost:8000/docs**

### 3 — Start the frontend

```bash
cd frontend
npm install
cp .env.example .env          # set PUBLIC_API_BASE_URL=http://localhost:8000
npm run dev
```

→ Website running at **http://localhost:4321**

Full setup details, Ubuntu system dependencies, and deployment notes are in each sub-README:

- [`frontend/README.md`](./frontend/README.md) — Astro website
- [`backend/README.md`](./backend/README.md) — FastAPI + ML backend

---

## Environment Variables — Quick Reference

### Frontend (`.env`)
```env
PUBLIC_API_BASE_URL=http://localhost:8000
```

### Backend (`.env`)
```env
DATABASE_URL=sqlite:///./mindfulai.db
SECRET_KEY=change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
FRONTEND_URL=http://localhost:4321
OLLAMA_BASE_URL=http://localhost:11434   # Reserved for the roadmap LLM companion
OLLAMA_MODEL=tinyllama
```

---

## Privacy & Ethics

MindfulAI was built with privacy as a hard constraint, not an afterthought.

- **Raw video and audio are never stored.** The live-check WebSocket sends frames; only the resulting emotion label + timestamp reach the database.
- **Explicit consent before camera activation.** The consent toggle state is stored per-user in `ConsentRecord` (`GET/PUT /api/privacy/consent`). Unchecking it immediately stops all webcam activity.
- **Full data portability.** `GET /api/privacy/export` returns a complete JSON export of everything linked to your account.
- **Right to erasure.** `DELETE /api/privacy/data` hard-deletes all user records, compliant with GDPR Article 17.
- **Crisis resources, not chatbots.** Exported PDF reports and the interface carry explicit crisis-resource disclaimers. A supportive-dialogue companion with automated escalation is on the roadmap, not in production — the system ships no unmonitored conversational AI.
- **No data sharing.** All emotion records are scoped to `user_id`; aggregate analytics are server-side only and never expose individual records.

---

## Project Status

This is a final-year academic project. The codebase is production-structured but the following are known limitations for a real deployment:

- The Ollama configuration (`tinyllama`) is reserved for the planned supportive-dialogue companion; the conversational module itself is not implemented yet.
- ML models are downloaded from HuggingFace on first inference. In production, pre-warm `model_cache` during startup.
- Auth endpoints exist but the demo stubs use `user_id = 1`. Wire in `get_current_user` (marked in comments) for real authentication.

---

## Contributing

Pull requests are welcome. Please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first — it covers the privacy ground rules, the development workflow, and the CI checks every PR must pass. Open an issue to discuss significant changes.

---

<div align="center">
  <sub>Built with care · Not a medical device · © 2026</sub>
</div>
