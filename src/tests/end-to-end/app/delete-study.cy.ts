import dayjs from 'dayjs'

describe('Delete study', () => {
  before(() => {
    cy.exec('npx prisma db seed')
  })

  beforeEach(() => {
    cy.intercept('POST', '/etudes/creer').as('create')
    cy.intercept('POST', '/etudes/*').as('delete')
  })

  it('should be able to delete a study', () => {
    cy.login()

    cy.visit('/etudes/creer')
    cy.getByTestId('organization-sites-checkbox').first().scrollIntoView()
    cy.getByTestId('organization-sites-checkbox').first().click({ force: true })

    cy.getByTestId('new-study-organization-button').scrollIntoView()
    cy.getByTestId('new-study-organization-button').click({ force: true })

    cy.getByTestId('new-study-name').type('My study to delete')
    cy.getByTestId('new-validator-name').type('bc-collaborator-0@yopmail.com')
    cy.get('[data-option-index="0"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')

    cy.getByTestId('delete-study').click()
    cy.get('#delete-study-modale-title').should('be.visible')
    cy.get('#delete-study-modale-content').should('be.visible')

    cy.getByTestId('delete-study-name-field').type('my study to delet')
    cy.getByTestId('alert-toaster').should('not.exist')
    cy.getByTestId('confirm-study-deletion').click()
    cy.getByTestId('alert-toaster').should('be.visible')
    cy.getByTestId('alert-toaster').should('contain.text', "Le nom de l'étude ne correspond pas")

    cy.getByTestId('delete-study-name-field').type('e')

    cy.url().then((savedUrl) => {
      cy.getByTestId('confirm-study-deletion').click()
      cy.getByTestId('alert-toaster').should('not.exist')

      cy.wait('@delete')
      cy.url().should('eq', `${Cypress.config().baseUrl}/`)

      cy.visit(savedUrl)
      cy.getByTestId('not-found-page').should('be.visible')
    })
  })
})
