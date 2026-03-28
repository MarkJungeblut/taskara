# Taskara

Taskara is a local-first dashboard app for Markdown vaults with YAML frontmatter. It scans one Obsidian vault, discovers frontmatter fields dynamically, lets you filter notes in a browser UI, and saves dashboards as shareable YAML files inside the vault.

## What v1 Does

- Reads `*.md` files from one vault
- Parses frontmatter at the top of each note between `---` markers
- Supports generic frontmatter keys with these value types:
  - strings
  - numbers
  - booleans
  - dates in `YYYY-MM-DD`
  - lists of strings
- Builds saved dashboards with:
  - `AND` filters
  - visible columns
  - optional sorting
- Writes dashboard YAML files to `.taskara/dashboards/`
- Watches the vault for changes and also offers a manual rescan button

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start the app against the included sample vault:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000)

By default the app reads from `./example-vault`. To point it at a real vault:

```bash
VAULT_PATH=/absolute/path/to/your/vault npm run dev
```

## Docker Compose

Run the app in Docker with the sample vault:

```bash
docker compose up --build
```

To use a real Obsidian vault instead, set `TASKARA_VAULT_PATH` before starting Compose:

```bash
TASKARA_VAULT_PATH=/absolute/path/to/your/vault docker compose up --build
```

The container mounts the vault at `/vault`. The app treats note files as read-only in code and only writes dashboard files under `.taskara/dashboards/`.

## Dashboard File Format

Dashboard files live in `.taskara/dashboards/*.yaml`.

Example:

```yaml
version: 1
name: Foo Meeting Minutes
filters:
  - field: type
    operator: equals
    value: meeting-minute
  - field: project
    operator: equals
    value: foo
  - field: start-date
    operator: greater_than_or_equal
    value: 2026-01-01
columns:
  - title
  - project
  - start-date
  - path
sort:
  field: start-date
  direction: desc
```

## Scripts

- `npm run dev` starts the local Next.js server
- `npm run build` builds the production app
- `npm run start` runs the production build
- `npm test` runs the TypeScript test suite

## Example Vault

`example-vault/` includes:

- sample meeting and project notes
- a saved dashboard under `.taskara/dashboards/`

It is meant to make the app runnable immediately after setup.
