---
name: zustand
description: 'Use when creating, changing, or debugging Zustand stores and client state in the BC or MIP apps.'
---

# Zustand

## Procedure

1. Inspect the nearest store and the package manifest; the apps use Zustand 5.
2. Keep a store for client state that must be shared across components. Prefer component state for state with a single local owner, and avoid duplicating server-owned data without a clear synchronization need.
3. Give the store an explicit state type and keep related actions alongside the state they update. Preserve existing naming and store placement.
4. Select only the state needed by a component to avoid unnecessary subscriptions and renders.
5. Keep derived values derived rather than storing a second source of truth. Add middleware only when the feature needs it and follows an existing project pattern.
6. Test state transitions and observable outcomes, then run the affected app's TypeScript check.

## References

- [Zustand documentation](https://zustand.docs.pmnd.rs/)
