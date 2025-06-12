describe('Edit organization', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/organisations/*/modifier').as('update')
  })

  it('should edit an organization', () => {
    cy.login('cut-env-admin-0@yopmail.com')

    cy.visit('/organisations')
    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-organization-name').within(() => {
      cy.get('input').clear()
      cy.get('input').type('My new name')
    })

    cy.getByTestId('add-site-button').type('click')
    cy.getByTestId('edit-site-name').last().type('My new site 0')
    cy.getByTestId('organization-sites-postal-code').last().type('76000')
    cy.getByTestId('organization-sites-city').last().type('Rouen')

    cy.getByTestId('edit-organization-button').click()
    cy.wait('@update')

    cy.getByTestId('organization-name').should('includes.text', 'My new name')

    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('add-site-button').type('click')
    cy.getByTestId('edit-site-name').last().type('My new site 1')
    cy.getByTestId('organization-sites-postal-code').last().type('75000')
    cy.getByTestId('organization-sites-city').last().type('Paris')

    cy.getByTestId('edit-organization-button').click()
    cy.wait('@update')

    cy.getByTestId('organization-name').should('be.visible')
    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site 1')
      })

    cy.getByTestId('organization-sites-postal-code')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '75000')
      })

    cy.getByTestId('organization-sites-city')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'Paris')
      })

    cy.getByTestId('delete-site-button').last().click()
    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site 0')
        cy.get('input').clear()
        cy.get('input').type('My new site')
      })

    cy.getByTestId('organization-sites-postal-code')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '76000')
        cy.get('input').clear()
        cy.get('input').type('13000')
      })

    cy.getByTestId('organization-sites-city')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'Rouen')
        cy.get('input').clear()
        cy.get('input').type('Marseille')
      })

    cy.getByTestId('edit-organization-button').click()
    cy.wait('@update')

    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site')
      })

    cy.getByTestId('organization-sites-postal-code')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '13000')
      })

    cy.getByTestId('organization-sites-city')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'Marseille')
      })
  })
})
