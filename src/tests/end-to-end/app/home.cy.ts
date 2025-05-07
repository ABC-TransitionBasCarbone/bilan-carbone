describe('Home page - BC+ environment', () => {
  beforeEach(() => {
    Cypress.env('NEXT_PUBLIC_DEFAULT_ENVIRONMENT', 'bilancarbon')
  })

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

// TODO: Uncomment when environment is base on user

// describe('Home page - CUT environment', () => {
//   beforeEach(() => {
//     Cypress.env('NEXT_PUBLIC_DEFAULT_ENVIRONMENT', 'cut')
//   })

//   it('Should display the CUT logos block', () => {
//     cy.getByTestId('home-cut-logo').should('exist')
//   })

//   it('Should contain République Française logo', () => {
//     cy.getByTestId('home-cut-logo')
//       .find('img[alt="Logo de la république française"]')
//       .should('be.visible')
//   })

//   it('Should contain France 3 logo', () => {
//     cy.getByTestId('home-cut-logo')
//       .find('img[alt="Logo de france 3"]')
//       .should('be.visible')
//   })

//   it('Should contain Caisse des dépôts logo', () => {
//     cy.getByTestId('home-cut-logo')
//       .find('img[alt="Logo du groupe la caisse des dépots"]')
//       .should('be.visible')
//   })
// })
