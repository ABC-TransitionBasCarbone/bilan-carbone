describe('Home page', () => {
  it('Should display the list of actualities as a simple user', () => {
    cy.login()

    cy.getByTestId('home-actualities').should('be.visible')
    cy.getByTestId('actualities-title').should('be.visible')
    cy.getByTestId('actualities-title').contains('Actualités')

    cy.getByTestId('actuality').should('have.length.gt', 0)
  })

  it('Should display the list of studies as a simple user', () => {
    cy.login()

    cy.getByTestId('home-studies').scrollIntoView()
    cy.getByTestId('home-studies').should('be.visible')
    cy.getByTestId('studies-title').should('be.visible')
    cy.getByTestId('studies-title').contains('Mes études')
  })

  it('Should display the list of actualities as a CR user', () => {
    cy.login('bc-cr-default-1@yopmail.com', 'password-1')

    cy.getByTestId('home-actualities').should('be.visible')
    cy.getByTestId('actualities-title').should('be.visible')
    cy.getByTestId('actualities-title').contains('Actualités')

    cy.getByTestId('actuality').should('have.length.gt', 0)
  })

  it('Should display the list of studies as a CR user', () => {
    cy.login('bc-cr-default-1@yopmail.com', 'password-1')

    cy.getByTestId('home-studies').scrollIntoView()
    cy.getByTestId('home-studies').should('be.visible')
    cy.getByTestId('studies-title').should('be.visible')
    cy.getByTestId('studies-title').contains('Mes études')
  })
})
