const environments = ['bc', 'tilt', 'cut', 'clickson'] as const

const assertFeedbackLink = (testId: string) => {
  cy.getByTestId(testId)
    .should('be.visible')
    .and('have.attr', 'href')
    .and('match', /^https:\/\//)
    .and('have.attr', 'target', '_blank')
    .and('have.attr', 'rel', 'noreferrer noopener')
}

describe('Feedback questionnaire', () => {
  environments.forEach((environment) => {
    it(`is accessible from resources in ${environment}`, () => {
      cy.loginForEnv(environment)
      cy.visit('/ressources')

      assertFeedbackLink('feedback-form-link')
    })

    it(`is accessible from the profile in ${environment}`, () => {
      cy.loginForEnv(environment)
      cy.visit('/profil')

      assertFeedbackLink('feedback-form-link-profile')
    })
  })
})
