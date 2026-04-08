import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: process.env.CYPRESS_URL || 'http://localhost:3001',
    supportFile: 'cypress/support/index.ts',
    experimentalStudio: true,
    defaultCommandTimeout: 20000, // default value, change if needed during local tests
    retries: 1,
    experimentalMemoryManagement: true,
    numTestsKeptInMemory: process.env.CYPRESS_UI === 'true' ? 10 : 0,
    pageLoadTimeout: 80000,
    requestTimeout: 15000,
    responseTimeout: 15000,
  },
})
