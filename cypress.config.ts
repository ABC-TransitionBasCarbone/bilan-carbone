import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/index.ts',
    experimentalStudio: true,
    defaultCommandTimeout: 4000, // default value, change if needed during local tests
  },
})
