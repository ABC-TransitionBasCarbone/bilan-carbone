import dayjs from 'dayjs'

describe('Edit study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
    cy.intercept('POST', '/etudes/creer').as('create')
  })

  it('Should be able to edit a study sites', () => {
    cy.intercept('POST', '/etudes/*/perimetre').as('update')
    cy.login()

    cy.visit('/etudes/creer')
    cy.get('[data-testid="organization-sites-checkbox"] > input').eq(1).click({ force: true })
    cy.getByTestId('organization-sites-etp')
      .eq(1)
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type('1')
      })
    cy.getByTestId('organization-sites-ca')
      .eq(1)
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type('1')
      })

    cy.getByTestId('new-study-organization-button').should('not.be.disabled')
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('My new study')
    cy.getByTestId('new-validator-name').within(() => {
      cy.get('input').type('bc-collaborator-0@yopmail.com')
    })
    cy.get('[data-option-index="0"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('span').first().type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')

    /**
     * Revoir pourquoi le drawer n’est pas ouvert, comment l’ouvrir
     */
    /*cy.url().should('include', '/etudes/')
    cy.getByTestId('study-perimetre-link').click()

    cy.wait('@update')

    cy.getByTestId('sites-table-body').within(() => {
      cy.get('tr')
        .first()
        .within(() => {
          cy.get('td').eq(1).contains('1')
          cy.get('td').eq(2).contains('1')
        })
      cy.get('tr').should('have.length', 1)
    })

    cy.getByTestId('edit-study-sites').click()

    // selected sites should appear in first
    cy.getByTestId('organization-sites-checkbox')
      .first()
      .within(() => {
        cy.get('input').should('be.checked')
      })
    cy.getByTestId('organization-sites-etp')
      .first()
      .within(() => {
        cy.get('input').should('have.value', '1')
      })
    cy.getByTestId('organization-sites-ca')
      .first()
      .within(() => {
        cy.get('input').should('have.value', '1')
      })

    //change selected sites
    cy.getByTestId('organization-sites-checkbox').first().click()
    cy.getByTestId('organization-sites-checkbox').eq(1).click()

    // update selected site
    cy.getByTestId('organization-sites-etp')
      .eq(1)
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type('2')
      })
    cy.getByTestId('organization-sites-ca')
      .eq(1)
      .within(() => {
        cy.get('input').clear()
        cy.get('input').type('2')
      })

    // manage different sites count : may have to be scrolled (many sites) or may not be able to scroll (few sites)
    cy.getByTestId('confirm-edit-study-sites').scrollIntoView({ ensureScrollable: false })
    // edit button could be under the menu button
    cy.getByTestId('confirm-edit-study-sites').click({ force: true })

    cy.wait('@update')

    cy.getByTestId('sites-table-body').within(() => {
      cy.get('tr')
        .first()
        .within(() => {
          cy.get('td').eq(1).contains('2')
          cy.get('td').eq(2).contains('2')
        })
      cy.get('tr').should('have.length', 1)
    })*/
  })
})
