---
name: mui
description: 'Use when building, styling, or debugging MUI components, themes, or MUI X widgets in the BC or MIP apps.'
---

# MUI

## Procedure

1. Check the target app's package manifest before relying on MUI or MUI X APIs; the apps use MUI 7 and MUI X 8.
2. Inspect nearby components and the active theme. Shared theme code is in `packages/common/components/ui/css/theme.ts`; BC also has environment-specific themes.
3. Keep app UI in the existing component and styling layers. Use CSS Modules and shared utility classes; do not add inline styles or `sx` props in app code.
4. Prefer theme-aware `styled` components for reusable MUI styling. Filter custom styling props with `shouldForwardProp` so they do not leak to DOM elements.
5. Reuse shared components from `packages/common` when the behavior belongs to both apps; keep app-specific UI in that app.
6. Preserve localization with `next-intl` and existing accessibility, responsive, and form conventions.
7. Verify the affected app with its focused tests, TypeScript check, or lint command, depending on the change.

## References

- [MUI documentation](https://mui.com/material-ui/getting-started/)
