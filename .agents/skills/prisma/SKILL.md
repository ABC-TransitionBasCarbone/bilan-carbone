---
name: prisma
description: Use when working with Prisma schemas, Client queries, database migrations, generated clients, or Prisma configuration. Check the project's Prisma version before applying version-specific guidance.
---

# Prisma

Use the Prisma version and database configuration already selected by the project. Prisma's CLI, generated client, and configuration conventions vary across major versions; check the package manifests, Prisma config, and existing scripts before suggesting or running commands.

## Schema and migrations

- Inspect the schema, migration history, and applicable project instructions before changing the data model.
- Do not edit migrations that have already been applied. Add a new migration using the project's established workflow.
- Review generated SQL and migration effects, especially for column renames, required fields, defaults, indexes, and large tables.
- Never reset, drop, or force-push database state as a shortcut. Explain the specific data-loss risk and obtain explicit consent before destructive database operations.
- Regenerate Prisma Client using the repository's configured command when schema changes require it; do not assume generation happens automatically.

## Client queries

- Prefer typed Prisma model methods and the project's existing database helpers.
- Keep authorization and business rules in the project's service or permission layers rather than embedding them in route handlers or query fragments.
- Select only the fields needed and use transactions when multiple writes must succeed or fail together.
- Use parameterized Prisma APIs for user-controlled values. Do not concatenate input into SQL.
- Follow repository-specific raw SQL restrictions. In the Bilan-Carbone repository, raw SQL is select-only and must use `Prisma.sql` with `$queryRaw`.

## Validation

1. Run the existing Prisma schema validation or generation command relevant to the change.
2. Run focused tests for affected database logic.
3. Check types and inspect the final schema and migration diff. Do not claim a migration was applied unless it was actually run against the intended database.

## References

- [Prisma ORM documentation](https://www.prisma.io/docs/orm)
- [Prisma Client reference](https://www.prisma.io/docs/orm/reference/prisma-client-reference)
- [Prisma Migrate](https://www.prisma.io/docs/orm/prisma-migrate)
