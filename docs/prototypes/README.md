# InkOS Prototypes

This directory contains validation-only HTML prototypes.

Current scope:

- `index.html`: prototype entry for the current baseline
- `system/v2/`: preserved v2 shared runtime and styles
- `system/v3/`: fully new v3 shared runtime, styles, and mock state
- `pages/<page>/v2/`: preserved legacy prototype pages
- `pages/<page>/v3/`: current v3 prototype pages rebuilt from `docs/v3/*`

Current v3 page set:

- `pages/dashboard/v3/`
- `pages/chief/v3/`
- `pages/books/v3/`
- `pages/book-overview/v3/`
- `pages/chapter-workbench/v3/`
- `pages/truth-center/v3/`
- `pages/materials-center/v3/`
- `pages/automation-center/v3/`
- `pages/settings/v3/`

Prototype rules:

- `v2` stays frozen for comparison; this round should not modify `system/v2` or `pages/*/v2`.
- `v3` is the current design-validation track and follows `docs/v3/frontend-design-v3.md` and `docs/v3/frontend-requirements-v3.md`.
- `v3` must validate the `/chief` main workspace, modal upgrade rules, explicit navigation actions, and responsive downgrade behavior.
- `v3` uses one shared mock source to model `Thread / Run / ToolPresentation / DraftArtifact`.
- These files validate product and UX assumptions only; they are not production implementation.
