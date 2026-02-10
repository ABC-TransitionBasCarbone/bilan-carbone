describe('Accounts - multiple environment with the same user', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.loginwithMultipleAccounts('all-env-admin-0@yopmail.com', 'password-0')
  })

  it('Should be able to connect as CUT user', () => {
    cy.getByTestId('account-cut').click()
    cy.getByTestId('logo-CUT').should('exist')
  })

  it('Should be able to connect as BC user', () => {
    cy.getByTestId('account-bc').click()
    cy.getByTestId('logo-BC').should('exist')
  })

  it('Should be able to connect as TILT user', () => {
    cy.getByTestId('account-tilt').click()
    cy.getByTestId('logo-TILT').should('exist')
  })

  it('Should be able to connect as Clickson user', () => {
    cy.getByTestId('account-clickson').click()
    cy.getByTestId('logo-CLICKSON').should('exist')
  })
})
