describe('Create organization', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/organisations/creer').as('create')
  })

  it('should create a child organization as a cr user', () => {
    cy.login('bc-cr-default-1@yopmail.com', 'password-1')

    cy.getByTestId('new-organization').click()

    cy.getByTestId('new-organization-title').should('be.visible')
    cy.getByTestId('new-organization-name').type('My new organization')
    cy.getByTestId('new-organization-create-button').click()

    cy.wait('@create')

    cy.getByTestId('organization-name').should('include.text', 'My new organization')
  })
})
