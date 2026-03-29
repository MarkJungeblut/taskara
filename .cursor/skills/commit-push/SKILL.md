---
name: commit-push
description: Use when the user asks to commit, push, or ship current changes, or to save work to the remote.
---

# Commit and Push

Use this skill to ship local git work with a consistent review-and-commit flow. Execute the steps yourself; do not only tell the user what to run.

## Workflow

1. Run `git status` and review the diff meaningfully: `git diff` for unstaged changes; `git diff --cached` if anything is staged. If there is nothing to commit, stop and say so clearly.
2. Note the current branch. Confirm that pushing is appropriate: do not bundle unrelated work unless the user asked for everything; if the change set is clearly two unrelated topics, mention splitting commits—without expanding scope unless asked.
3. Stage intentionally: use `git add -u` or paths the user named for tracked changes, or explicit paths if they narrowed scope. Avoid `git add .` when it would pick up untracked files they did not intend; prefer explicit adds or ask when ambiguous.
4. Write a single conventional commit message: imperative subject line (~50–72 characters, no trailing period required); optional body in complete sentences, good grammar, plain language, only relevant detail.
5. Commit with that message, then push:
   - Prefer `git push` when an upstream already exists.
   - If there is no upstream, use `git push -u origin <current-branch>` (or equivalent) so later pushes stay simple.
6. Report the outcome: short commit hash, branch, remote, and any notable stderr (for example a rejected push).

## Safety and Boundaries

- Never use `git push --force` or `--force-with-lease` unless the user explicitly asks for a force push.
- Do not amend or rewrite published history unless explicitly asked.
- Do not skip hooks with `--no-verify` unless the user explicitly requests it.
- If the remote rejects the push (non-fast-forward, auth failure, etc.), explain briefly and suggest sensible next steps (pull/rebase, fix auth). Do not force-push to recover.

## Repository Note (Taskara)

Commits may include vault files; at runtime, application code should treat vault notes as read-only and only write dashboard artifacts under `.taskara/dashboards/` (see `.cursor/rules/taskara-core.mdc`).
