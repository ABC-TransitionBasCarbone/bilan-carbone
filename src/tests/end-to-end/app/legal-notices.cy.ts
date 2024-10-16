describe('Legal Notices', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')

    cy.visit('/')
    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-1@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('password-1')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@login')
  })

  describe('Access', () => {
    it('Should be accessible from the profile view', () => {
      cy.visit('/profil')
      cy.get('[data-testid="legal-notices-link"]').should('be.visible')
      cy.get('[data-testid="legal-notices-link"]').click()
      cy.url().should('include', '/mentions-legales')
    })
  })

  describe('Layout', () => {
    it('Displays the body of the legal notices', () => {
      cy.visit('/mentions-legales')
      cy.get('[data-testid="legal-notices"]').should('be.visible')
    })
    it('Displays the contact mail', () => {
      cy.visit('/mentions-legales')
      cy.get('[data-testid="contact-mail"]').should('be.visible')
      cy.get('[data-testid="contact-mail"]').should('have.text', 'contact@associationbilancarbone.fr')
      cy.get('[data-testid="contact-mail"]').should('have.attr', 'href').and('include', 'mailto:')
    })
    it('Displays the link to the privacy policy', () => {
      cy.visit('/mentions-legales')
      cy.get('[data-testid="privacy-link"]').scrollIntoView().should('be.visible')
      cy.get('[data-testid="privacy-link"]').scrollIntoView().should('have.text', 'politique de protection des données')
      cy.get('[data-testid="privacy-link"]')
        .scrollIntoView()
        .should('have.attr', 'href')
        .and('include', 'associationbilancarbone.sharepoint.com')
    })
    it('Displays the link to the profile', () => {
      cy.visit('/mentions-legales')
      cy.get('[data-testid="profile-link"]').should('be.visible')
      cy.get('[data-testid="profile-link"]').should('have.attr', 'href', '/profil')
      cy.get('[data-testid="profile-link"]').should('have.text', 'Retour au profil')
    })
  })
})
