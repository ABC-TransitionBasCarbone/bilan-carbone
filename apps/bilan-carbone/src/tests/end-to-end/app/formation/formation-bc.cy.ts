import { Environment } from '@abc-transitionbascarbone/db-common/enums'
import dayjs from 'dayjs'

describe('BC Formation', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
    cy.intercept('POST', '/api/auth/signout').as('logout')
  })

  it('displays the formation studies on the home page', () => {
    cy.loginForEnv(Environment.FORMATION_BC)

    cy.getByTestId('home-studies').should('be.visible')
    cy.getByTestId('study-name-chip').contains('Formation study source').should('be.visible')
  })

  it('allows a formation administrator to create a study', () => {
    cy.intercept('POST', '**/etudes/creer**').as('createStudy')
    cy.loginForEnv(Environment.FORMATION_BC)

    cy.visit('/etudes/creer')
    cy.getByTestId('new-study-organization-title').should('be.visible')
    cy.getByTestId('organization-sites-checkbox').first().click({ force: true })
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('Formation BC study')
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'year').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@createStudy').its('response.statusCode').should('eq', 200)
    cy.url().should('include', '/etudes/')
    cy.contains('Formation BC study').should('be.visible')
  })

  it('allows a formation administrator to delete a study', () => {
    cy.loginForEnv(Environment.FORMATION_BC)

    cy.getByTestId('study-name-chip')
      .contains('Formation study to delete')
      .parents('[data-testid="study"]')
      .within(() => {
        cy.getByTestId('study-link').click()
      })

    cy.getByTestId('delete-study').click()
    cy.getByTestId('delete-study-name-field').type('Formation study to delete')
    cy.getByTestId('confirm-study-deletion').click()
    cy.url().should('eq', `${Cypress.config().baseUrl}/`)
    cy.getByTestId('study-name-chip').contains('Formation study to delete').should('not.exist')
  })

  it('allows a formation administrator to add and delete an emission source', () => {
    cy.loginForEnv(Environment.FORMATION_BC)

    cy.visit('/etudes/88c93e88-7c80-4be4-905b-f0bbd2ccc841/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres')
    cy.getByTestId('subpost-MetauxPlastiquesEtVerre').find('[data-testid="subpost"]').click({ force: true })
    cy.getByTestId('subpost-MetauxPlastiquesEtVerre')
      .find('[data-testid="new-emission-source"]')
      .type('Formation source')
    cy.getByTestId('subpost-MetauxPlastiquesEtVerre').find('[data-testid="new-emission-source-add"]').click()
    cy.getByTestId('emission-source-Formation source').should('be.visible').click()
    cy.getByTestId('emission-source-delete').click()
    cy.getByTestId('delete-emission-source-modal-accept').click()
    cy.getByTestId('emission-source-Formation source').should('not.exist')
  })

  it('gives formation administrators, but not default members, access to team role editing', () => {
    cy.loginForEnv(Environment.FORMATION_BC)
    cy.visit('/equipe')
    cy.getByTestId('team-table-row').first().find('input').should('exist')

    cy.logout()
    cy.loginForEnv(Environment.FORMATION_BC, 'formation_bc-env-default-0@yopmail.com', 'password-0')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row').first().find('input').should('not.exist')
  })

  it('allows a formation administrator to edit an organization', () => {
    cy.intercept('POST', '/organisations/*/modifier').as('updateOrganization')
    cy.loginForEnv(Environment.FORMATION_BC)

    cy.getByTestId('button-menu-my-organization').trigger('mouseover')
    cy.getByTestId('link-organization').click()
    cy.getByTestId('edit-organization-button').click({ force: true })
    cy.getByTestId('edit-organization-name').within(() => {
      cy.get('input').clear().type('Formation organization')
    })
    cy.getByTestId('edit-organization-button').click()
    cy.wait('@updateOrganization')
    cy.getByTestId('organization-name').should('contain.text', 'Formation organization')
  })
})
