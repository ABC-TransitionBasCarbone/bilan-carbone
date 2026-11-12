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
- [vercel-react-best-practices](./vercel-react-best-practices/SKILL.md) — React and Next.js performance guidance from Vercel Engineering; it does not require deploying to Vercel.

### Testing and browser automation

- [cypress](./cypress/SKILL.md) — create, update, debug, or review Cypress end-to-end tests.
- [cypress-concise](./cypress-concise/SKILL.md) — keep Cypress tests and explanations concise without weakening coverage.
- [jest-concise](./jest-concise/SKILL.md) — write concise, behavior-focused Jest unit tests.
- [playwright-cli](./playwright-cli/SKILL.md) — automate browsers and work with Playwright tests.

### Data and infrastructure

- [prisma](./prisma/SKILL.md) — work with Prisma schemas, queries, migrations, and configuration.
- [scalingo-docs](./scalingo-docs/SKILL.md) — answer Scalingo questions using its official documentation.

### Development workflow

- [address-pr-comments-no-resolve](./address-pr-comments-no-resolve/SKILL.md) — review PR feedback and prepare local fixes without posting or resolving comments.
- [write-skills](./write-skills/SKILL.md) — create or improve agent skills.

## Personal and local-only skills

Personal skills can live in `~/.agents/skills/` or `~/.copilot/skills/`; they are not shared by this repository. `.agents.local/` is gitignored for local files, but it is not a standard skill discovery path. Put skills there only if your tooling loads them explicitly; use a supported personal skill directory for automatic discovery.

## Next.js upstream skills

The skills in [vercel/next.js `.agents/skills`](https://github.com/vercel/next.js/tree/canary/.agents/skills) are primarily for contributing to the Next.js framework, its tests, release process, and documentation. No skill from that collection directly fits building or deploying this application to Scalingo, so none was copied. The existing `next-dev-loop` and `vercel-react-best-practices` skills cover the app-level Next.js workflows relevant here.
