describe('Campaign creation', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
    cy.intercept('POST', '/campaigns').as('updateCampaign')
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

  it('Collaborator campaign creation notifies each admin by email', () => {
    const campaignName = `Campaign notif ${Date.now()}`

    cy.login('mip-collaborator-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('add-campaign-button').click()
    cy.get('[data-testid^="input-name-"]').last().type(campaignName)
    cy.getByTestId('validate-campaign-update').click()
    cy.wait('@updateCampaign')

    type MailDevEmail = { subject: string; text: string; to: Array<{ address: string }> }
    const pollMailbox = (attempt = 0): Cypress.Chainable =>
      cy.request<MailDevEmail[]>('GET', 'http://localhost:1080/email').then((response) => {
        const email = response.body.find(
          (e) => e.subject.includes('Nouvelle campagne') && e.text.includes(campaignName),
        )
        if (!email) {
          if (attempt >= 10) throw new Error(`Campaign notification email not found after ${attempt} retries`)
          cy.wait(2000)
          return pollMailbox(attempt + 1)
        }
        const recipients = email.to.map((r) => r.address)
        expect(recipients).to.include('mip-admin-0@yopmail.com')
        expect(recipients).to.include('mip-super_admin-0@yopmail.com')
      })

    pollMailbox()
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
