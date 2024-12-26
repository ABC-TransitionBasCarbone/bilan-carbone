import dayjs from 'dayjs'

describe('Edit study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
    cy.intercept('POST', '/etudes/creer').as('create')
  })

  it('Should be able to edit a study sites', () => {
    cy.intercept('POST', '/etudes/*/perimetre/modifier').as('update')
    cy.login()

    cy.getByTestId('new-study').click()
    cy.getByTestId('organization-sites-checkbox').eq(1).click()
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

    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').type('My new study')
    cy.getByTestId('new-validator-name').within(() => {
      cy.get('input').type('bc-default-0@yopmail.com')
    })
    cy.get('[data-option-index="0"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Initial"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.wait('@create')

    cy.getByTestId('study-perimetre-link').click()

    cy.getByTestId('sites-table-body').within(() => {
      cy.get('tr')
        .first()
        .within(() => {
          cy.get('td').eq(1).contains('1')
          cy.get('td').eq(2).contains('1€')
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
    cy.getByTestId('edit-study-sites-button').scrollIntoView({ ensureScrollable: false })
    // edit button could be under the menu button
    cy.getByTestId('edit-study-sites-button').click({ force: true })

    cy.wait('@update')

    cy.getByTestId('sites-table-body').within(() => {
      cy.get('tr')
        .first()
        .within(() => {
          cy.get('td').eq(1).contains('2')
          cy.get('td').eq(2).contains('2€')
        })
      cy.get('tr').should('have.length', 1)
    })
  })
})
