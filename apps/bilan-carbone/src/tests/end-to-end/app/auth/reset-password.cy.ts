const impactedEnvironments = [
  { name: 'BC+', entryPath: '/login', email: 'bc-collaborator-1@yopmail.com' },
  { name: 'TILT', entryPath: '/tilt/login', email: 'tilt-env-admin-0@yopmail.com' },
  { name: 'CLICKSON', entryPath: '/clickson/login', email: 'clickson-env-admin-0@yopmail.com' },
]

const newPassword = 'Password-1'

describe('Password reset', () => {
  beforeEach(() => {
    cy.resetTestDatabase()
  })

  impactedEnvironments.forEach(({ name, entryPath, email }) => {
    it(`resets a ${name} password from the emailed token without asking for an email again`, () => {
      cy.intercept('POST', '/api/auth/callback/credentials').as('login')

      cy.visit(entryPath)
      cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type(email)
      cy.getByTestId('reset-password-link').click()
      cy.url().should('include', '/reset-password')
      cy.getByTestId('reset-button').click()

      cy.visit('http://localhost:1080')
      cy.origin('http://localhost:1080', () => {
        cy.get('.email-item-link')
          .first()
          .invoke('attr', 'href')
          .then((link) => {
            const htmlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
            cy.visit(htmlUrl)
            cy.url().should('include', htmlUrl)

            cy.get('a')
              .invoke('attr', 'href')
              .then((link) => cy.visit(link as string))
          })
      })

      cy.getByTestId('input-email').should('not.exist')
      cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(newPassword)
      cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input').type(newPassword)
      cy.getByTestId('reset-button').click()
      cy.url({ timeout: 8000 }).should('include', '/login')

      cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type(email)
      cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(newPassword)
      cy.getByTestId('login-button').click()
      cy.wait('@login')
      cy.url().should('not.include', '/login')
    })
  })
})
