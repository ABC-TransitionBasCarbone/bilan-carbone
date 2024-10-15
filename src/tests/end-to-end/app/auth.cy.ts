describe('Authentication', () => {
  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it('does not authenticate with wrong password', () => {
    cy.visit('/')
    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-1@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('test1')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@login')

    cy.visit('/')
    cy.url().should('include', '/login')
  })

  it('does authenticate with correct password', () => {
    cy.visit('/')
    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-1@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('password-1')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@login')

    cy.url().should('not.include', '/login')
  })

  it('does reset password', () => {
    cy.visit('/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-1@yopmail.com')
    cy.get('[data-testid="reset-password-link"]').click()

    cy.url().should('include', '/reset-password')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('have.value', 'bc-test-user-1@yopmail.com')
    cy.get('[data-testid="input-email"] > .MuiInputBase-input').clear()
    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-2@yopmail.com')
    cy.get('[data-testid="reset-button"]').click()

    cy.url().should('include', '/login')

    cy.visit('http://localhost:1080')
    cy.get('.email-item-link')
      .first()
      .invoke('attr', 'href')
      .then((link) => cy.visit(`http://localhost:1080${(link as string).replace('#/', '/')}/html`))
    cy.get('a')
      .invoke('attr', 'href')
      .then((link) => cy.visit(link as string))

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('have.value', '')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('have.value', '')
    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-2@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('test2')

    cy.get('[data-testid="reset-button"]').click()

    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-2@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('password-2')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@login')
    cy.url().should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-input').should('be.visible').type('bc-test-user-2@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-input').should('be.visible').type('test2')
    cy.get('[data-testid="login-button"]').click()

    cy.wait('@login')
    cy.url().should('not.include', '/login')
  })
})
