describe('Public IP rate limiting', () => {
  it('returns 429 when a single IP exceeds the public route limit', () => {
    const maxRequests = Number(Cypress.env('PUBLIC_RATE_LIMIT_MAX_REQUESTS') || 100)
    const targetPath = '/preview'
    const headers = { 'x-forwarded-for': '198.51.100.77' }

    Cypress._.times(maxRequests, () => {
      cy.request({
        url: targetPath,
        headers,
        failOnStatusCode: false,
      }).its('status')
        .should('not.eq', 429)
    })

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
