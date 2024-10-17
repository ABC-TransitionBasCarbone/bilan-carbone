describe('Legal Notices', () => {
  beforeEach(() => {
    cy.login('bc-test-user-1@yopmail.com', 'password-1')
  })

  it('Should be accessible from the profile view', () => {
    cy.visit('/profil')
    cy.get('[data-testid="legal-notices-link"]').should('be.visible')
    cy.get('[data-testid="legal-notices-link"]').click()
    cy.url().should('include', '/mentions-legales')
  })

  it('Should display the body and content of the legal notices', () => {
    cy.visit('/mentions-legales')

    // Body
    cy.get('[data-testid="legal-notices"]').should('be.visible')

    // Contact mail button
    cy.get('[data-testid="contact-mail"]').should('be.visible')
    cy.get('[data-testid="contact-mail"]').should('have.text', 'contact@associationbilancarbone.fr')
    cy.get('[data-testid="contact-mail"]').should('have.attr', 'href').and('include', 'mailto:')

    // Privacy policy
    cy.get('[data-testid="privacy-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="privacy-link"]').should('have.text', 'politique de protection des données')
    cy.get('[data-testid="privacy-link"]')
      .should('have.attr', 'href')
      .and('include', 'associationbilancarbone.sharepoint.com')

    // Back to profile
    cy.get('[data-testid="profile-link"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="profile-link"]').should('have.attr', 'href', '/profil')
    cy.get('[data-testid="profile-link"]').should('have.text', 'Retour au profil')
  })
})
