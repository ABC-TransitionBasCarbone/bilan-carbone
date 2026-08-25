describe('Campaign creation', () => {
  type MaildevEmail = { to?: { address?: string }[]; subject?: string; text?: string }

  const clearMaildevInbox = () =>
    cy.request({
      method: 'DELETE',
      url: 'http://localhost:1080/email/all',
      failOnStatusCode: false,
    })

  const readMaildevEmails = (): Cypress.Chainable<MaildevEmail[]> =>
    cy
      .request({
        method: 'GET',
        url: 'http://localhost:1080/email',
        failOnStatusCode: false,
      })
      .then((response) => {
        const emails = Array.isArray(response.body) ? (response.body as MaildevEmail[]) : []

        return emails
      })

  const waitForEmailsWithSubject = (subject: string, attempts = 0): Cypress.Chainable<MaildevEmail[]> =>
    readMaildevEmails().then((emails) => {
      const matching = emails.filter((e) => e.subject?.includes(subject))
      if (matching.length > 0 || attempts >= 10) return cy.wrap(matching)
      return cy.wait(500).then(() => waitForEmailsWithSubject(subject, attempts + 1))
    })

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

  it('Collaborator campaign creation notifies each admin by email', () => {
    const campaignName = `Campaign notif ${Date.now()}`
    clearMaildevInbox()

    cy.login('mip-collaborator-0@yopmail.com', 'password-0')
    cy.visit('/campaigns')
    cy.getByTestId('add-campaign-button').click()
    cy.get('[data-testid^="input-name-"]').last().type(campaignName)
    cy.intercept('POST', '/campaigns').as('updateCampaign')
    cy.getByTestId('validate-campaign-update').click()
    cy.wait('@updateCampaign')

    waitForEmailsWithSubject('Nouvelle campagne').then((notifications) => {
      const recipients = notifications.flatMap((email) =>
        (email.to || []).map((to) => (to.address || '').toLowerCase()),
      )

      expect(recipients).to.include('mip-admin-0@yopmail.com')
      expect(recipients).to.include('mip-super_admin-0@yopmail.com')
      expect(notifications.some((email) => (email.text || '').includes(campaignName))).to.equal(true)
    })
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
