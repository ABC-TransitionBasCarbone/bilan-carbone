---
name: cypress-concise
description: 'Use when creating, updating, or debugging Cypress end-to-end tests, specs, fixtures, or commands. Keep test code and explanations concise without weakening behavior coverage.'
---

# Concise Cypress Testing

## Procedure

1. Inspect the relevant Cypress config, support commands, and nearby specs; reuse existing setup and selectors.
2. Cover the user-visible behavior and meaningful outcomes with the smallest readable flow.
3. Keep test names descriptive but short. Avoid repeated setup, one-off helper abstractions, arbitrary waits, and assertions on implementation details.
4. Preserve useful assertions and diagnostics; concision must not reduce coverage or make failures harder to understand.
5. Run the smallest relevant spec using the repository's documented command. In the final response, state only the changed area and the exact command/result; mention failures plainly.

