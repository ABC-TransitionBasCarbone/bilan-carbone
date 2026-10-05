import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'
import { execSync } from 'node:child_process'

dotenv.config({ path: '.env.test' })

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: process.env.CYPRESS_URL || 'http://localhost:3001',
    supportFile: 'cypress/support/index.ts',
    experimentalStudio: true,
    defaultCommandTimeout: 15000, // default value, change if needed during local tests
    retries: 2,
    numTestsKeptInMemory: process.env.CYPRESS_UI === 'true' ? 10 : 0,
    pageLoadTimeout: 80000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    setupNodeEvents(on) {
      on('task', {
        resetTestDatabase() {
          execSync('yarn db:test:reset', { stdio: 'inherit' })
          return null
        },
      })
    },
  },
})
