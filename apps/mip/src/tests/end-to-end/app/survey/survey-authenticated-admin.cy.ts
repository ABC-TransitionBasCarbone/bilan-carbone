describe('Survey access for authenticated admins', () => {
    const surveyId = 'campaign-admin-seed-id'

    before(() => {
        cy.resetTestDatabase()
    })

    beforeEach(() => {
        cy.intercept('POST', '/api/auth/callback/credentials').as('login')
        cy.clearLocalStorage(`mip-publicodes-state-${surveyId}`)
    })

    it('allows an authenticated admin to answer a survey without redirecting to team page', () => {
        cy.login('mip-admin-0@yopmail.com', 'password-0')

        cy.visit(`/${surveyId}/survey`)

        cy.url().should('include', `/${surveyId}/survey`)
        cy.url().should('not.include', '/equipe')

        cy.contains('button', /commencer|start/i).click()
        cy.getByTestId('survey-next-button').should('be.visible')
    })
})
