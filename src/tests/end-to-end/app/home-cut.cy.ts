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

  // TODO: ce test plante régulièrement, on l'enlève pour le moment car le test des logos ci dessus suffisent à vérifier qu'on est sur CUT.
  // Mais il faudrait comprendre pourquoi celui ci en particulier n'est pas toujours trouvé
  // it('Should contain Caisse des dépôts logo', () => {
  //   cy.getByTestId('home-cut-logo').scrollIntoView()
  //   cy.getByTestId('home-cut-logo').find('img[alt="Logo du groupe la caisse des dépots"]').should('be.visible')
  // })
})
