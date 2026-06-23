<div align="center">

<br />

# Mindfulai — Frontend

**Astro · Tailwind CSS · React islands · TypeScript**

<br />

[![Astro](https://img.shields.io/badge/Astro-4.5-FF5D01?style=for-the-badge&logo=astro&logoColor=white)](https://astro.build)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)

</div>

---

## Overview

The Mindfulai frontend is a **multi-page static website** built with Astro. Each page is a real server-rendered HTML route — not a client-side SPA. JavaScript is added only where a section is genuinely interactive (charts, the live webcam panel, the chat window, mood sliders), using Astro's islands architecture with React components and `client:visible` / `client:load` directives.

The design is calm, clinical-but-warm: sage green and warm neutrals for most UI, muted plum for accents, IBM Plex Mono for data labels. It avoids the generic purple-gradient SaaS aesthetic common in AI demos.

---

## Pages

| Route | File | Description |
|---|---|---|
| `/` | `index.astro` | Landing page — hero, how it works, features, privacy label |
| `/dashboard` | `dashboard.astro` | Mood trend chart, emotion distribution, risk score, quick check-in |
| `/live-check` | `live-check.astro` | Webcam stream → real-time facial emotion detection |
| `/chat` | `chat.astro` | LLM companion chat with crisis escalation banner |
| `/journal` | `journal.astro` | Free-text journal with emotion tagging and history |
| `/trends` | `trends.astro` | Mood heatmap, facial/self-report correlation, PDF/CSV export |
| `/settings` | `settings.astro` | Consent toggles, data export, data deletion |

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
│   │   ├── chat.astro                 # /chat
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
│   │   │   └── MoodHeatmap.tsx        # Calendar heatmap grid
│   │   │
│   │   ├── camera/
│   │   │   └── WebcamPanel.tsx        # React island — webcam + WebSocket emotion stream
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx         # React island — message thread + send
│   │   │   └── CrisisBanner.astro    # Static alert shown on crisis flag
│   │   │
│   │   └── shared/
│   │       ├── ConsentToggle.astro    # Camera/voice consent switch
│   │       └── MetricCard.astro      # Reusable stat card (value + label)
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
// dashboard.astro
import MoodTrendChart from '../components/charts/MoodTrendChart.tsx';
---
<!-- Static HTML -->
<h1>Overview</h1>

<!-- React island — only hydrates when scrolled into view -->
<MoodTrendChart client:visible />
```

| Directive | When the island hydrates | Used for |
|---|---|---|
| `client:load` | Immediately on page load | Chat window, webcam panel |
| `client:visible` | When scrolled into view | Charts on dashboard and trends page |

---

## API Client

All backend calls are centralised in `src/lib/apiClient.ts`. Import from here on every page — never call `fetch` directly from a component.

```typescript
// src/lib/apiClient.ts
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
  getMoodTrends:          (days: number)  => apiRequest(`/api/mood/trends?days=${days}`),
  getEmotionDistribution: ()              => apiRequest(`/api/mood/emotions`),
  logMood:                (payload: any)  => apiRequest('/api/mood/log', { method: 'POST', body: JSON.stringify(payload) }),
  sendChatMessage:        (payload: any)  => apiRequest('/api/chat', { method: 'POST', body: JSON.stringify(payload) }),
  saveJournalEntry:       (payload: any)  => apiRequest('/api/journal', { method: 'POST', body: JSON.stringify(payload) }),
  getJournalHistory:      ()              => apiRequest('/api/journal'),
  getAnalytics:           ()              => apiRequest('/api/analytics/summary'),
  exportData:             ()              => apiRequest('/api/user/data'),
  deleteData:             ()              => apiRequest('/api/user/data', { method: 'DELETE' }),
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
# Local development (FastAPI running on port 8000)
PUBLIC_API_BASE_URL=http://localhost:8000

# Production (replace with your deployed backend URL)
# PUBLIC_API_BASE_URL=https://api.your-domain.com
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
  "@astrojs/tailwind": "^5.1.0",
  "astro": "^4.5.0",
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "recharts": "^2.12.2",
  "tailwindcss": "^3.4.1",
  "lucide-react": "^0.344.0"
}
```

---

## Accessibility & Motion

- All interactive islands use semantic HTML and visible focus rings.
- The recording indicator on the Live Check page uses `@media (prefers-reduced-motion: reduce)` to disable its pulse animation for users who have requested reduced motion.
- Chart components include ARIA labels describing the data for screen readers.
- The crisis banner in the chat page uses `role="alert"` so it is announced immediately by assistive technology.

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
# Drag and drop dist/ into the Netlify dashboard
# or connect the GitHub repo and set the build command to: npm run build
# Set PUBLIC_API_BASE_URL in Site Settings → Environment Variables
```

### Static server (Nginx)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/tideline/dist;
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
  <sub>Part of the Mindfulai project · Frontend only — see <a href="../backend/README.md">backend/README.md</a> for the API</sub>
</div>