import { courseEnvironments } from '@abc-transitionbascarbone/common/utils/environments'
import dayjs from 'dayjs'

for (let i = 0; i < courseEnvironments.length; i++) {
  const env = courseEnvironments[i]
  const traineeEmail = `${env.toLowerCase()}-env-admin-0@yopmail.com`
  const professorEmail = `${env.toLowerCase()}-env-admin-1@yopmail.com`
  describe(`BC Course - ${env}`, () => {
    before(() => {
      cy.resetTestDatabase()
    })

    beforeEach(() => {
      cy.intercept('POST', '/api/auth/callback/credentials').as('login')
      cy.intercept('POST', '/api/auth/signout').as('logout')
    })

    it('displays trainee studies without professor sessions on the home page', () => {
      cy.loginForEnv(env, traineeEmail, 'password-0')

      cy.getByTestId('home-studies').should('be.visible')
      cy.getByTestId('study-name-chip').contains(`course study source ${env.toLowerCase()}`).should('be.visible')
      cy.getByTestId('course-session').should('not.exist')
    })

    it('displays only the professor sessions for the current environment on the home page', () => {
      cy.loginForEnv(env, professorEmail, 'password-1')

      cy.getByTestId('home-cards-list').should('be.visible')
      cy.getByTestId('course-session').should('have.length', 2)
      cy.getByTestId('course-session').contains(`Course test session ${env}`).should('be.visible')
      cy.getByTestId('course-session').contains(`Course second test session ${env}`).should('be.visible')
      cy.getByTestId('course-session').should('not.contain.text', 'Course other professor session')
      cy.contains('[data-testid="study-name-chip"]', `course study source ${env.toLowerCase()}`).should('not.exist')
    })

    it('opens a professor session and its trainee studies in read-only mode', () => {
      cy.loginForEnv(env, professorEmail, 'password-1')

      cy.getByTestId('course-session').contains(`Course test session ${env}`).click()
      cy.url().should('include', '/sessions/')
      cy.getByTestId('course-session-name').should('have.text', `Course test session ${env}`)
      cy.getByTestId('course-session-type').should('be.visible')
      cy.getByTestId('new-study').should('not.exist')
      cy.getByTestId('edit-organization-button').should('not.exist')

      cy.getByTestId('study-name-chip')
        .contains(`course study source ${env.toLowerCase()}`)
        .parents('[data-testid="study"]')
        .within(() => {
          cy.getByTestId('study-student').should('be.visible').and('not.be.empty')
          cy.getByTestId('study-link').click()
        })

      cy.url().should('include', `/etudes/88c93e88-7c80-4be4-905b-f0bbd2ccd95${i}`)
      cy.getByTestId('not-found-page').should('not.exist')
      cy.getByTestId('delete-study').should('not.exist')
    })

    it('shows an empty state for a professor session without trainees', () => {
      cy.loginForEnv(env, professorEmail, 'password-1')

      cy.getByTestId('course-session').contains(`Course second test session ${env}`).click()
      cy.getByTestId('course-session-name').should('have.text', `Course second test session ${env}`)
      cy.get('[role="status"]').should('be.visible')
      cy.getByTestId('study').should('not.exist')
      cy.getByTestId('new-study').should('not.exist')
    })

    it('allows a trainee administrator to create a study', () => {
      cy.intercept('POST', '**/etudes/creer**').as('createStudy')
      cy.loginForEnv(env, traineeEmail, 'password-0')

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

    it('allows a trainee administrator to delete a study', () => {
      cy.loginForEnv(env, traineeEmail, 'password-0')

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

    it('allows a trainee administrator to add and delete an emission source', () => {
      cy.loginForEnv(env, traineeEmail, 'password-0')

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

    it('keeps the team read-only for trainee administrators', () => {
      cy.loginForEnv(env, traineeEmail, 'password-0')
      cy.visit('/equipe')
      cy.getByTestId('team-table-row').should('exist')
      cy.getByTestId('team-table-row').find('input').should('not.exist')
      cy.getByTestId('delete-member-button').should('not.exist')
      cy.getByTestId('add-member-link').should('not.exist')

      cy.visit('/equipe/ajouter')
      cy.getByTestId('not-found-page').should('be.visible')
    })

    it('does not give trainee default members access to team role editing', () => {
      cy.loginForEnv(env, `${env.toLowerCase()}-env-default-0@yopmail.com`, 'password-0')
      cy.visit('/equipe')
      cy.getByTestId('team-table-row').should('exist')
      cy.getByTestId('team-table-row').find('input').should('not.exist')
      cy.getByTestId('delete-member-button').should('not.exist')
      cy.getByTestId('add-member-link').should('not.exist')
    })

    it('allows a trainee administrator to edit an organization', () => {
      cy.intercept('POST', '/organisations/*/modifier').as('updateOrganization')
      cy.loginForEnv(env, traineeEmail, 'password-0')

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
