Cypress.Commands.add(
  'getByTestId',
  (testId: string, params?: Partial<Cypress.Loggable & Cypress.Timeoutable & Cypress.Withinable & Cypress.Shadow>) =>
    cy.get(`[data-testid="${testId}"]`, params),
)

Cypress.Commands.add('login', (email = 'bc-collaborator-0@yopmail.com', password = 'password-0') => {
  cy.visit('/login')
  cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
    .should('be.visible')
    .should('not.be.disabled')
    .type(email)
  cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input').type(password)
  cy.getByTestId('login-button').click()
  cy.getByTestId('login-button').should('be.disabled')
  cy.wait(`@login`)
  cy.getByTestId('navbar').should('be.visible')
  cy.getByTestId('navbar-top-left').should('be.visible')
})

Cypress.Commands.add('logout', () => {
  cy.visit('/logout')
  cy.wait(`@logout`)
})

Cypress.Commands.add('signupCut', (email = 'cut-cnc@yopmail.com', cncOrSiret = '321') => {
  cy.visit('/count/register')

  cy.getByTestId('welcome-text').should('be.visible')
  cy.getByTestId('welcome-text').should('contain.text', 'Bienvenue sur')
  cy.getByTestId('welcome-explanation').should('be.visible')
  cy.getByTestId('welcome-explanation').should(
    'contain.text',
    "Cet outil a été développé par l'association CUT ! Cinéma Uni pour la Transition, en coopération avec l'ABC, association pour la Transition bas carbone.",
  )
  cy.getByTestId('activation-email').should('be.visible')
  cy.getByTestId('activation-siretOrCNC').should('be.visible')
  cy.getByTestId('activation-button').should('be.visible')

  cy.getByTestId('activation-email').type(email)
  cy.getByTestId('activation-siretOrCNC').type(cncOrSiret)
  cy.getByTestId('activation-form-message').should('not.exist')
  cy.getByTestId('activation-button').click()

  cy.wait('@signupCut')
})

Cypress.Commands.add('resetTestDatabase', () => {
  cy.exec('yarn db:test:reset')
})

Cypress.Commands.add('initFePage', () => {
  cy.login()

  cy.getByTestId('navbar-facteur-demission').click({ force: true })

  cy.getByTestId('new-emission').click({ force: true })

  cy.getByTestId('new-emission-factor-page').should('be.visible')
  cy.getByTestId('new-emission-factor-page').should('contain.text', "Ajouter un facteur d'émission")
  cy.getByTestId('emission-factor-name').should('be.visible')
})

Cypress.Commands.add('initCreateStudyPage', () => {
  cy.login()
  cy.visit('/etudes/creer')
  cy.getByTestId('new-study-organization-title').should('be.visible')
  cy.getByTestId('sites-title').should('be.visible')
  cy.getByTestId('sites-title').should('contain.text', "Sites de l'organisation concernés par l'étude")
  cy.getByTestId('organization-sites-name-header').should('be.visible')
  cy.getByTestId('organization-sites-name-header').should('contain.text', 'Nom')
  cy.getByTestId('organization-sites-checkbox').should('be.visible')
})

Cypress.Commands.add('initCreateStudyPageByClicking', () => {
  cy.getByTestId('new-study').click()
  cy.getByTestId('new-study-organization-title').should('be.visible')
  cy.getByTestId('sites-title').should('be.visible')
  cy.getByTestId('sites-title').should('contain.text', "Sites de l'organisation concernés par l'étude")
  cy.getByTestId('organization-sites-name-header').should('be.visible')
  cy.getByTestId('organization-sites-name-header').should('contain.text', 'Nom')
  cy.getByTestId('organization-sites-checkbox').should('be.visible')
})

Cypress.Commands.add('initRegisterClicksonPage', () => {
  cy.visit('/clickson/register')
  cy.getByTestId('welcome-text').should('be.visible')
  cy.getByTestId('welcome-text').should('contain.text', 'Bienvenue sur Clickson PEBC')
  cy.getByTestId('welcome-explanation').should('be.visible')
  cy.getByTestId('welcome-explanation').should(
    'contain.text',
    'Mesurons les émissions de gaz à effet de serre de votre établissement',
  )
  cy.getByTestId('activation-email').should('be.visible')
  cy.getByTestId('activation-school').should('be.visible')
  cy.getByTestId('activation-button').should('be.visible')
})
