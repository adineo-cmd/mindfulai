# Contributing to MindfulAI

Thank you for considering a contribution. MindfulAI is a privacy-first wellness research project — please keep its core guarantees intact in every change.

## Ground rules

1. **Never persist raw media.** Video frames and audio exist only in memory for the duration of an inference. Do not add columns, endpoints, or logs that store them.
2. **Respect consent gating.** Every camera-related code path must be gated by the per-user consent record and stop immediately when consent is withdrawn.
3. **Never commit biometric material.** `backend/reference_images/` and `backend/backend/` are git-ignored by design. Enrollment photos stay local.
4. **No clinical claims.** The READMEs, UI, and paper describe a wellness tool, not a medical device. Do not add diagnostic or therapeutic language.
5. **Crisis communication stays human-directed.** Do not ship automated conversational support without the escalation machinery described in `paper/main.tex` (roadmap section).

## Development workflow

1. Fork or branch from `main`.
2. Backend changes: create a virtualenv, `pip install -r requirements.txt -r requirements-dev.txt`, then run:

   ```bash
   ruff check app
   pytest app/tests/test_analytics.py -v
   ```

   The ML tests (`test_text_emotion.py`, `test_facial_emotion.py`) download HuggingFace models on first run — run them locally before opening a PR that touches the ML services.
3. Frontend changes: `npm ci && npm run build` must succeed.
4. CI runs the lint, the analytics unit tests, and the frontend build on every PR. Keep it green.
5. Open a pull request with a short description of what changed and why. Reference any related issue.

## Code style

- Python: `ruff` (config in `backend/ruff.toml`) — the CI gate is authoritative.
- TypeScript/Astro: follow the existing patterns in `frontend/src/`; keep all backend calls centralized in `src/lib/apiClient.ts`.

## Reporting issues

Use the issue templates. For privacy-sensitive reports, do not include real user data or biometric images.
