describe('Accounts - multiple environment with the same user', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.login('all-env-admin-0@yopmail.com', 'password-0')
  })

  it('Should display the select account page', () => {
    cy.getByTestId('select-account').should('exist')
  })

  // it('Should be able to connect as CUT user', () => {
  //   cy.getByTestId('account-cut').click()
  //   cy.getByTestId('logo-CUT').should('exist')
  // })

  // it('Should be able to connect as BC user', () => {
  //   cy.getByTestId('account-bc').click()
  //   cy.getByTestId('logo-BC').should('exist')
  // })
})
