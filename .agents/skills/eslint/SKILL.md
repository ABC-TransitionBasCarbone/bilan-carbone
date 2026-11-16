---
name: eslint
description: 'Use when diagnosing lint failures, changing ESLint configuration, or adding ESLint rules in this monorepo.'
---

# ESLint

## Procedure

1. Inspect the target app's flat config and the shared rules in `eslint.config.base.mjs`; BC and MIP extend the shared setup.
2. Prefer fixing the code to satisfy an existing rule. Do not disable or weaken a rule broadly to silence a local failure.
3. For configuration changes, use the existing ESLint 9 flat-config conventions and keep app-specific rules in that app's config.
4. Preserve Prettier integration and existing overrides for declarations, tests, and Cypress files.
5. Validate with the target app's lint script, which checks Prettier formatting and runs ESLint.
