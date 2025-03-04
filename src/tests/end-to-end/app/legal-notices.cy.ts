describe('Legal Notices', () => {
  beforeEach(() => {
    cy.login('bc-collaborator-1@yopmail.com', 'password-1')
  })

  it('Should be accessible from the profile view', () => {
    cy.visit('/profil')
    cy.getByTestId('legal-notices-link').should('be.visible')
    cy.getByTestId('legal-notices-link').click()
    cy.url().should('include', '/mentions-legales')
  })

  it('Should display the body and content of the legal notices', () => {
    cy.visit('/mentions-legales')

    // Body
    cy.getByTestId('legal-notices').should('be.visible')

    // Contact mail button
    cy.getByTestId('contact-mail').should('be.visible')
    cy.getByTestId('contact-mail').should('have.text', 'contact@associationbilancarbone.fr')
    cy.getByTestId('contact-mail').should('have.attr', 'href').and('include', 'mailto:')

    // Back to profile
    cy.getByTestId('profile-link').scrollIntoView()
    cy.getByTestId('profile-link').should('be.visible')
    cy.getByTestId('profile-link').should('have.attr', 'href', '/profil')
    cy.getByTestId('profile-link').should('have.text', 'Retour au profil')
  })
})
