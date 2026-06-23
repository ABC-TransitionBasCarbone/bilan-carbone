declare namespace Cypress {
  interface Chainable {
    getByTestId(
      testId: string,
      params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>,
    ): Chainable<JQuery<HTMLElement>>
    resetTestDatabase(): Chainable<void>
    login(email?: string, password?: string): Chainable<void>
  }
}
