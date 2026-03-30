# query-preview feature

Purpose: debounce dashboard draft updates and fetch query preview rows.

Public API:
- `useQueryPreview(draft)`

Dependencies:
- `/api/query/preview`
- `frontend/features/dashboard-editor/model/dashboardDraft.ts`
- `frontend/shared/http/fetchJson.ts`
