<div align="center">

<br />

# MindfulAI — Frontend

**Astro · Tailwind CSS · React islands · TypeScript**

<br />

[![Astro](https://img.shields.io/badge/Astro-4.5-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## Overview

The MindfulAI frontend is a **multi-page static website** built with Astro. Each page is a real server-rendered HTML route — not a client-side SPA. JavaScript is added only where a section is genuinely interactive (charts, the live webcam panel, the journal composer, mood sliders), using Astro's islands architecture with React components and `client:visible` / `client:load` directives.

The design is calm, clinical-but-warm: sage green and warm neutrals for most UI, muted plum for accents, IBM Plex Mono for data labels. It avoids the generic purple-gradient SaaS aesthetic common in AI demos.

---

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `index.astro` | Landing page — hero, how it works, features, privacy label |
| `/dashboard` | `dashboard.astro` | Mood trend chart, emotion distribution, risk score, quick check-in |
| `/live-check` | `live-check.astro` | Webcam stream → real-time facial emotion detection |
| `/pi-camera` | `pi-camera.astro` | Remote live-check from a Raspberry Pi camera stream |
| `/journal` | `journal.astro` | Mood entries with emotion tagging, history, and note-source connectors |
| `/trends` | `trends.astro` | Mood heatmap, facial/self-report correlation, PDF/CSV export |
| `/settings` | `settings.astro` | Consent toggles, user switcher, privacy preferences |

---

## Folder Structure

```
frontend/
│
├── public/
│   └── favicon.svg                    # Site icon
│
├── src/
│   │
│   ├── pages/                         # One .astro file = one URL route
│   │   ├── index.astro                # /
│   │   ├── dashboard.astro            # /dashboard
│   │   ├── live-check.astro           # /live-check
│   │   ├── pi-camera.astro            # /pi-camera
│   │   ├── journal.astro              # /journal
│   │   ├── trends.astro               # /trends
│   │   └── settings.astro             # /settings
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro           # Shared <head>, <Nav />, <Footer /> wrapper
│   │
│   ├── components/
│   │   │
│   │   ├── Nav.astro                  # Top navigation bar (static)
│   │   ├── Footer.astro               # Footer with disclaimer (static)
│   │   │
│   │   ├── charts/                    # React islands — hydrated client-side
│   │   │   ├── MoodTrendChart.tsx     # Line chart (Recharts) — 7/30/90d toggle
│   │   │   ├── EmotionDistributionChart.tsx  # Donut chart
│   │   │   ├── MoodHeatmap.tsx        # Calendar heatmap grid
│   │   │   └── CorrelationInsights.tsx  # Facial vs. self-report correlation
│   │   │
│   │   ├── camera/
│   │   │   ├── WebcamPanel.tsx        # React island — webcam + WebSocket emotion stream
│   │   │   └── PiCameraPanel.tsx      # React island — Pi camera live view
│   │   │
│   │   ├── journal/
│   │   │   ├── Journal.tsx            # React island — entry composer + history
│   │   │   └── JournalIntegrations.tsx  # Note-source connectors UI
│   │   │
│   │   ├── settings/
│   │   │   └── SettingsManager.tsx    # React island — consent + privacy controls
│   │   │
│   │   └── shared/
│   │       ├── ConsentToggle.astro    # Camera/text consent switch
│   │       ├── DashboardMetrics.tsx   # React island — dashboard metric row
│   │       ├── ExportButtons.tsx      # PDF/CSV export triggers
│   │       ├── MetricCard.astro       # Reusable stat card (value + label)
│   │       └── UserSwitcher.tsx       # Demo helper — switch active user
│   │
│   ├── lib/
│   │   └── apiClient.ts               # Typed fetch wrapper — all backend calls live here
│   │
│   ├── styles/
│   │   └── global.css                 # Tailwind base imports + custom global rules
│   │
│   └── env.d.ts                       # ImportMeta env type declarations
│
├── astro.config.mjs                   # Astro integrations: react, tailwind
├── tailwind.config.mjs                # Design tokens — colors, fonts, radii
├── .env.example                       # Template — copy to .env and set the backend URL
├── package.json
└── README.md                          # ← You are here
```

---

## Design System

All design tokens live in `tailwind.config.mjs` so every page stays visually consistent.

### Color Palette

| Token | Hex | Used for |
|---|---|---|
| `sage-600` | `#3e633e` | Primary action buttons, active nav links, chart lines |
| `sage-50` | `#f4f7f4` | Page background |
| `plum-500` | `#7a5499` | Secondary accent, emotion distribution chart |
| `warm-100` | `#faf8f5` | Card surfaces |
| `warm-400` | `#d4c8b8` | Borders and dividers |

### Typography

| Font | Usage |
|---|---|
| Inter (via system stack) | Body text, labels, navigation |
| IBM Plex Mono | Metric values, timestamps, data labels |

### Islands Architecture

Astro renders every page to static HTML at build time. Interactive components are **islands** — isolated React bundles that hydrate independently in the browser.

```astro
---
import MoodTrendChart from '../components/charts/MoodTrendChart.tsx';
---
<h1>Overview</h1>
<MoodTrendChart client:visible />
```

| Directive | When the island hydrates | Used for |
|---|---|---|
| `client:load` | Immediately on page load | Webcam panel, Pi camera panel |
| `client:visible` | When scrolled into view | Charts on dashboard and trends page |

---

## API Client

All backend calls are centralised in `src/lib/apiClient.ts`. Import from here on every page — never call `fetch` directly from a component.

```typescript
const API_BASE = import.meta.env.PUBLIC_API_BASE_URL || 'http://localhost:8000';

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!response.ok) throw new Error(`API Error: ${response.status}`);
  return response.json();
}

export const api = {
  register:               (email: string, password: string) => apiRequest('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password }) }),
  login:                  (email: string, password: string) => apiRequest('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  submitJournal:          (payload: any)  => apiRequest('/api/journal', { method: 'POST', body: JSON.stringify(payload) }),
  getJournalHistory:      ()              => apiRequest('/api/journal'),
  getMoodTrends:          (days: number)  => apiRequest(`/api/mood/trends?days=${days}`),
  getEmotionDistribution: (source: 'all' | 'text' | 'facial' = 'all') => apiRequest(`/api/mood/emotions?source=${source}`),
  getHeatmapData:         ()              => apiRequest('/api/mood/heatmap'),
  getRiskScore:           (days: number)  => apiRequest(`/api/mood/risk-score?days=${days}`),
  getCorrelationData:     ()              => apiRequest('/api/mood/correlation'),
  getAvailableConnectors: ()              => apiRequest('/api/connectors/available'),
  connectSource:          (data: any)     => apiRequest('/api/connectors/connect', { method: 'POST', body: JSON.stringify(data) }),
  syncSource:             (data: any)     => apiRequest('/api/connectors/sync', { method: 'POST', body: JSON.stringify(data) }),
  analyzeText:            (text: string)  => apiRequest('/api/text-emotion/analyze', { method: 'POST', body: JSON.stringify({ text }) }),
  analyzeFace:            (image_base64: string) => apiRequest('/api/facial-emotion/analyze', { method: 'POST', body: JSON.stringify({ image_base64 }) }),
  getLatestPiEmotion:     ()              => apiRequest('/api/pi-camera/latest'),
  getPiCameraStatus:      ()              => apiRequest('/api/pi-camera/status'),
};
```

The WebSocket for the live check page is opened directly in `WebcamPanel.tsx`:

```typescript
const ws = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/facial-emotion`);
```

---

## Prerequisites

- **Node.js** 18 or higher
- **npm** 9 or higher (comes with Node)

---

## Setup & Installation

### 1 — Install dependencies

```bash
cd frontend
npm install
```

### 2 — Configure the environment

Create a `.env` file by copying the example:

```bash
cp .env.example .env
```

Open `.env` and set the backend URL:

```env
PUBLIC_API_BASE_URL=http://localhost:8000
```

### 3 — Start the development server

```bash
npm run dev
```

The website will be available at **http://localhost:4321**.

Hot module replacement is enabled — changes to `.astro`, `.tsx`, `.css`, and `tailwind.config.mjs` reflect instantly.

### 4 — Build for production

```bash
npm run build
```

This generates fully static HTML files in `dist/`. The output can be deployed to any static host — Vercel, Netlify, Cloudflare Pages, or a plain Nginx/Apache server.

### 5 — Preview the production build locally

```bash
npm run preview
```

Serves `dist/` at **http://localhost:4321** — identical to what would be served in production.

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start local dev server with HMR at `localhost:4321` |
| `npm run build` | Build static site to `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro` | Access the Astro CLI directly |

---

## Key Dependencies

```json
{
  "@astrojs/react": "^3.0.10",
  "@astrojs/tailwind": "^6.0.2",
  "astro": "^4.16.19",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "recharts": "^2.12.2",
  "tailwindcss": "^3.4.19",
  "lucide-react": "^0.344.0"
}
```

---

## Accessibility & Motion

- All interactive islands use semantic HTML and visible focus rings.
- The recording indicator on the Live Check page uses `@media (prefers-reduced-motion: reduce)` to disable its pulse animation for users who have requested reduced motion.
- Chart components include ARIA labels describing the data for screen readers.
- The site-wide crisis disclaimer lives in the footer as plain text, so assistive technology reads it immediately.

---

## Deployment

### Vercel (recommended)

```bash
npm install -g vercel
vercel --prod
```

Set `PUBLIC_API_BASE_URL` in the Vercel project environment variables dashboard.

### Netlify

```bash
npm run build
```

Connect the GitHub repo with build command `npm run build`, or drag `dist/` into the Netlify dashboard. Set `PUBLIC_API_BASE_URL` in Site Settings → Environment Variables.

### Static server (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/mindfulai/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Environment Variable Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `PUBLIC_API_BASE_URL` | Yes | `http://localhost:8000` | Base URL of the FastAPI backend |

---

## Troubleshooting

**Charts don't render on the dashboard.**
Make sure the backend is running and `PUBLIC_API_BASE_URL` in `.env` points to it. The chart components show a loading state while fetching; if the fetch fails they show an error boundary.

**Webcam panel shows "Camera preview not available."**
The browser requires HTTPS for `getUserMedia` in production. In development (`localhost`) it works over HTTP. For production deployments, ensure your domain has a valid TLS certificate.

**Tailwind classes not applying.**
Run `npm run build` once to purge and regenerate. In dev, HMR handles this automatically.

---

<div align="center">
  <sub>Part of the MindfulAI project · Frontend only — see <a href="../backend/README.md">backend/README.md</a> for the API</sub>
</div>
