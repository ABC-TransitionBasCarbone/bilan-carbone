declare namespace Cypress {
  interface Chainable {
    getByTestId(testId: string): Chainable<JQuery<HTMLElement>>

    login(email?: string, password?: string): Chainable<void>
    logout(): Chainable<void>
  }
}
