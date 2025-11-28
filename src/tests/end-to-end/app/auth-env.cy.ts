describe('Authentication', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it('Cut user can login', () => {
    cy.visit('/count')
    cy.url().should('include', '/count/login')

    cy.login('cut-env-admin-0@yopmail.com', 'password-0')

    cy.visit('/')
    cy.url().should('not.include', '/login')
  })

  it('Tilt user can login', () => {
    cy.visit('/tilt')
    cy.url().should('include', '/tilt/login')

    cy.login('tilt-env-admin-0@yopmail.com', 'password-0')

    cy.visit('/')
    cy.url().should('not.include', '/login')
  })

  it('Clickson user can login', () => {
    cy.visit('/clickson')
    cy.url().should('include', '/clickson/login')

    cy.login('clickson-env-admin-0@yopmail.com', 'password-0')

    cy.visit('/')
    cy.url().should('not.include', '/login')
  })
})
