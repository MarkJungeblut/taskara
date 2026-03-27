# Taskara

## Quick Start

1. Open this repository in one of the devcontainers listed below.
2. Wait for container startup to finish.
3. From the repository root, run:

```bash
codex
```

4. If Codex prompts for sign-in, complete the browser-based flow and return to the terminal when authentication finishes.

Useful verification commands inside the container:

```bash
codex --version
node --version  # React fullstack container
```

## Best Practices

- Start a new Codex thread for each distinct task to keep context focused and token use efficient.
- Begin with a clear goal, relevant file paths, and any important constraints or preferences.
- Use planning before implementation for non-trivial, cross-cutting, or higher-risk changes.
- Keep requests bounded so verification and handoff stay easy to understand.
- Ask Codex to run the smallest relevant verification for the change.

## Choose Your Setup

| Use this when | Devcontainer | Includes |
| --- | --- | --- |
| You are working on a Next.js and TypeScript fullstack app | [`.devcontainer/react-fullstack/devcontainer.json`](.devcontainer/react-fullstack/devcontainer.json) | Node.js 22 and common React editor extensions for ESLint, Prettier, and Tailwind CSS |

You can open the repository in any editor that supports Dev Containers, including VS Code, Cursor, and GitHub Codespaces.

Repo-owned Codex customization:

- [`.codex/agents/`](.codex/agents/) contains repo-owned subagent definitions that are committed and shared.
- Keep repo-specific Codex behavior in version-controlled config so contributors get the same baseline setup.

## References

- [Codex CLI docs](https://developers.openai.com/codex/cli)
- [OpenAI Codex repository](https://github.com/openai/codex)
- [OpenAPI Skill repository](https://github.com/openai/skills)
- [Awesome Codex Subagents](https://github.com/VoltAgent/awesome-codex-subagents)
