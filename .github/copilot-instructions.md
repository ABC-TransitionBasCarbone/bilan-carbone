# Copilot Instructions for `bilan-carbone`

## Project Overview

This is a Next.js monorepo for the "Bilan Carbone" platform, focused on carbon accounting and emissions management. The codebase is organized by feature and domain, with clear separation between API, UI, database, and integration logic.

## Architecture & Key Components

- **Frontend**: Located in `src/app/` and `src/components/`. Uses Next.js app router, with feature folders for dashboard, public views, and admin.
- **Backend/DB**: Prisma ORM is used for PostgreSQL, with models in `prisma/schema/` and queries/services in `src/db/`.
- **API**: Endpoints are in `src/app/api/`. Server-side logic is often abstracted into `src/services/` and `src/db/`.
- **Types & Constants**: Shared types in `src/types/`, constants in `src/constants/`.
- **Testing**: Cypress for E2E (`cypress/`), Jest for unit/integration (`src/tests/`).
- **Scripts**: Data import/export and maintenance scripts in `src/scripts/`.

## Developer Workflows

- **Build/Dev**:
  - Start dev server: `npx next dev --turbopack --port 3001`
  - Prisma Studio: `npx prisma studio`
- **Testing**:
  - Run Cypress: `npx cypress run --spec "src/tests/end-to-end/app/register-cut.cy.ts"`
  - Run Jest: `npx jest`
- **Data Import**:
  - Example:  
    `npx tsx src/scripts/baseEmpreinte/getEmissionFactors.ts -f src/scripts/baseEmpreinte/Base_Carbone_V23.7.csv -n 23.7`
  - For multiple scripts in PowerShell, use `;` to chain commands.
- **Environment**:
  - Environment variables in `.env` (see comments for staging/production/test URLs).
  - Use correct `POSTGRES_PRISMA_URL` for your environment.

## Project-Specific Patterns

- **Prisma Usage**:
  - Raw SQL queries use `Prisma.sql` and are only passed to `$queryRaw` for SELECTs.
  - All mutations (INSERT/UPDATE/DELETE) use Prisma model methods, not raw SQL.
- **Feature Folders**:
  - UI and logic are grouped by feature (e.g., `src/components/emissionFactor/`, `src/app/(dashboard)/`).
- **Metadata Handling**:
  - Emission factors and their metadata are always joined and filtered by locale.
  - See `src/db/emissionFactors.ts` for query patterns.
- **Custom Units**:
  - Custom units are handled via the `customUnit` field and `setEmissionFactorUnitAsCustom` function.

## Integration Points

- **External APIs**:
  - INSEE, Association Service, PDF Service, etc. (see `.env` for URLs and secrets).
- **Mail**:
  - Configured via `.env` for different environments.
- **FTP**:
  - Used for file exports/imports, credentials in `.env`.

## Conventions

- **TypeScript everywhere**; strict typing for all models and API responses.
- **Constants and enums** are centralized in `src/constants/`.
- **Async data flows**: All DB/service calls are async/await.
- **Localization**: All user-facing data is filtered by `locale`.

## Key Files & Directories

- `src/db/emissionFactors.ts`: Main DB logic for emission factors.
- `prisma/schema/`: Database schema definitions.
- `src/components/`: UI components, grouped by feature.
- `src/app/api/`: API endpoints.
- `.env`: Environment configuration.

---

For more details, see the [README.md](../README.md) and comments in relevant files.

---

**Feedback Requested:**  
Please indicate if any workflows, conventions, or integration points are unclear or missing. Specify any domain-specific logic or patterns that should be documented for future AI agents.
