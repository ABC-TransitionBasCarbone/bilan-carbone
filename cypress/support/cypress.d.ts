declare namespace Cypress {
  interface Chainable {
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>

    login(string?: string, string?: string): Chainable<void>
    logout(): Chainable<void>
  }
}
