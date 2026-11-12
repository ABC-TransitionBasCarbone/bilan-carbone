---
name: jest-concise
description: 'Use when creating, updating, or debugging Jest unit tests, test setup, or mocks. Keep test code and explanations concise while verifying behavior and outcomes.'
---

# Concise Jest Testing

## Procedure

1. Inspect the Jest config/setup and neighboring tests; follow the repository's existing conventions.
2. Test observable behavior, important boundaries, and error outcomes. Prefer a few focused cases over exhaustive checks of implementation details.
3. Keep fixtures and setup minimal. Reuse shared helpers, use `test.each` only for genuinely repetitive cases, and mock only external boundaries.
4. Keep test names descriptive but short. Avoid snapshots or abstractions unless they match project conventions or protect an important output contract.
5. Preserve assertions that make regressions clear; do not shorten tests by weakening coverage.
6. Run the affected test file with the repository's documented command. In the final response, state only the changed area and the exact command/result; mention failures plainly.

