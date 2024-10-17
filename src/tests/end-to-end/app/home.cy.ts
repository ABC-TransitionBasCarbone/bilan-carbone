describe('Home page', () => {
  it('Should display the list of actualities as a simple user', () => {
    cy.login()

    cy.get('[data-testid="home-actualities"]').should('be.visible')
    cy.get('[data-testid="actualities-title"]').should('be.visible')
    cy.get('[data-testid="actualities-title"]').contains('Mes actualités')

    cy.get('[data-testid="actuality"]').should('have.length.gt', 0)
  })

  it('Should display the list of studies as a simple user', () => {
    cy.login()

    cy.get('[data-testid="home-studies"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="studies-title"]').should('be.visible')
    cy.get('[data-testid="studies-title"]').contains('Mes études')
  })

  it('Should display the list of actualities as a CR user', () => {
    cy.login('bc-cr-user-1@yopmail.com', 'password-1')

    cy.get('[data-testid="home-actualities"]').should('be.visible')
    cy.get('[data-testid="actualities-title"]').should('be.visible')
    cy.get('[data-testid="actualities-title"]').contains('Mes actualités')

    cy.get('[data-testid="actuality"]').should('have.length.gt', 0)
  })

  it('Should display the list of studies as a CR user', () => {
    cy.login('bc-cr-user-1@yopmail.com', 'password-1')

    cy.get('[data-testid="home-studies"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="studies-title"]').should('be.visible')
    cy.get('[data-testid="studies-title"]').contains('Mes études')
  })
})
