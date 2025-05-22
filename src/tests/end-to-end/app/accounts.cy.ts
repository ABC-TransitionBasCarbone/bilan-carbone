describe('Accounts - multiple environment with the same user', () => {
  beforeEach(() => {
    cy.login('all-env-admin-0@yopmail.com', 'password-0')
  })

  it('Should display the select account page', () => {
    cy.getByTestId('select-account').should('exist')
  })

  it('Should be able to connect as CUT user', () => {
    cy.getByTestId('account-cut').click()
    cy.getByTestId('home-cut-logo').should('exist')
  })

  it('Should be able to connect as BC user', () => {
    cy.getByTestId('account-bc').click()
    cy.getByTestId('home-cut-logo').should('not.exist')
  })
})
