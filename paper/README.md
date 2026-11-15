# MindfulAI Research Paper

LaTeX source for *MindfulAI: A Privacy-First Multi-Modal Framework for Emotion-Aware Mental Wellness Support* (arXiv-style single column, ~10 pages).

## Files

| File | Purpose |
|---|---|
| `main.tex` | Paper source (article class, natbib numeric citations) |
| `refs.bib` | Bibliography — every entry verified against public bibliographic records (November 2026) |

## Build

With [Tectonic](https://tectonic-typesetting.github.io):

```bash
tectonic main.tex
```

With TeX Live:

```bash
pdflatex main && bibtex main && pdflatex main && pdflatex main
```

Output: `main.pdf`.

## Reproducing claims

The paper describes the codebase at this repository's `main` branch. The three-channel pipeline (§3), privacy operations (§3.5), and the comparison table (§4) map directly onto `backend/app/services/`, `backend/app/models/`, and `backend/app/api/routes/`. The preregistered pilot protocol (§6.2) is not yet executed — the paper deliberately separates design contributions from clinical claims.
