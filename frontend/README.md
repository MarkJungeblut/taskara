# Frontend boundaries

- `app/` contains only route entrypoints and layout glue.
- Feature logic lives under `frontend/features/*`.
- Shared modules in `frontend/shared/*` must be generic and cross-feature.
- Frontend imports backend contracts only via explicit aliases (`@backend/*`).
