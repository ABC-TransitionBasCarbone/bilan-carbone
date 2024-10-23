import dayjs from 'dayjs'

describe('Create study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/etudes/creer').as('create')
  })

  it('Should display a link to create a new study as a simple user', () => {
    cy.login()

    cy.get('[data-testid="new-study"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="new-study"]').should('have.text', 'Nouvelle étude')
    cy.get('[data-testid="new-study"]').should('have.attr', 'href').and('include', '/etudes/creer')

    cy.get('[data-testid="new-study"]').click()

    cy.url().should('include', '/etudes/creer')
  })

  it('should create a study on your organization as a simple user', () => {
    cy.login()

    cy.get('[data-testid="new-study"]').click()

    cy.get('[data-testid="new-study-organization-title"]').should('be.visible')
    cy.get('[data-testid="new-study-organization-select"]').should('not.exist')

    cy.get('[data-testid="new-study-organization-button"]').click()

    cy.get('[data-testid="new-study-name"]').type('My new study')
    cy.get('[data-testid="new-study-endDate"]').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.get('[data-testid="new-study-level"]').click()
    cy.get('[data-value="Initial"]').click()
    cy.get('[data-testid="new-study-create-button"]').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/`)
  })

  it('Should display a link to create a new study as a CR user', () => {
    cy.login('bc-cr-user-1@yopmail.com', 'password-1')

    cy.get('[data-testid="new-study"]').scrollIntoView().should('be.visible')
    cy.get('[data-testid="new-study"]').should('have.text', 'Nouvelle étude')
    cy.get('[data-testid="new-study"]').should('have.attr', 'href').and('include', '/etudes/creer')

    cy.get('[data-testid="new-study"]').click()

    cy.url().should('include', '/etudes/creer')
  })

  it('should create a study on an organization as a CR user', () => {
    cy.login('bc-cr-user-1@yopmail.com', 'password-1')
    cy.visit('/etudes/creer')
    cy.get('[data-testid="new-study-organization-title"]').should('be.visible')
    cy.get('[data-testid="new-study-organization-select"]').click()
    cy.get('[role="option"]').first().click()

    cy.get('[data-testid="new-study-organization-button"]').click()

    cy.get('[data-testid="new-study-name"]').type('My new study')
    cy.get('[data-testid="new-study-endDate"]').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('MM/DD/YYYY'))
    })
    cy.get('[data-testid="new-study-level"]').click()
    cy.get('[data-value="Initial"]').click()
    cy.get('[data-testid="new-study-create-button"]').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/`)
  })
})
