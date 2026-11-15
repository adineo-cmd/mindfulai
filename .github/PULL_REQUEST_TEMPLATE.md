# Summary

What does this PR change and why? Reference any related issue.

# Privacy checklist

- [ ] No raw video/audio is persisted anywhere in this change
- [ ] Camera paths remain gated by the per-user consent record
- [ ] No biometric material is committed (reference images stay git-ignored)
- [ ] No clinical/diagnostic claims added to UI or docs

# Verification

- [ ] `ruff check app` passes
- [ ] `pytest app/tests/test_analytics.py -v` passes
- [ ] `npm run build` succeeds (frontend changes)
