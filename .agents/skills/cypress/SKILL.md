---
name: cypress
description: Use when creating, updating, debugging, or reviewing Cypress end-to-end tests, Cypress configuration, fixtures, or custom commands.
---

# Cypress

Follow the Cypress version and patterns already used in the project. Read its Cypress configuration, nearby specs, support files, and package scripts before changing tests.

## Writing or updating tests

- Test observable user behavior and outcomes rather than component implementation details.
- Reuse existing custom commands, fixtures, and test data setup. Keep each test independent and clean up data it creates.
- Prefer stable selectors already used by the app, such as accessible roles, labels, or dedicated test attributes. Avoid selectors coupled to styling or DOM structure.
- Use Cypress retryable queries and assertions. Avoid arbitrary `cy.wait(number)` delays; wait on a meaningful condition or a specifically aliased network request.
- Use `cy.intercept` when the test needs to control or verify a network interaction. Do not stub requests when the real behavior is part of the scenario being verified.
- Keep secrets and environment-specific configuration out of specs. Use the project's existing Cypress environment-variable and authentication setup.

## Debugging and verification

1. Reproduce the failure with the narrowest relevant Cypress spec or configured test command.
2. Inspect the command log, browser console, and relevant requests before changing timeouts or adding waits.
3. Make the smallest fix that addresses the flaky assumption or incorrect expectation.
4. Re-run the affected spec, then any broader suite appropriate to the change. Report exactly what ran and whether it passed.

## References

- [Cypress documentation](https://docs.cypress.io/)
- [Cypress testing best practices](https://docs.cypress.io/app/core-concepts/best-practices)
- [Cypress AI Skills](https://docs.cypress.io/app/tooling/ai-skills)
