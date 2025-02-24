describe('Edit organization', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/organisations/*/modifier').as('update')
  })

  it('should edit an organization', () => {
    cy.login('bc-admin-0@yopmail.com')

    cy.visit('/organisations')
    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-organization-name').within(() => {
      cy.get('input').clear()
      cy.get('input').type('My new name')
    })

    cy.getByTestId('add-site-button').type('click')
    cy.getByTestId('edit-site-name').last().type('My new site 0')
    cy.getByTestId('organization-sites-etp').last().type('10')
    cy.getByTestId('organization-sites-ca').last().type('1000')

    cy.getByTestId('add-site-button').type('click')
    cy.getByTestId('edit-site-name').last().type('My new site 1')
    cy.getByTestId('organization-sites-etp').last().type('20')
    cy.getByTestId('organization-sites-ca').last().type('2000')

    cy.getByTestId('edit-organization-button').click()
    cy.wait('@update')

    cy.getByTestId('organization-name').should('includes.text', 'My new name')
    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site 1')
      })

    cy.getByTestId('organization-sites-etp')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '20')
      })

    cy.getByTestId('organization-sites-ca')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '2000')
      })

    cy.getByTestId('delete-site-button').last().click()
    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site 0')
        cy.get('input').clear()
        cy.get('input').type('My new site')
      })

    cy.getByTestId('organization-sites-etp')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '10')
        cy.get('input').clear()
        cy.get('input').type('100')
      })

    cy.getByTestId('organization-sites-ca')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '1000')
        cy.get('input').clear()
        cy.get('input').type('10000')
      })

    cy.getByTestId('edit-organization-button').click()
    cy.wait('@update')

    cy.getByTestId('edit-organization-button').click()

    cy.getByTestId('edit-site-name')
      .last()
      .within(() => {
        cy.get('input').should('have.value', 'My new site')
      })

    cy.getByTestId('organization-sites-etp')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '100')
      })

    cy.getByTestId('organization-sites-ca')
      .last()
      .within(() => {
        cy.get('input').should('have.value', '10000')
      })
  })
})
