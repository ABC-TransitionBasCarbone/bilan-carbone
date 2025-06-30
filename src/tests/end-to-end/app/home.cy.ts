describe('Home page - ', () => {
  describe('BC+ environment', () => {
    it('Should display the list of actualities as a simple user', () => {
      cy.login()

      cy.getByTestId('home-actualities').scrollIntoView()
      cy.getByTestId('home-actualities').should('be.visible')
      cy.getByTestId('home-actualities').contains('Les actualités du BC+')

      cy.getByTestId('actuality').should('have.length.gt', 0)
    })

    it('Should display the list of studies as a simple user', () => {
      cy.login()

      cy.getByTestId('home-studies').first().scrollIntoView()
      cy.getByTestId('home-studies').should('be.visible')
      cy.getByTestId('home-studies').contains('Mes Bilans Carbone®')
    })

    it('Should display the list of actualities as a CR user', () => {
      cy.login('bc-cr-collaborator-1@yopmail.com', 'password-1')

      cy.getByTestId('home-actualities').scrollIntoView()
      cy.getByTestId('home-actualities').should('be.visible')
      cy.getByTestId('home-actualities').contains('Les actualités du BC+')

      cy.getByTestId('actuality').should('have.length', 3)
    })

    it('Should display the list of organizations as a CR user', () => {
      cy.login('bc-cr-collaborator-1@yopmail.com', 'password-1')

      cy.getByTestId('home-organizations').scrollIntoView()
      cy.getByTestId('home-organizations').should('be.visible')
      cy.getByTestId('home-organizations').contains('Mes clients actuels')
    })
  })

  describe('CUT environment', () => {
    beforeEach(() => {
      cy.login('cut-env-admin-0@yopmail.com')
    })

    it('should display the main title on the home page', () => {
      cy.getByTestId('title')
        .should('have.length', 1)
        .first()
        .should('contain.text', 'Faire votre bilan d’impact vous permettra de :')
    })
  })
})
