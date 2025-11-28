import dayjs from 'dayjs'

describe('Create study', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/etudes/creer').as('create')
  })

  it('should create a study on your organization as a simple user', () => {
    cy.login()

    cy.getByTestId('new-study').click()

    cy.getByTestId('new-study-organization-title').should('be.visible')
    cy.getByTestId('new-study-organization-select').should('not.exist')
    cy.getByTestId('new-study-organization-button').should('be.disabled')
    cy.getByTestId('organization-sites-checkbox').first().click()

    cy.getByTestId('new-study-organization-button').should('not.be.disabled')
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('My new study')

    cy.getByTestId('new-validator-name').click()
    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="1"]').click()

    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')
  })

  it('should create a study on a child organization as a CR user', () => {
    cy.login('bc-cr-collaborator-1@yopmail.com', 'password-1')
    cy.visit('/etudes/creer')

    cy.getByTestId('new-study-organization-title').should('be.visible')
    cy.getByTestId('new-study-organization-select').click()

    cy.get('[role="option"]').should('have.length.at.least', 2)
    cy.get('[role="option"]').last().click()

    cy.getByTestId('organization-sites-checkbox').first().click()

    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('My CR child org study')

    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="1"]').should('not.exist')
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="1"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('MM/DD/YYYY'))
    })
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create').its('response.statusCode').should('eq', 200)

    cy.url().should('include', '/etudes/')
    cy.url().should('not.include', '/creer')

    cy.contains('My CR child org study').should('be.visible')
  })
})
