describe('Accounts - multiple environment with the same user', () => {
  before(() => {
    cy.exec('npx prisma db seed')
  })

  beforeEach(() => {
    cy.login('all-env-admin-0@yopmail.com', 'password-0')
  })

  it('Should display the select account page', () => {
    cy.getByTestId('select-account').should('exist')
  })

  it('Should be able to connect as CUT user', () => {
    cy.getByTestId('account-cut').click()
    cy.get('img[alt]', { timeout: 4000 }).should(($img) => {
      expect($img.attr('alt')).to.eq('Logo de COUNT')
    })
    cy.get('[alt="Logo de COUNT"]').should('exist')
  })

  it('Should be able to connect as BC user', () => {
    cy.getByTestId('account-bc').click()
    cy.get('[alt="Logo de bilan carbone 2025"]').should('exist')
  })
})
