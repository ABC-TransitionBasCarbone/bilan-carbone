import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: process.env.CYPRESS_URL || 'http://localhost:3002',
    supportFile: 'cypress/support/index.ts',
    defaultCommandTimeout: 15000,
    retries: 2,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: process.env.CYPRESS_UI === 'true' ? 10 : 0,
    pageLoadTimeout: 80000,
    requestTimeout: 15000,
    responseTimeout: 15000,
  },
})
