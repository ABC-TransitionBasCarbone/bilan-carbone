import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:3000',
    supportFile: false,
  },
})