describe('Authentication', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it('User can login', () => {
    cy.visit('/')
    cy.url().should('include', '/login')

    cy.login('mip-admin-0@yopmail.com', 'password-0')

    cy.visit('/')
    cy.url().should('not.include', '/login')
  })
})
