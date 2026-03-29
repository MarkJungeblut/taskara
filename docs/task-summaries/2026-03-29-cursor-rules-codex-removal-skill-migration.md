# Task Summary

## Goal

Establish persistent Cursor project context (rules + index ignore), remove unused Codex assets from the repo, and keep task-summary workflows available as first-class Cursor project skills.

## Changes Made

- Added `.cursor/rules/` with `taskara-core` (always-apply), `nextjs-app` (app glob), and optional `quality-bar` (TS/TSX); added `.cursorignore` for heavy build dirs while leaving `example-vault/` indexable.
- Documented AI setup in the README and renamed the devcontainer forwarded port label to a tool-neutral OAuth/AI auth callback.
- Removed Codex-specific layout: deleted `.codex/agents` personas, Codex skill glue YAML, devcontainer `postCreateCommand` / `post-create.sh`, and `.codex` from `.dockerignore`; updated docs that referenced Codex.
- Migrated `create-summary` and `check-last-summary` from `.agents/skills/` to [.cursor/skills/](.cursor/skills/), updated pointers in README and `taskara-core.mdc`, removed `.agents` and dropped it from `.dockerignore`.

## Files Touched

- `.cursor/rules/taskara-core.mdc`
- `.cursor/rules/nextjs-app.mdc`
- `.cursor/rules/quality-bar.mdc`
- `.cursorignore`
- `.cursor/skills/create-summary/SKILL.md`
- `.cursor/skills/check-last-summary/SKILL.md`
- `README.md`
- `.devcontainer/react-fullstack/devcontainer.json`
- `.dockerignore`
- `docs/task-summaries/2026-03-27-baseline-repo-setup.md`
- Removed: `.codex/` (agent Toml), `.agents/` (old skill paths), `.devcontainer/scripts/post-create.sh`

## Decisions

- Long agent persona text is not duplicated in Cursor rules; `.mdc` files summarize overlapping principles only.
- Project skills canonical location is `.cursor/skills/` so Cursor discovers them without Codex metadata.

## Follow-Ups

- None required; optionally confirm both skills appear in the Cursor skills UI after a workspace reload.
