# Task Summary

## Goal

Reorganise the codebase from a flat `src/lib/` structure into explicit `backend/` and `frontend/` packages with clear domain boundaries, and fix the Next.js standalone build so `npm run start` correctly serves static assets.

## Changes Made

- Created `backend/` with domain models, DTOs, errors, repositories, infrastructure (vault scanner, frontmatter parser, dashboard repository), and services; replaced all `src/lib` imports in API routes and tests.
- Created `frontend/` as a feature-sliced layout (dashboard-editor, dashboard-files, query-preview, workspace) with React controllers and shared utilities; wired `app/page.tsx` to the new `DashboardApp` location.
- Added `@backend` and `@frontend` path aliases to `tsconfig.json`.
- Added `eslint` + `typescript-eslint` devDependencies and `eslint.config.mjs`.
- Added `postbuild` script to `package.json` (`cp -r .next/static .next/standalone/.next/static`) so the standalone server can find compiled CSS/JS bundles.

## Files Touched

- `backend/` (all new files — domain models, DTOs, errors, infrastructure, repositories, services)
- `frontend/` (all new files — feature controllers, shared utils, DashboardApp UI)
- `app/api/dashboards/[slug]/route.ts`
- `app/api/dashboards/route.ts`
- `app/api/fields/route.ts`
- `app/api/index/rescan/route.ts`
- `app/api/index/status/route.ts`
- `app/api/query/preview/route.ts`
- `app/page.tsx`
- `tests/dashboard-files.test.ts`
- `tests/frontmatter.test.ts`
- `tests/query.test.ts`
- `tests/vault-scan.test.ts`
- `tsconfig.json`
- `package.json`
- `package-lock.json`
- `eslint.config.mjs`

## Decisions

- `backend/` owns all server-side logic; API routes are thin adapters that call `getVaultWorkspaceService()` and parse/validate payloads via DTO parsers.
- `frontend/` uses a feature-slice layout: each feature owns its controller hooks; the UI layer (`DashboardApp`) wires them together.
- Vault note files remain read-only in application code; only `.taskara/dashboards/` is written by `FileSystemDashboardRepository`.
- The `postbuild` hook is the canonical fix for standalone static-asset serving — no extra manual copy step needed.

## Follow-Ups

- `src/lib/` still exists and may contain orphaned files; consider deleting it once confirmed nothing imports from it.
- Two untracked vault files (`untitled-dashboard.yaml`, `untitled-dashboardggg.yaml`) were left out of the commit — delete or archive them if they are test artifacts.
