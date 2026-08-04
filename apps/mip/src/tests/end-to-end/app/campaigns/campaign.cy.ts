describe('Campaign creation', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
  })

  it('Admin can create campaign', () => {
    cy.login('mip-admin-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('add-campaign-button').click()
    cy.get('[data-testid^="input-name-"]').last().type('New campaign admin')
    cy.getByTestId('validate-campaign-update').click()
  })

  it('Collaborator can create campaigns', () => {
    cy.login('mip-collaborator-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('add-campaign-button').click()
    cy.get('[data-testid^="input-name-"]').last().type('New campaign collaborator')
    cy.getByTestId('validate-campaign-update').click()
  })

  it('Collaborator can not see admin campaign', () => {
    cy.login('mip-collaborator-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('input-name-campaign-collaborator-seed-id').should('exist')
    cy.getByTestId('input-name-campaign-admin-seed-id').should('not.exist')
  })

  it('Admin can see all orga campaigns', () => {
    cy.login('mip-admin-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('input-name-campaign-admin-seed-id').should('exist')
    cy.getByTestId('input-name-campaign-collaborator-seed-id').should('exist')
  })

  it('Admin can export campaign responses from campaigns page', () => {
    cy.login('mip-admin-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('export-campaign-csv-campaign-admin-seed-id').should('exist')
  })

  it('Admin can export campaign responses from results dashboard', () => {
    cy.login('mip-admin-0@yopmail.com', 'password-0')
    cy.visit('/campaigns/campaign-admin-seed-id')
    cy.getByTestId('export-data-csv-button').should('exist')
  })
})
