declare namespace Cypress {
  interface Chainable {
    login(string, string): Chainable<void>
  }
}
