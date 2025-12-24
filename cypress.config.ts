import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: process.env.CYPRESS_URL || 'http://localhost:3001',
    supportFile: 'cypress/support/index.ts',
    experimentalStudio: true,
    defaultCommandTimeout: 8000, // default value, change if needed during local tests
  },
})
