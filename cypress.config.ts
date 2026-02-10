import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  e2e: {
    retries: 3,
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: process.env.CYPRESS_URL || 'http://localhost:3001',
    supportFile: 'cypress/support/index.ts',
    experimentalStudio: true,
    defaultCommandTimeout: 10000, // default value, change if needed during local tests
  },
})
