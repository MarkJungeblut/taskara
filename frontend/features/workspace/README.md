# workspace feature

Purpose: load and monitor workspace-level data (status, fields, and saved dashboards).

Public API:
- `useWorkspace()`

Dependencies:
- `/api/index/status`
- `/api/index/rescan`
- `/api/fields`
- `/api/dashboards`
- `frontend/shared/http/fetchJson.ts`
