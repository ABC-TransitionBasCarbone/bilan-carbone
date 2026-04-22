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

## Best Practices

### React & Next.js
- **Server Components First**: Pages should be server components by default. Use `await params` instead of `React.use(params)` in page components.
- **Avoid useEffect for Data Loading**: Load data server-side rather than in useEffect. This is an anti-pattern in React 19.
- **Client Components**: Only use `'use client'` when you need hooks, event handlers, or browser APIs.
- **Component Naming**: Page files export a component matching the route purpose (e.g., `SurveyPage` for a survey page route).

### Styling
- **No Inline Styles or sx Prop**: Never use inline `style` attributes or MUI's `sx` prop. Use CSS modules (`.module.css`) instead.
- **Typography**: Use Gilroy font family (`gilroy-regular, sans-serif`) consistently across all apps.
- **Theme Consistency**: Follow the base theme patterns from `apps/bilan-carbone/src/environments/base/theme/theme.ts`.
- **MUI Component Props**: Use `slotProps` instead of the deprecated `inputProps`. For example, use `slotProps={{ htmlInput: { maxLength: 100 } }}` on a `TextField`.

### Code Organization
- **Separate Components**: Each component should be in its own file. Avoid multiple component definitions in a single file.
- **Feature Folders**: Group related components by feature (e.g., `src/components/survey/`).
- **Limit Comments**: Avoid unnecessary comments. Code should be self-documenting. Only add comments for:
  - Complex business logic that isn't obvious from the code
  - Non-obvious technical decisions or workarounds
  - Public API documentation (JSDoc for exported functions/types)
  - DO NOT add simple descriptive comments like "// Text Question Input Component" or "// Progress Bar"

### Internationalization
- **Use Translations**: All user-facing strings should use the i18n system (next-intl), not hardcoded text.
- **Translation Pattern**: Use `useTranslations('namespace')` in client components, `getTranslations('namespace')` in server components.
- **Translation Files**: Store translations in `src/i18n/translations/{locale}/{namespace}.json`.

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
