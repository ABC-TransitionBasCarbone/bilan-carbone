describe('Home page - ', () => {
  describe('BC+ environment', () => {
    it('Should display the list of actualities as a simple user', () => {
      cy.login()

      cy.getByTestId('home-actualities').scrollIntoView()
      cy.getByTestId('actuality-title').should('be.visible')
      cy.getByTestId('actuality-title').contains('Mises à jour estivales du BC+')

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
      cy.getByTestId('actuality-title').should('be.visible')
      cy.getByTestId('actuality-title').contains('Mises à jour estivales du BC+')

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

    it('should display only actualities from the CUT environment', () => {
      cy.getByTestId('home-actualities').scrollIntoView().should('be.visible')
      cy.getByTestId('actuality-title').should('not.contain', 'Mises à jour estivales du BC+')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU TILT')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU Clickson')
      cy.getByTestId('actuality-title').should('contain', 'ACTU CUT')
    })

    it('should display the main title on the home page', () => {
      cy.getByTestId('title')
        .should('have.length', 1)
        .first()
        .should('contain.text', 'Faire votre bilan d’impact vous permettra de :')
    })
  })

  describe('TILT environment', () => {
    beforeEach(() => {
      cy.login('tilt-env-admin-0@yopmail.com', 'password-0')
    })

    it('should display only actualities from the TILT environment', () => {
      cy.getByTestId('home-actualities').scrollIntoView().should('be.visible')
      cy.getByTestId('actuality-title').should('not.contain', 'Mises à jour estivales du BC+')
      cy.getByTestId('actuality-title').should('contain', 'ACTU TILT')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU Clickson')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU CUT')
    })
  })

  describe('Clickson environment', () => {
    beforeEach(() => {
      cy.login('clickson-env-admin-0@yopmail.com', 'password-0')
    })

    it('should display only actualities from the Clickson environment', () => {
      cy.getByTestId('home-actualities').scrollIntoView().should('be.visible')
      cy.getByTestId('actuality-title').should('not.contain', 'Mises à jour estivales du BC+')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU TILT')
      cy.getByTestId('actuality-title').should('contain', 'ACTU Clickson')
      cy.getByTestId('actuality-title').should('not.contain', 'ACTU CUT')
    })
  })
})
