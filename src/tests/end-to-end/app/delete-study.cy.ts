import dayjs from 'dayjs'

describe('Delete study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/etudes/creer').as('create')
    cy.intercept('POST', '/etudes/*').as('delete')
  })

  it('should be able to delete a study', () => {
    cy.login()

    cy.getByTestId('new-study').click()
    cy.getByTestId('organization-sites-checkbox').first().click()
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('My study to delete')
    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="0"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')

    cy.getByTestId('delete-study').click()
    cy.get('#delete-study-dialog-title').should('be.visible')
    cy.get('#delete-study-dialog-content').should('be.visible')

    cy.getByTestId('delete-study-name-field').type('my study to delet')
    cy.getByTestId('study-deletion-error').should('not.exist')
    cy.getByTestId('confirm-study-deletion').click()
    cy.getByTestId('study-deletion-error').should('be.visible')
    cy.getByTestId('study-deletion-error').should('have.text', 'Le nom ne matche pas')

    cy.getByTestId('delete-study-name-field').type('e')

    cy.url().then((savedUrl) => {
      cy.getByTestId('confirm-study-deletion').click()
      cy.getByTestId('study-deletion-error').should('not.exist')

      cy.wait('@delete')
      cy.url().should('eq', `${Cypress.config().baseUrl}/`)

      cy.visit(savedUrl)
      cy.getByTestId('not-found-page').should('be.visible')
    })
  })
})
