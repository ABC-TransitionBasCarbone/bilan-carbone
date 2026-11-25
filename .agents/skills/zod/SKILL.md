---
name: zod
description: 'Use when creating or changing Zod schemas, parsing untrusted input, or wiring Zod validation into forms and server functions.'
---

# Zod

## Procedure

1. Check the package manifest before using version-specific APIs; this repository uses Zod 4.
2. Inspect nearby schemas and the boundary where validation runs. Validate untrusted input at that boundary rather than trusting client-provided types.
3. Reuse or compose schemas where rules are shared. Encode normalization and constraints in the schema, and use refinements only for rules that cannot be represented directly.
4. Derive TypeScript types from schemas with `z.infer` (or input/output types when transforms change the shape); avoid maintaining a duplicate type by hand.
5. Preserve localized validation messages. Shared Zod error configuration lives in `packages/common/zod.config.ts`; do not replace it with hardcoded user-facing messages.
6. Check how errors are surfaced by the calling form or server function, then run focused validation tests and the affected app's TypeScript check.

## References

- [Zod documentation](https://zod.dev/)
