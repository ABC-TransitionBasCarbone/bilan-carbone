import dayjs from 'dayjs'

type SimplifiedStudyOptions = {
  includeEndDate?: boolean
  startPath?: string
}

const newSimplifiedStudyTest = (studyName: string, options: SimplifiedStudyOptions = {}) => {
  const { includeEndDate = true, startPath = '/organisations' } = options

  cy.intercept('POST', '**/etudes/creer**').as('create')
  cy.visit(startPath)
  cy.getByTestId('new-study').should('be.visible').click()
  cy.url().should('include', 'creer')

  cy.get('[data-testid="new-study-organization-title"], [data-testid="new-study-name"]', { timeout: 15000 })
    .first()
    .should('be.visible')
  cy.get('body').then(($body) => {
    if ($body.find('[data-testid="new-study-organization-title"]').length > 0) {
      cy.getByTestId('organization-sites-checkbox').first().click()
      cy.getByTestId('new-study-organization-button').click()
    }
  })
  cy.getByTestId('new-study-name', { timeout: 10000 }).should('be.visible')
  cy.getByTestId('new-study-name').type(studyName)
  if (includeEndDate) {
    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
  }
  cy.getByTestId('new-study-create-button').click()

  cy.wait('@create', { timeout: 15000 }).its('response.statusCode').should('eq', 200)
  cy.url({ timeout: 15000 }).should('include', '/etudes/')
  cy.contains(studyName, { timeout: 15000 }).should('be.visible')
}

const newAdvancedStudyTest = (studyName: string) => {
  cy.intercept('POST', '**/etudes/creer').as('create')
  cy.visit('/')
  cy.getByTestId('new-study').should('be.visible').click()

  cy.getByTestId('new-study-organization-title').should('be.visible')
  cy.getByTestId('organization-sites-checkbox').first().click()
  cy.getByTestId('new-study-organization-button').click()

  cy.getByTestId('new-study-name').type(studyName)
  cy.getByTestId('new-study-level').click()
  cy.get('[data-value="Initial"]').click()
  cy.getByTestId('new-validator-name').click()
  cy.get('[data-option-index="1"]').click()
  cy.getByTestId('new-study-endDate').within(() => {
    cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
  })
  cy.getByTestId('new-study-create-button').click()

  cy.wait('@create').its('response.statusCode').should('eq', 200)
  cy.url().should('include', '/etudes/')
  cy.contains(studyName).should('be.visible')
}

describe('Create study', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '**/etudes/creer').as('create')
  })

  describe('BC', () => {
    it('should create a study on your organization as a simple user', () => {
      cy.login()
      cy.visit('/')
      cy.getByTestId('new-study').should('be.visible').click()
      cy.getByTestId('new-study-organization-title').should('be.visible')
      cy.getByTestId('new-study-organization-select').should('not.exist')
      cy.getByTestId('new-study-organization-button').should('be.disabled')
      cy.getByTestId('organization-sites-checkbox').first().click()
      cy.getByTestId('new-study-organization-button').should('not.be.disabled')
      cy.getByTestId('new-study-organization-button').click()
      cy.getByTestId('new-study-name').type('My new study')
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

    it('should create a study as BC Admin', () => {
      cy.login('bc-admin-0@yopmail.com', 'password-0')
      newAdvancedStudyTest('BC Admin study')
    })

    it('should create a study as BC GESTIONNAIRE', () => {
      cy.login('bc-gestionnaire-0@yopmail.com', 'password-0')
      newAdvancedStudyTest('BC Gestionnaire study')
    })

    it('should create a study on a child organization as a CR user', () => {
      cy.login('bc-cr-collaborator-1@yopmail.com', 'password-1')
      cy.visit('/')
      cy.getByTestId('organization').first().find('a').click()
      cy.url().should('include', '/organisations/')
      cy.getByTestId('new-study').should('be.visible').click()
      cy.getByTestId('new-study-organization-title').should('be.visible')
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

  describe('CUT', () => {
    it('should create a study as CUT Admin', () => {
      cy.loginForEnv('cut', 'cut-env-admin-0@yopmail.com', 'password-0')
      newSimplifiedStudyTest('CUT Admin study')
    })

    it('should create a study as CUT Default', () => {
      cy.loginForEnv('cut', 'cut-env-default-0@yopmail.com', 'password-0')
      newSimplifiedStudyTest('CUT Default study')
    })
  })

  describe('TILT', () => {
    it('should create an advanced study as TILT Admin', () => {
      cy.loginForEnv('tilt', 'tilt-env-admin-0@yopmail.com', 'password-0')
      newAdvancedStudyTest('TILT Admin study')
    })

    it('should create an advanced study as TILT Collaborator', () => {
      cy.loginForEnv('tilt', 'tilt-env-collaborator-0@yopmail.com', 'password-0')
      newAdvancedStudyTest('TILT Collaborator study')
    })

    it('should not show new study button for TILT untrained GESTIONNAIRE when feature is disabled', () => {
      cy.loginForEnv('tilt', 'tilt-env-untrained-gestionnaire-0@yopmail.com', 'password-0')
      cy.visit('/mes-empreintes')
      cy.getByTestId('tilt-simplified-coming-soon', { timeout: 10000 }).should('be.visible')
      cy.getByTestId('new-study').should('not.exist')
    })

    it('should create a simplified study as TILT untrained GESTIONNAIRE when feature is enabled by super admin', () => {
      cy.login('bc-super_admin-0@yopmail.com', 'password-0')
      cy.visit('/super-admin')
      cy.getByTestId('deactivable-feature-TiltSimplified', { timeout: 10000 }).scrollIntoView().should('be.visible')
      cy.getByTestId('deactivable-feature-TiltSimplified-toggle').then(($switch) => {
        if ($switch.find('input').prop('checked') === false) {
          cy.wrap($switch).click()
          cy.wait(2000)
        }
      })
      cy.logout()

      cy.loginForEnv('tilt', 'tilt-env-untrained-gestionnaire-0@yopmail.com', 'password-0')
      newSimplifiedStudyTest('TILT Simplified study', { includeEndDate: true, startPath: '/mes-empreintes' })
    })
  })

  describe('CLICKSON', () => {
    it('should create a study as Clickson Admin', () => {
      cy.loginForEnv('clickson', 'clickson-env-admin-0@yopmail.com', 'password-0')
      newSimplifiedStudyTest('Clickson Admin study', { includeEndDate: false })
    })

    it('should create a study as Clickson Collaborator', () => {
      cy.loginForEnv('clickson', 'clickson-env-collaborator-0@yopmail.com', 'password-0')
      newSimplifiedStudyTest('Clickson Collaborator study', { includeEndDate: false })
    })
  })
})
