# Copilot Instructions for bilan-carbone and mip

## Scope

Monorepo Next.js (Yarn workspaces + Turbo) for carbon accounting products:
- apps/bilan-carbone
- apps/mip
- packages/* shared libs (db-common, i18n, components, services, typeguards, publicodes, ui, utils)

## Architecture Essentials

- UI routes/components: apps/*/src/app and apps/*/src/components
- APIs: apps/*/src/app/api
- DB schema: packages/db-common/prisma/schema
- DB access and business logic: apps/*/src/db and apps/*/src/services
- Shared types/constants: src/types and src/constants (or shared packages when reusable)

## Preferred Commands

Run from repo root unless specified:
- Dev all: yarn dev
- Dev BC only: yarn dev:bc
- Dev MIP only: yarn dev:mip
- Lint: yarn lint
- Typecheck: yarn ts
- Tests: yarn test
- App-local tests: (cd apps/bilan-carbone && yarn test) or (cd apps/mip && yarn test)

## Core Conventions

- TypeScript strict typing everywhere. Avoid unknown chains and double casting.
- Async server/data flows use async/await.
- User-facing text must be localized with next-intl.
- No leading semicolons. Use project prettier style.
- Keep logic in the right layer: permissions in services/permissions, not inline in route/server handlers.

## Prisma Rules

- Use Prisma model methods for mutations (insert/update/delete).
- Raw SQL is select-only via Prisma.sql + $queryRaw.
- Never edit already applied migrations. Create a new migration.

## React / Next.js Rules

- Default to Server Components. Use client components only when hooks/browser APIs are needed.
- Avoid useEffect for server-loadable data.
- For localStorage or URL-derived initial client state, use lazy useState initialization.
- Use arrow function components, including route page components and section components.

## Styling Rules

- No inline style and no MUI sx prop in app code.
- Use CSS modules for local styles.
- Prefer shared utility classes from packages/css/style first.
- Use classNames when composing global utilities with module classes.
- Use shared color CSS variables (no hardcoded hex, no white/#fff literals).
- Keep typography consistent with project theme conventions.

## Code Organization

- One component per file.
- Group by feature folder.
- Do not add app-local empty re-export files.
- Before creating app-local types/components, check if it belongs in shared packages.
- Survey reusable UI/types should live in shared packages and be imported from there.

## Tooling Rules

- Root prettier/eslint/tsconfig base are canonical.
- Do not add per-app prettier configs.
- Keep app tsconfig focused on app-specific overrides only.
- Keep README footprint minimal:
  - root README.md
  - apps/bilan-carbone/README.md
  - apps/mip/README.md

## Authorization Logging Requirement

Immediately before each throw new Error(NOT_AUTHORIZED), add console.error with contextual identifiers (function name + relevant IDs).

## Review Behavior

When implementing review feedback:
- Apply requested code changes.
- Do not post replies to human peer review comments.

## Important Locations

- apps/bilan-carbone/src/db/emissionFactors.ts
- packages/db-common/prisma/schema
- apps/*/src/components
- apps/*/src/app/api
- .env
