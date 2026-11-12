# Agent skills

Skills provide task-specific instructions that an agent can load when relevant, instead of adding every workflow to always-loaded project instructions.

## How discovery works

- Keep each shared skill at `.agents/skills/<skill-name>/SKILL.md`.
- The directory name must match the `name` in the skill's YAML frontmatter.
- Make `description` specific: it is the main signal agents use to decide when to load a skill.
- Skills are loaded on demand; users can also invoke user-visible skills by name (for example, `/cypress`).
- Keep a skill's supporting files inside its directory and link them with relative paths from `SKILL.md`.

The skill directories stay directly under `skills/` so agents can discover them using the standard layout. Categories below are an index, not another directory level.

## Skills by category

### Next.js and React

- [next-dev-loop](./next-dev-loop/SKILL.md) — verify Next.js changes in a running development app.
- [vercel-react-best-practices](./vercel-react-best-practices/SKILL.md) — React and Next.js performance guidance from Vercel Engineering; it does not require deploying to Vercel. Vendored from [vercel-labs/agent-skills](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) (MIT); the `rules/` files are its supporting content, not separate skills.

### Testing and browser automation

- [cypress](./cypress/SKILL.md) — create, update, debug, or review concise, behavior-focused Cypress end-to-end tests.
- [cypress-concise](./cypress-concise/SKILL.md) — compatibility entry for `/cypress-concise`; delegates to `cypress`.
- [jest-concise](./jest-concise/SKILL.md) — write concise, behavior-focused Jest unit tests.
- [playwright-cli](./playwright-cli/SKILL.md) — automate browsers and work with Playwright tests. Vendored from the official [microsoft/playwright-cli](https://github.com/microsoft/playwright-cli/tree/main/skills/playwright-cli) skill; the `references/` files are its supporting content.

### Data and infrastructure

- [prisma](./prisma/SKILL.md) — work with Prisma schemas, queries, migrations, and configuration.
- [scalingo-docs](./scalingo-docs/SKILL.md) — answer Scalingo questions using its official documentation.

### Development workflow

- [address-pr-comments-no-resolve](./address-pr-comments-no-resolve/SKILL.md) — review PR feedback and prepare local fixes without posting or resolving comments.
- [write-skills](./write-skills/SKILL.md) — create or improve agent skills.

## Personal and local-only skills

Personal skills can live in `~/.agents/skills/` or `~/.copilot/skills/`; they are not shared by this repository.
