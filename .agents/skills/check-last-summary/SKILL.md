---
name: check-last-summary
description: Read the most recent persisted task summary in docs/task-summaries for this repository and turn it into a concise session-resume recap. Use when the user asks to continue from the last session, wants the latest committed summary for context, or explicitly invokes $check-last-summary before starting more work.
---

# Check Last Summary

Use this skill to recover the latest committed handoff context from this repository without creating or modifying files.

## Workflow

1. Treat `docs/task-summaries/` as the persisted summary store for this repository.
2. Ignore `docs/task-summaries/_template.md`.
3. Identify the last summary with this priority:
   - Prefer the most recently committed summary file affecting `docs/task-summaries/`.
   - If git history is unavailable or inconclusive, fall back to the newest file matching `YYYY-MM-DD-*.md` by filename sort.
4. Read the selected summary and extract:
   - the goal
   - the main changes made
   - the files or areas touched
   - durable decisions or important assumptions
   - unresolved follow-ups
5. Return a concise resume recap for the current session. Include the summary filename you used so the user can inspect it quickly if needed.
6. If no prior summary exists, say that clearly and avoid inventing prior context.

## Output Rules

- Keep the recap short and action-oriented.
- Focus on durable context that helps resume work, not a transcript of the earlier thread.
- Call out unresolved follow-ups or intentional deferrals explicitly.
- Do not create, edit, or delete files.

## Repository Conventions

- Task summaries in this repository are committed Markdown files under `docs/task-summaries/`.
- The shared summary template lives at `docs/task-summaries/_template.md`.
- Use `docs/task-summaries/2026-03-26-task-summary-convention.md` as a concrete style example if you need to understand the structure of persisted summaries.
