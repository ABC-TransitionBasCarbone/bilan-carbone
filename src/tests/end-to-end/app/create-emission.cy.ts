describe('Create emission', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/facteurs-d-emission/creer').as('create')
  })

  it('should create an emission with total CO2 on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('cell-emission-name').should('not.exist')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new FE')
    cy.getByTestId('new-emission-unit').type('Bug per test')
    cy.getByTestId('new-emission-source').type('Magic')
    cy.getByTestId('new-emission-totalCo2').type('12')

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('cell-emission-name').should('be.visible')
    cy.getByTestId('cell-emission-name').should('have.text', 'My new FE')
    cy.getByTestId('cell-emission-totalCo2').should('have.text', '12')

    cy.logout()
    cy.login('bc-default-2@yopmail.com', 'password-2')
    cy.visit('/facteurs-d-emission')
    cy.getByTestId('cell-emission-name').should('not.exist')
  })

  it('should create an emission with detailed CO2 on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('cell-emission-name').should('not.exist')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new detailed FE')
    cy.getByTestId('new-emission-unit').type('Bug per test')
    cy.getByTestId('new-emission-source').type('Magic')

    cy.getByTestId('new-emission-co2f').should('not.exist')
    cy.getByTestId('new-emission-ch4f').should('not.exist')
    cy.getByTestId('new-emission-ch4b').should('not.exist')
    cy.getByTestId('new-emission-n2o').should('not.exist')
    cy.getByTestId('new-emission-co2b').should('not.exist')
    cy.getByTestId('new-emission-otherGES').should('not.exist')

    cy.getByTestId('new-emission-detailedGES-true').click()

    cy.getByTestId('new-emission-co2f').should('exist')
    cy.getByTestId('new-emission-co2f').type('1')
    cy.getByTestId('new-emission-ch4f').should('exist')
    cy.getByTestId('new-emission-ch4f').type('2')
    cy.getByTestId('new-emission-ch4b').should('exist')
    cy.getByTestId('new-emission-ch4b').type('3')
    cy.getByTestId('new-emission-n2o').should('exist')
    cy.getByTestId('new-emission-n2o').type('4')
    cy.getByTestId('new-emission-co2b').should('exist')
    cy.getByTestId('new-emission-co2b').type('5')
    cy.getByTestId('new-emission-otherGES').should('exist')
    cy.getByTestId('new-emission-otherGES').type('6')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '21')
    })

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('cell-emission-name').should('be.visible')
    cy.getByTestId('cell-emission-name').should('have.text', 'My new detailed FE')
    cy.getByTestId('cell-emission-totalCo2').should('have.text', '21')

    cy.logout()
    cy.login('bc-default-2@yopmail.com', 'password-2')
    cy.visit('/facteurs-d-emission')
    cy.getByTestId('cell-emission-name').should('not.exist')
  })
})
