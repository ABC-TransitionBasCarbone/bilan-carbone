describe('Register clickson', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  it('does create new clickson user and organization with CNC', () => {
    cy.visit('/clickson/register')

    cy.getByTestId('activation-email').should('be.visible')
    cy.getByTestId('activation-school').should('be.visible')
    cy.getByTestId('activation-button').should('be.visible')

    cy.getByTestId('activation-email').type('clickson-school@yopmail.com')
    cy.getByTestId('activation-school').type('78600')
    cy.get('[data-testid="school-option-0781587B"]').click()
    cy.getByTestId('activation-form-message').should('not.exist')
    cy.getByTestId('activation-button').click()

    cy.wait('@signupClickson')

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
            .should('match', /Vous avez activé votre compte sur Clickson/)
        })
    })
  })

  it('does not create new clickson user with wrong postalCode and no selected school', () => {
    cy.visit('/clickson/register')

    cy.getByTestId('activation-email').type('clickson-wrong-postal-code@yopmail.com')
    cy.getByTestId('activation-school').type('00000')
    cy.getByTestId('activation-button').click()

    cy.getByTestId('activation-form-message').should('be.visible')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "L'établissement scolaire n'est pas reconnu. Veuillez vérifier votre saisie.")
  })

  it('does create new clickson user and ask for validation to already existing organization ', () => {
    cy.visit('/clickson/register')
    cy.getByTestId('activation-email').type('clickson-school-pending@yopmail.com')
    cy.getByTestId('activation-school').type('78600')
    cy.get('[data-testid="school-option-0781494A"]').click()
    cy.getByTestId('activation-button').click()
    cy.wait('@signupClickson')

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
            .should('match', /Demande d'accès à votre organisation Clickson/)
        })
    })
  })
})
