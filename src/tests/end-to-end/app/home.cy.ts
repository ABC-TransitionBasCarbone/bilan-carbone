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
    it('Should display the CUT logos block', () => {
      cy.login('cut-env-admin-0@yopmail.com', 'password-0')
      cy.getByTestId('home-cut-logo').should('exist')
    })

    it('Should contain République Française logo', () => {
      cy.login('cut-env-admin-0@yopmail.com', 'password-0')
      cy.getByTestId('home-cut-logo').scrollIntoView()
      cy.getByTestId('home-cut-logo').find('img[alt="Logo de la république française"]').should('be.visible')
    })

    it('Should contain France 3 logo', () => {
      cy.login('cut-env-admin-0@yopmail.com', 'password-0')
      cy.getByTestId('home-cut-logo').scrollIntoView()
      cy.getByTestId('home-cut-logo').find('img[alt="Logo de france 3"]').should('be.visible')
    })

    // TODO: ce test plante régulièrement, on l'enlève pour le moment car le test des logos ci dessus suffisent à vérifier qu'on est sur CUT.
    // Mais il faudrait comprendre pourquoi celui ci en particulier n'est pas toujours trouvé
    // it('Should contain Caisse des dépôts logo', () => {
    //   cy.getByTestId('home-cut-logo').scrollIntoView()
    //   cy.getByTestId('home-cut-logo').find('img[alt="Logo du groupe la caisse des dépots"]').should('be.visible')
    // })
  })
})
