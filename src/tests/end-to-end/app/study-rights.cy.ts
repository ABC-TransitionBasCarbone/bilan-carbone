import dayjs from 'dayjs'

describe('Create study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
    cy.intercept('POST', '/etudes/*/droits/ajouter').as('create')
  })

  it('should set user as editor and manage role', () => {
    cy.login()

    cy.visit('/etudes/creer')
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').should('be.visible').type('Study with rights')
    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.getByTestId('studies-Study with rights').click()
    cy.getByTestId('study-rights-button').click()

    cy.getByTestId('study-rights-table-line').contains('bc-default-0@yopmail.comÉditeur')
    cy.getByTestId('study-rights-table-line').within(() => {
      cy.get('input').should('be.disabled')
    })

    cy.getByTestId('study-rights-change-button').click()

    cy.getByTestId('study-rights-email').should('be.visible').type('bc-default-1@yopmail.com')
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.wait('@create')

    cy.getByTestId('study-rights-table-line').eq(1).contains('bc-default-1@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(1)
      .within(() => {
        cy.get('input').should('not.be.disabled')
      })

    cy.getByTestId('study-rights-change-button').click()

    cy.getByTestId('study-rights-email').should('be.visible').type('bc-admin-1@yopmail.com')
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.wait('@create')

    cy.getByTestId('study-rights-table-line').eq(2).contains('bc-admin-1@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(2)
      .within(() => {
        cy.get('input').should('not.be.disabled')
        cy.get('.MuiSelect-select').click()
      })
    cy.get('[data-value="Editor"]').click()

    cy.reload()

    cy.getByTestId('study-rights-table-line').eq(2).contains('bc-admin-1@yopmail.comÉditeur')
    cy.getByTestId('study-rights-table-line')
      .eq(2)
      .within(() => {
        cy.get('input').should('not.be.disabled')
      })

    cy.url().then((link) => {
      cy.logout()
      cy.login('bc-default-1@yopmail.com', 'password-1')
      cy.visit(link)
    })

    cy.getByTestId('select-study-role').should('not.exist')

    cy.url().then((link) => {
      cy.logout()
      cy.login('bc-admin-1@yopmail.com', 'password-1')
      cy.visit(link)
    })

    cy.getByTestId('select-study-role').should('have.length', 3)

    cy.getByTestId('study-rights-table-line')
      .eq(0)
      .within(() => {
        cy.get('input').should('not.be.disabled')
      })
    cy.getByTestId('study-rights-table-line')
      .eq(1)
      .within(() => {
        cy.get('input').should('not.be.disabled')
      })
    cy.getByTestId('study-rights-table-line')
      .eq(2)
      .within(() => {
        cy.get('input').should('be.disabled')
      })
  })
})
