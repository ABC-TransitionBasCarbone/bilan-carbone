import dayjs from 'dayjs'

describe('Study Rights', () => {
  beforeEach(() => {
    cy.intercept('POST', '/etudes/*/cadrage/ajouter').as('create')
    cy.intercept('POST', '/etudes/*/cadrage').as('update')
  })

  it('should set user and manage role according to given rights', () => {
    cy.login('bc-admin-1@yopmail.com', 'password-1')

    cy.getByTestId('new-study').click()
    cy.getByTestId('organization-sites-checkbox').first().click()
    cy.getByTestId('new-study-organization-button').click()

    cy.getByTestId('new-study-name').scrollIntoView()
    cy.getByTestId('new-study-name').should('be.visible')
    cy.getByTestId('new-study-name').type('Study with rights')
    cy.getByTestId('new-validator-name').click()
    cy.get('[data-option-index="0"]').click()

    cy.getByTestId('new-study-endDate').within(() => {
      cy.get('input').type(dayjs().add(1, 'y').format('DD/MM/YYYY'))
    })
    cy.getByTestId('new-study-level').click()
    cy.get('[data-value="Standard"]').click()
    cy.getByTestId('new-study-create-button').click()

    cy.getByTestId('study-cadrage-link').click()

    cy.getByTestId('study-rights-table-line').contains('bc-admin-1@yopmail.comValidateur')

    // External user
    cy.getByTestId('study-rights-change-button').click()

    cy.getByTestId('study-rights-email').should('be.visible')
    cy.getByTestId('study-rights-email').type('external@yopmail.com')
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.get('#new-study-right-dialog-title').should('be.visible')
    cy.get('#new-study-right-dialog-description').should('be.visible')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Elle ne fait pas partie de votre organisation')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('not.include', 'Si elle ne réunit pas les conditions nécessaires')
    cy.getByTestId('new-study-right-dialog-decline').click()

    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Editor"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.get('#new-study-right-dialog-title').should('be.visible')
    cy.get('#new-study-right-dialog-description').should('be.visible')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Elle ne fait pas partie de votre organisation')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Si elle ne réunit pas les conditions nécessaires')
    cy.getByTestId('new-study-right-dialog-accept').click()
    cy.wait('@create')

    cy.getByTestId('study-rights-table-line').eq(1).contains('external@yopmail.comLecteur')

    // Existing user outside of organization without rights
    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-email').type('bc-default-0@yopmail.com')
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Elle ne fait pas partie de votre organisation')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('not.include', 'Si elle ne réunit pas les conditions nécessaires')
    cy.getByTestId('new-study-right-dialog-decline').click()

    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Editor"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Elle ne fait pas partie de votre organisation')
    cy.get('#new-study-right-dialog-description')
      .invoke('text')
      .should('include', 'Si elle ne réunit pas les conditions nécessaires')
    cy.getByTestId('new-study-right-dialog-accept').click()
    cy.wait('@create')
    cy.getByTestId('study-rights-table-line').eq(1).contains('bc-default-0@yopmail.comLecteur')

    // Existing user outside of organization with rights
    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-email').type('bc-default-2@yopmail.com')
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Editor"]').click()

    cy.getByTestId('study-rights-create-button').click()
    cy.getByTestId('new-study-right-dialog-accept').click()
    cy.wait('@create')
    cy.getByTestId('study-rights-table-line').eq(2).contains('bc-default-2@yopmail.comÉditeur')

    // Organization's user without rights
    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-email').click()
    cy.contains('[data-option-index]', 'bc-default-1@yopmail.com').click()
    cy.getByTestId('study-rights-role').within(() => {
      cy.get('input').should('have.value', '')
      cy.get('input').should('not.be.disabled')
    })
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Validator"]').click()
    cy.getByTestId('study-rights-email').click()
    cy.contains('[data-option-index]', 'untrained@yopmail.com').click()
    cy.getByTestId('study-rights-role').within(() => {
      cy.get('input').should('have.value', 'Reader')
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('study-rights-create-button').click()
    cy.wait('@create')
    cy.getByTestId('study-rights-table-line').eq(4).contains('untrained@yopmail.comLecteur')

    // Organization's user with rights
    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-email').click()
    cy.contains('[data-option-index]', 'bc-default-1@yopmail.com').click()
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Validator"]').click()
    cy.getByTestId('study-rights-create-button').click()
    cy.wait('@create')
    cy.getByTestId('study-rights-table-line').eq(2).contains('bc-default-1@yopmail.comValidateur')
    cy.getByTestId('study-rights-table-line')
      .eq(2)
      .within(() => cy.get('input').should('not.be.disabled'))
    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-email').click()
    cy.contains('[data-option-index]', 'bc-super_admin-1@yopmail.com').click()
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').click()
    cy.getByTestId('study-rights-create-button').click()
    cy.wait('@create')
    cy.getByTestId('study-rights-table-line').eq(4).contains('bc-super_admin-1@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(4)
      .within(() => cy.get('input').should('not.be.disabled'))

    // Rights management
    // cannot edit its own rights
    cy.getByTestId('study-rights-table-line').eq(0).contains('bc-admin-1@yopmail.comValidateur')
    cy.getByTestId('study-rights-table-line')
      .eq(0)
      .within(() => {
        cy.get('input').should('be.disabled')
      })
    // cannot edit external or untrained user's rights
    cy.getByTestId('study-rights-table-line').eq(1).contains('bc-default-0@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(1)
      .within(() => cy.get('input').should('be.disabled'))
    cy.getByTestId('study-rights-table-line').eq(5).contains('external@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(5)
      .within(() => cy.get('input').should('be.disabled'))
    cy.getByTestId('study-rights-table-line').eq(6).contains('untrained@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(6)
      .within(() => cy.get('input').should('be.disabled'))
    // Validators can edit other people's rights
    // TODO : investigate why edition may be in error
    // cy.getByTestId('study-rights-table-line').eq(2).contains('bc-default-1@yopmail.comValidateur')
    // cy.getByTestId('study-rights-table-line')
    //   .eq(2)
    //   .within(() => {
    //     cy.get('input').should('not.be.disabled')
    //     cy.get('.MuiSelect-select').click()
    //   })
    // cy.get('[data-value="Editor"]').click()
    // cy.wait('@update')
    // cy.getByTestId('study-rights-table-line').eq(2).contains('bc-default-1@yopmail.comÉditeur')

    // Editors cannot edit validator's rights
    cy.url().then((link) => {
      cy.logout()
      cy.login('bc-default-2@yopmail.com', 'password-2')
      cy.visit(link)
    })
    cy.getByTestId('study-rights-change-button').should('exist')
    cy.getByTestId('select-study-role').should('exist')

    cy.getByTestId('study-rights-table-line').eq(0).contains('bc-admin-1@yopmail.comValidateur')
    cy.getByTestId('study-rights-table-line')
      .eq(0)
      .within(() => cy.get('input').should('be.disabled'))

    // Editors can't select validator's rights
    cy.getByTestId('study-rights-table-line').eq(4).contains('bc-super_admin-1@yopmail.comLecteur')
    cy.getByTestId('study-rights-table-line')
      .eq(4)
      .within(() => {
        cy.get('input').should('not.be.disabled')
        cy.get('.MuiSelect-select').click()
      })
    cy.get('[data-value="Reader"]').should('exist')
    cy.get('[data-value="Editor"]').should('exist')
    cy.get('[data-value="Validator"]').should('not.exist')
    cy.get('[data-value="Reader"]').click()
    // cy.wait('@update')
    // cy.getByTestId('study-rights-table-line').eq(4).contains('bc-super_admin-1@yopmail.comÉditeur')

    cy.getByTestId('study-rights-change-button').click()
    cy.getByTestId('study-rights-role').click()
    cy.get('[data-value="Reader"]').should('exist')
    cy.get('[data-value="Editor"]').should('exist')
    cy.get('[data-value="Validator"]').should('not.exist')

    // Readers can't update rights
    cy.go('back')
    cy.url().then((link) => {
      cy.logout()
      cy.login()
      cy.visit(link)
    })
    cy.getByTestId('study-rights-change-button').should('not.exist')
    cy.getByTestId('select-study-role').should('not.exist')
  })
})
