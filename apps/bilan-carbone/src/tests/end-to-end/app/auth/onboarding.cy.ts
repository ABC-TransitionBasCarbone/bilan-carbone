describe('Onboarding', () => {
  const openActivationLinkFromMailDev = () => {
    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.wait(2000)
      cy.reload()
      cy.get('.email-item-link', { timeout: 60000 })
        .first()
        .invoke('attr', 'href')
        .then((link) => {
          const hmtlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
          cy.visit(hmtlUrl)
          cy.url().should('include', hmtlUrl)

          cy.get('a')
            .invoke('attr', 'href')
            .then((activationLink) => cy.visit(activationLink as string))
        })
    })
  }

  beforeEach(() => {
    cy.resetTestDatabase()
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it('trained user has ADMIN role after onboarding', () => {
    cy.visit('/')

    cy.getByTestId('input-email').find('input').type('onboarding@yopmail.com')
    cy.getByTestId('input-password').find('input').type('onboarding1234')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.visit('/activation')

    cy.getByTestId('activation-email').type('onboarding@yopmail.com')
    cy.getByTestId('activation-button').click()

    cy.getByTestId('activation-form-message').should('exist')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "Vous allez recevoir un mail pour finaliser l'activation de votre compte.")

    openActivationLinkFromMailDev()

    cy.getByTestId('input-email').find('input').type('onboarding@yopmail.com')
    cy.getByTestId('input-password').find('input').type('Password-0')
    cy.getByTestId('input-confirm-password').find('input').type('Password-0')
    cy.getByTestId('reset-button').click()

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.getByTestId('input-email').find('input').type('onboarding@yopmail.com')
    cy.getByTestId('input-password').find('input').type('Password-0')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.getByTestId('onboarding-modal').should('be.visible')
    cy.getByTestId('user-role').scrollIntoView()
    cy.getByTestId('user-role').should('be.visible')
    cy.getByTestId('user-role').should('have.text', 'Administrateur·rice')
  })

  it('untrained user has GESTIONNAIRE role after onboarding', () => {
    cy.visit('/')

    cy.getByTestId('input-email').find('input').type('onboardingnottrained@yopmail.com')
    cy.getByTestId('input-password').find('input').type('onboarding1234')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.visit('/activation')

    cy.getByTestId('activation-email').type('onboardingnottrained@yopmail.com')
    cy.getByTestId('activation-button').click()

    cy.getByTestId('activation-form-message').should('exist')
    cy.getByTestId('activation-form-message')
      .invoke('text')
      .should('include', "Vous allez recevoir un mail pour finaliser l'activation de votre compte.")

    openActivationLinkFromMailDev()

    cy.getByTestId('input-email').find('input').type('onboardingnottrained@yopmail.com')
    cy.getByTestId('input-password').find('input').type('Password-0')
    cy.getByTestId('input-confirm-password').find('input').type('Password-0')
    cy.getByTestId('reset-button').click()

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.getByTestId('input-email').find('input').type('onboardingnottrained@yopmail.com')
    cy.getByTestId('input-password').find('input').type('Password-0')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.getByTestId('onboarding-modal').should('be.visible')
    cy.getByTestId('user-role').scrollIntoView()
    cy.getByTestId('user-role').should('be.visible')
    cy.getByTestId('user-role').should('have.text', 'Gestionnaire')
  })
})
