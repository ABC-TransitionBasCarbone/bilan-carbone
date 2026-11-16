---
name: prettier
description: 'Use when formatting code, diagnosing Prettier differences, or changing formatting configuration in this monorepo.'
---

# Prettier

## Procedure

1. Read the root `.prettierrc.json`; it is canonical for the monorepo. Do not add per-app Prettier configs.
2. Preserve the existing style: no semicolons, single quotes, two-space indentation, LF endings, 120-column print width, and the configured import and Prisma plugins.
3. Prefer formatting the affected files or using the owning app's existing format script. Avoid unrelated formatting churn.
4. If formatting conflicts with ESLint, inspect the shared ESLint configuration and existing integration instead of changing either tool's settings speculatively.
5. Validate with the target app's lint script or the relevant Prettier check.

## References

- [Prettier documentation](https://prettier.io/docs/)
