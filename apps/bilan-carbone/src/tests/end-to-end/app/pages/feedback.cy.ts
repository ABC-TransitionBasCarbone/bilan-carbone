const environments = ['bc', 'tilt', 'cut', 'clickson'] as const

const assertFeedbackLink = (testId: string) => {
  cy.getByTestId(testId)
    .should('be.visible')
    .and('have.attr', 'target', '_blank')
    .and('have.attr', 'rel', 'noreferrer noopener')
    .invoke('attr', 'href')
    .should('match', /^https:\/\//)
}

describe('Feedback questionnaire', () => {
  environments.forEach((environment) => {
    it(`is accessible from the home page in ${environment}`, () => {
      cy.loginForEnv(environment)
      cy.visit('/')

      assertFeedbackLink('feedback-form-link-home')
    })
  })
})
