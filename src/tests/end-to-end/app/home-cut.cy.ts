describe('Home page - CUT environment', () => {
  beforeEach(() => {
    cy.login('cut-env-admin-0@yopmail.com', 'password-0')
  })

  it('Should display the CUT logos block', () => {
    cy.getByTestId('home-cut-logo').should('exist')
  })

  it('Should contain République Française logo', () => {
    cy.getByTestId('home-cut-logo').scrollIntoView()
    cy.getByTestId('home-cut-logo').find('img[alt="Logo de la république française"]').should('be.visible')
  })

  it('Should contain France 3 logo', () => {
    cy.getByTestId('home-cut-logo').scrollIntoView()
    cy.getByTestId('home-cut-logo').find('img[alt="Logo de france 3"]').should('be.visible')
  })
})
