import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    specPattern: "src/tests/end-to-end/**/*.cy.{js,jsx,ts,tsx}", // Dossier où se trouvent tes tests Cypress
    baseUrl: "http://localhost:3000", // URL de base pour tes tests
    supportFile: false, // Si tu n'as pas besoin de support spécifique
  },
});
