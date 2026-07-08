describe('Campaign Model invitation', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it.skip('Super admin can create model and invite user', () => {
    cy.login('mip-super_admin-0@yopmail.com', 'password-0')
    cy.visit('/super-admin')
    cy.getByTestId('add-model-button').click()
    cy.get('[data-testid="input-name-1"] > .MuiInputBase-root > .MuiInputBase-input').type('New model')
    cy.getByTestId('validate-model-update').click()
    cy.get('[data-testid="copy-invitation-url"]')
      .last()
      .invoke('attr', 'data-link')
      .then((link) => {
        if (!link) {
          throw new Error('Invitation link not found')
        }
        cy.logout()
        cy.visit(link)
      })
    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input', { timeout: 8000 }).type(
      'new-mip@yopmail.com',
    )
    cy.getByTestId('submit-button').click()
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
    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type('new-mip@yopmail.com')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type('Password-0')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input').type('Password-0')
    cy.getByTestId('reset-button').click()

    cy.url({ timeout: 8000 }).should('include', '/login')
    cy.login('new-mip@yopmail.com', 'Password-0')
    cy.url().should('not.include', '/login')
  })
})
