describe('Register cut', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  it('does create new cut user and organization with CNC', () => {
    cy.signupCut('cut-cnc@yopmail.com', '321')

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "Vous allez recevoir un mail pour finaliser l'activation de votre compte.")

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .within(() => {
          cy.get('.title')
            .invoke('text')
            .should('match', /Vous avez activé votre compte sur CUT/)
        })
    })
  })

  it('does create new cut user and organization with SIRET', () => {
    cy.signupCut('cut-siret@yopmail.com', '123456789012')

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "Vous allez recevoir un mail pour finaliser l'activation de votre compte.")

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .within(() => {
          cy.get('.title')
            .invoke('text')
            .should('match', /Vous avez activé votre compte sur CUT/)
        })
    })
  })

  it('does not create new user and organization when user already in environment ', () => {
    cy.signupCut('cut-siret@yopmail.com', '0')

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', 'Cet email est déjà inscrit avec un compte CUT')
  })

  it('does not create new cut user with wrong CNC', () => {
    cy.signupCut('cut-wrong-cnc@yopmail.com', '0')

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message').invoke('text').should('include', "Ce code CNC n'est pas reconnu")
  })

  it('does create new cut user and ask for validation to already existing organization ', () => {
    cy.signupCut('cut-pending@yopmail.com', '1234567891234')

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "Une demande d'activation de votre compte a été envoyé à vos collègues")

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .within(() => {
          cy.get('.title')
            .invoke('text')
            .should('match', /Demande d'accès à votre organisation CUT/)
        })
    })
  })
})
