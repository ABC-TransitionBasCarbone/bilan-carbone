---
name: typescript
description: 'Use when authoring, refactoring, or debugging TypeScript types and code in the strict Next.js monorepo.'
---

# TypeScript

## Procedure

1. Read the target app or package's existing types and `tsconfig.json`; the shared baseline enables `strict`.
2. Model the actual states and inputs with precise types, using unions and type guards where appropriate. Avoid `any`, unsafe casts, and duplicated shared types.
3. Keep types near their owning feature unless they are genuinely reused; put cross-app types in the appropriate shared package.
4. Use `import type` for type-only imports when consistent with the surrounding code, and follow the repository's import ordering and formatting.
5. Keep async flows on `async`/`await`. Preserve server/client boundaries and use existing authorization-aware server functions for database access.
6. Check the affected app or package with its TypeScript script and run focused tests for changed logic.
