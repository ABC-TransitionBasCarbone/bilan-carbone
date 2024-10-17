declare namespace Cypress {
  interface Chainable {
    login(string?: string, string?: string): Chainable<void>
  }
}
