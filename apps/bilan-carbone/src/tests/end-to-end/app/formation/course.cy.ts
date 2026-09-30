import { courseEnvironments } from '@abc-transitionbascarbone/utils/environments'
import dayjs from 'dayjs'

for (let i = 0; i < courseEnvironments.length; i++) {
  const env = courseEnvironments[i]
  describe(`BC Course - ${env}`, () => {
    before(() => {
      cy.resetTestDatabase()
    })

    beforeEach(() => {
      cy.intercept('POST', '/api/auth/callback/credentials').as('login')
      cy.intercept('POST', '/api/auth/signout').as('logout')
    })

    it('displays the course studies on the home page', () => {
      cy.loginForEnv(env)

      cy.getByTestId('home-studies').should('be.visible')
      cy.getByTestId('study-name-chip').contains('course study source').should('be.visible')
    })

    it('allows a course administrator to create a study', () => {
      cy.intercept('POST', '**/etudes/creer**').as('createStudy')
      cy.loginForEnv(env)

      cy.visit('/etudes/creer')
      cy.getByTestId('new-study-organization-title').should('be.visible')
      cy.getByTestId('organization-sites-checkbox').first().find('input').check({ force: true }).should('be.checked')
      cy.getByTestId('new-study-organization-button').should('be.enabled').click()

      cy.getByTestId('new-study-name').type('course BC study')
      cy.getByTestId('new-study-level').click()
      cy.get('[data-value="Initial"]').click()
      cy.getByTestId('new-study-endDate').within(() => {
        cy.get('span').first().type(dayjs().add(1, 'year').format('DD/MM/YYYY'))
      })
      cy.getByTestId('new-study-create-button').click()

      cy.wait('@createStudy').its('response.statusCode').should('eq', 200)
      cy.url().should('include', '/etudes/')
      cy.contains('course BC study').should('be.visible')
    })

    it('allows a course administrator to delete a study', () => {
      cy.loginForEnv(env)

      cy.getByTestId('study-name-chip')
        .contains(`course study to delete ${env.toLowerCase()}`)
        .parents('[data-testid="study"]')
        .within(() => {
          cy.getByTestId('study-link').click()
        })

      cy.getByTestId('delete-study').click()
      cy.getByTestId('delete-study-name-field').type(`course study to delete ${env.toLowerCase()}`)
      cy.url().then((savedUrl) => {
        cy.getByTestId('confirm-study-deletion').click()
        cy.getByTestId('alert-toaster').should('not.exist')

        cy.url().should('eq', `${Cypress.config().baseUrl}/`)

        cy.getByTestId('study-name-chip').contains(`course study to delete ${env.toLowerCase()}`).should('not.exist')
        cy.visit(savedUrl)
        cy.getByTestId('not-found-page').should('be.visible')
      })
    })

    it('allows a course administrator to add and delete an emission source', () => {
      cy.loginForEnv(env)

      cy.visit(
        `/etudes/88c93e88-7c80-4be4-905b-f0bbd2ccd95${i}/comptabilisation/saisie-des-donnees/IntrantsBiensEtMatieres`,
      )
      cy.getByTestId('subpost-MetauxPlastiquesEtVerre').find('[data-testid="subpost"]').click({ force: true })
      cy.getByTestId('subpost-MetauxPlastiquesEtVerre')
        .find('[data-testid="new-emission-source"]')
        .type('course source')
      cy.getByTestId('subpost-MetauxPlastiquesEtVerre').find('[data-testid="new-emission-source-add"]').click()
      cy.getByTestId('emission-source-course source').scrollIntoView()
      cy.getByTestId('emission-source-course source').should('be.visible').click()
      cy.getByTestId('emission-source-delete').click()
      cy.getByTestId('delete-emission-source-modal-accept').click()
      cy.getByTestId('emission-source-course source').should('not.exist')
    })

    it('gives course administrators access to team role editing', () => {
      cy.loginForEnv(env)
      cy.visit('/equipe')
      cy.getByTestId('team-table-row').first().find('input').should('exist')
    })

    it('does not give course default members access to team role editing', () => {
      cy.loginForEnv(env, 'COURSE_BC-env-default-0@yopmail.com', 'password-0')
      cy.visit('/equipe')
      cy.getByTestId('team-table-row').first().find('input').should('not.exist')
    })

    it('allows a course administrator to edit an organization', () => {
      cy.intercept('POST', '/organisations/*/modifier').as('updateOrganization')
      cy.loginForEnv(env)

      cy.getByTestId('button-menu-my-organization').trigger('mouseover')
      cy.getByTestId('link-organization').click()
      cy.getByTestId('edit-organization-button').click({ force: true })
      cy.getByTestId('edit-organization-name').within(() => {
        cy.get('input').clear().type('course organization')
      })
      cy.getByTestId('edit-organization-button').click()
      cy.wait('@updateOrganization')
      cy.getByTestId('organization-name').should('contain.text', 'course organization')
    })
  })
}
