---
name: create-summary
description: Create a new committed task summary in docs/task-summaries for a completed non-trivial task in this repository. Use when the user asks to create a summary, finish a task with a handoff note, or capture what was done in the current thread.
---

# Create Summary

Use this skill to create a new task summary file for a completed non-trivial task in this repository.

## Workflow

1. Inspect the current task or thread context to identify:
   - the task goal
   - the main changes made
   - the files touched
   - durable decisions or important assumptions
   - unresolved follow-ups
2. Read `docs/task-summaries/_template.md` and follow its section structure exactly.
3. Create a new file in `docs/task-summaries/` named `YYYY-MM-DD-short-task-name.md`.
4. Derive a short, readable slug from the completed task. Keep it concise and descriptive.
5. If the filename already exists, do not overwrite it. Pick a more specific slug and create a new file instead.
6. Populate the summary with these exact sections:
   - `# Task Summary`
   - `## Goal`
   - `## Changes Made`
   - `## Files Touched`
   - `## Decisions`
   - `## Follow-Ups`

## Writing Rules

- Keep the summary short, structured, and handoff-focused.
- Write `Goal` as 1-2 sentences.
- Write `Changes Made` as 2-5 short bullets.
- Write `Files Touched` as a flat list of repository-relative paths.
- Include only durable decisions or important assumptions in `Decisions`.
- Include only unresolved next steps or intentionally deferred work in `Follow-Ups`.
- Do not save a transcript, retrospective, or long narrative.
- Do not update an older summary unless the user explicitly asks for an update instead of a new summary.

## Repository Conventions

- Summaries in this repository are committed docs, not private notes.
- Store all task summaries in `docs/task-summaries/`.
- Use `docs/task-summaries/2026-03-26-task-summary-convention.md` as a concrete example of the expected style and level of detail.
