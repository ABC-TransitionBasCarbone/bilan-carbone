import dayjs from 'dayjs'

describe('Study collaborators', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/etudes/creer').as('create')
    cy.intercept('POST', '/etudes/*/cadrage/ajouter-contributeur').as('createContributor')
  })

  it('Invited collaborators have access to the study view', () => {
    cy.login()

    cy.getByTestId('new-study').click()

    cy.getByTestId('organization-sites-checkbox').first().click()
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('Collaborator study')
    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="1"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')

    cy.getByTestId('study-cadrage-link').click()
    cy.getByTestId('study-rights-add-contributor').click()

    cy.getByTestId('study-contributor-email').type('contributor@test.fr')
    cy.get('#mui-component-select-post').click()
    cy.get('[data-value="AutresEmissionsNonEnergetiques"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Agriculture"]').click()
    cy.get('body').click(0, 0)
    cy.getByTestId('study-contributor-create-button').click()
    cy.getByTestId('new-study-right-modal-accept').click()

    cy.wait('@createContributor')
    cy.getByTestId('study-contributors-table-row').should('have.length', 1)

    cy.logout()

    cy.visit('/')

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .invoke('attr', 'href')
        .then((link) => {
          const hmtlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
          cy.visit(hmtlUrl)
          cy.url().should('include', hmtlUrl)

          cy.get('a').then(($as) => {
            const hrefs = Array.from($as, (el) => (el as HTMLAnchorElement).href)
            cy.visit(hrefs[1])
          })
        })
    })

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type('contributor@test.fr')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type('Password-1')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input').type('Password-1')
    cy.getByTestId('reset-button').click()

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input').type('contributor@test.fr')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type('Password-1')
    cy.getByTestId('login-button').click()

    cy.wait('@login')

    cy.url().should('eq', `${Cypress.config().baseUrl}/?fromLogin`)

    cy.getByTestId('study').should('have.length', 1)
    cy.getByTestId('home-actualities').should('be.visible')
  })

  it('Invited collaborators do not have access to other study views', () => {
    cy.login('contributor@test.fr', 'Password-1')
    cy.getByTestId('study').first().find('a[href$="/contributeur"]').should('exist')
    cy.getByTestId('study').first().find('a[href$="/contributeur"]').click()
    cy.url().should('match', /\/contributeur$/)

    cy.url().then((url) => {
      cy.visit(url.replace(/\/contributeur$/, '/'))
      cy.url().should('match', /\/contributeur$/)

      cy.visit(url.replace(/\/contributeur$/, '/cadrage'))
      cy.url().should('match', /\/contributeur$/)

      cy.visit(url.replace(/\/contributeur$/, '/perimetre'))
      cy.url().should('match', /\/contributeur$/)

      cy.visit(url.replace(/\/contributeur$/, '/comptabilisation/saisie-des-donnees'))
      cy.url().should('match', /\/contributeur$/)

      cy.visit(url.replace(/\/contributeur$/, '/comptabilisation/resultats'))
      cy.url().should('match', /\/contributeur$/)
    })
  })

  it('Invited collaborators have access to emission factors list', () => {
    cy.login('contributor@test.fr', 'Password-1')
    cy.getByTestId('navbar-facteur-demission').should('exist')
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('cell-emission-name').should('exist')
    cy.getByTestId('new-emission').should('not.exist')
  })

  it('Invited collaborators do not have access to organization pages', () => {
    cy.login('contributor@test.fr', 'Password-1')
    cy.getByTestId('navbar-organization').should('not.exist')

    cy.visit('/equipe')
    cy.getByTestId('not-found-page').should('be.visible')

    cy.visit('/')
    cy.getByTestId('study').first().should('be.visible')

    cy.visit('/organisations')
    cy.getByTestId('not-found-page').should('be.visible')
  })
})
