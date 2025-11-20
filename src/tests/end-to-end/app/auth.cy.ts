describe('Authentication', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
    cy.intercept('POST', '/reset-password/*').as('reset-password')
    cy.intercept('POST', '/activation?email=').as('activate')
  })

  it('does not authenticate with wrong password', () => {
    cy.visit('/')
    cy.url().should('include', '/login')

    cy.login('bc-collaborator-1@yopmail.com', 'test1')

    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('does authenticate with correct password', () => {
    cy.visit('/')
    cy.url().should('include', '/login')

    cy.login('bc-collaborator-1@yopmail.com', 'password-1')

    cy.url().should('not.include', '/login')
  })

  it('does reset password', () => {
    cy.visit('/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('bc-collaborator-1@yopmail.com')
    cy.getByTestId('reset-password-link').click()

    cy.url().should('include', '/reset-password')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      'bc-collaborator-1@yopmail.com',
    )

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .clear()

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type(
      'bc-collaborator-2@yopmail.com',
    )

    cy.getByTestId('reset-button').click()

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .invoke('attr', 'href')
        .then((link) => {
          const hmtlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
          cy.visit(hmtlUrl)
          cy.url().should('include', hmtlUrl)

          cy.get('a')
            .invoke('attr', 'href')
            .then((link) => cy.visit(link as string))
        })
    })

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').should('have.value', '')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').should('have.value', '')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input').should('have.value', '')
    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('bc-collaborator-2@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('new-Password-2')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('new-Password-2')

    cy.getByTestId('reset-button').click()

    cy.wait('@reset-password')

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('bc-collaborator-2@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('password-2')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .should('have.value', 'bc-collaborator-2@yopmail.com')

    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .clear()

    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type('new-Password-2')

    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.url().should('not.include', '/login')
  })

  it('does not authorize inactive user', () => {
    cy.visit('/')

    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('bc-new-1@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('password-1')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.visit('/')

    cy.url().should('include', '/login')
  })

  it('does activate account', () => {
    cy.visit('/')

    cy.intercept('GET', '/equipe').as('equipe')

    cy.url().should('include', '/login')
    cy.login('imported@yopmail.com', 'Password-0')

    cy.visit('/')

    cy.url().should('include', '/login')

    cy.getByTestId('activation-button').should('be.visible').should('not.be.disabled')

    cy.getByTestId('activation-button').click({ force: true })

    cy.url().should('include', '/activation')

    cy.getByTestId('activation-email').should('be.visible').should('not.be.disabled')
    cy.getByTestId('activation-button').should('be.visible').should('not.be.disabled')

    cy.getByTestId('activation-email').should('be.visible').should('not.be.disabled').type('imported@yopmail.co')
    cy.getByTestId('activation-form-message').should('not.exist')
    cy.getByTestId('activation-button').click()

    cy.wait('@activate')

    cy.getByTestId('activation-form-message').should('be.visible').should('not.be.disabled')

    cy.getByTestId('activation-email').should('be.visible').should('not.be.disabled').type('m')
    cy.getByTestId('activation-button').click()
    cy.getByTestId('activation-form-message').should('not.exist')

    cy.wait('@activate')

    cy.getByTestId('activation-form-message').should('exist')
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
            .should('match', /Demande d'accès à votre organisation BC+/)
        })
    })

    cy.visit('/')
    cy.login('bc-admin-0@yopmail.com', 'password-0')
    cy.wait('@login')
    cy.visit('/equipe')
    cy.getByTestId('invitations-to-validate').should('be.visible')
    cy.getByTestId('invitations-to-validate').within(() => {
      cy.getByTestId('invitation')
        .filter((_index, el) => Cypress.$(el).text().includes('imported@yopmail.com'))
        .getByTestId('validate-invitation')
        .click({ force: true })
    })

    cy.getByTestId('pending-invitation').contains('imported@yopmail.com').should('be.visible')

    cy.logout()

    cy.url().should('include', '/login')

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .invoke('attr', 'href')
        .then((link) => {
          const hmtlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
          cy.visit(hmtlUrl)

          cy.url().should('include', hmtlUrl)

          cy.get('a')
            .invoke('attr', 'href')
            .then((link) => cy.visit(link as string))
        })
    })

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('imported@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('Password-0')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('Password-0')

    cy.getByTestId('reset-button').click({ force: true })

    cy.wait('@reset-password')

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('imported@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .should('not.be.disabled')
      .type('Password-0')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.url().should('not.include', '/login')
  })
})
