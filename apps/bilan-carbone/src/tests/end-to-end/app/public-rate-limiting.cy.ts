describe('Public IP rate limiting', () => {
  it('returns 429 when a single IP exceeds the public route limit', () => {
    const maxRequests = Number(Cypress.env('PUBLIC_RATE_LIMIT_MAX_REQUESTS') || 100)
    const targetPath = '/preview'
    const headers = { 'x-forwarded-for': '198.51.100.77' }

    const makeAllowedRequests = (remainingRequests: number): Cypress.Chainable => {
      if (remainingRequests <= 0) {
        return cy.wrap(null)
      }

      return cy.request({
        url: targetPath,
        headers,
        failOnStatusCode: false,
      })
        .its('status')
        .should('not.eq', 429)
        .then(() => makeAllowedRequests(remainingRequests - 1))
    }

    makeAllowedRequests(maxRequests).then(() => {
      cy.request({
        url: targetPath,
        headers,
        failOnStatusCode: false,
      }).then((response) => {
        expect(response.status).to.eq(429)
        expect(response.headers).to.have.property('retry-after')
      })
    })
  })
})
