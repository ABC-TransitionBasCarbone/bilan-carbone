import { Role } from '@prisma/client'

describe('Team', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/api/auth/callback/credentials').as('login')
    cy.intercept('POST', '/api/auth/signout').as('logout')
    cy.intercept('POST', '/equipe/ajouter').as('new-member')
  })

  it('admins can edit team member role', () => {
    cy.login('bc-admin-1@yopmail.com', 'password-1')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row')
      .eq(0)
      .within(() => {
        cy.get('input').should('exist')
      })
  })

  it('super-admins can edit team member role', () => {
    cy.login('bc-super_admin-1@yopmail.com', 'password-1')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row')
      .eq(0)
      .within(() => {
        cy.get('input').should('exist')
      })
  })

  it('gestionnaires can edit team member role', () => {
    cy.login('bc-gestionnaire-1@yopmail.com', 'password-1')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row')
      .eq(0)
      .within(() => {
        cy.get('input').should('exist')
      })
  })

  it('collaborators cannot edit team member role', () => {
    cy.login('bc-collaborator-1@yopmail.com', 'password-1')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row')
      .eq(0)
      .within(() => {
        cy.get('input').should('not.exist')
      })
  })

  it('members cannot edit team member role', () => {
    cy.login('bc-default-1@yopmail.com', 'password-1')
    cy.visit('/equipe')
    cy.getByTestId('team-table-row')
      .eq(0)
      .within(() => {
        cy.get('input').should('not.exist')
      })
  })

  it('should change a member role', () => {
    cy.login('bc-admin-1@yopmail.com', 'password-1')
    cy.visit('/equipe')

    cy.getByTestId('team-table-row').eq(5).contains('bc-admin-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(5)
      .within(() => {
        cy.get('input').should('have.value', Role.ADMIN)
        cy.get('input').should('not.be.disabled')
      })

    cy.getByTestId('team-table-row').eq(6).contains('bc-collaborator-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(6)
      .within(() => {
        cy.get('input').should('have.value', Role.COLLABORATOR)
        cy.get('input').should('not.be.disabled')
      })

    cy.getByTestId('team-table-row').eq(7).contains('bc-default-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(7)
      .within(() => {
        cy.get('input').should('have.value', Role.DEFAULT)
        cy.get('input').should('not.be.disabled')
      })

    cy.getByTestId('team-table-row').eq(13).contains('bc-gestionnaire-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(13)
      .within(() => {
        cy.get('input').should('have.value', Role.GESTIONNAIRE)
        cy.get('input').should('not.be.disabled')
      })

    cy.getByTestId('team-table-row').eq(14).contains('bc-super_admin-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(14)
      .within(() => {
        cy.get('input').should('have.value', Role.SUPER_ADMIN)
        cy.get('input').should('be.disabled')
      })

    cy.getByTestId('team-table-row').eq(6).contains('bc-collaborator-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(6)
      .within(() => {
        cy.get('input').should('have.value', Role.COLLABORATOR)
        cy.get('.MuiSelect-select').click()
      })
    cy.get('[data-value="GESTIONNAIRE"]').click()
    cy.getByTestId('alert-toaster').should('be.visible')

    cy.reload()

    cy.getByTestId('team-table-row').eq(6).contains('bc-collaborator-1@yopmail.com').should('exist')
    cy.getByTestId('team-table-row')
      .eq(6)
      .within(() => {
        cy.get('input').should('have.value', Role.GESTIONNAIRE)
      })
  })

  it('should add a new member', () => {
    cy.login('bc-admin-1@yopmail.com', 'password-1')
    cy.getByTestId('button-menu-my-organization').trigger('mouseover')
    cy.getByTestId('link-equipe').click()

    cy.getByTestId('pending-invitation').should('not.exist')
    cy.getByTestId('add-member-link').click()

    cy.getByTestId('new-member-firstName').type('User')
    cy.getByTestId('new-member-lastName').type('Test')
    cy.getByTestId('new-member-email').type('user-test-1@test.fr')
    cy.getByTestId('new-member-role').click()
    cy.get('[data-value="GESTIONNAIRE"]').click()

    cy.getByTestId('new-member-create-button').click()
    cy.wait('@new-member')

    cy.url().should('eq', `${Cypress.config().baseUrl}/equipe`)
    cy.getByTestId('pending-invitation').contains('user-test-1@test.fr').should('exist')

    cy.visit('http://localhost:1080')
    cy.origin('http://localhost:1080', () => {
      cy.get('.email-item-link')
        .first()
        .invoke('attr', 'href')
        .then((link) => {
          const hmtlUrl = `http://localhost:1080${(link as string).replace('#/', '/')}/html`
          cy.visit(hmtlUrl)
          cy.url().should('include', hmtlUrl)

          cy.get('a')
            .invoke('attr', 'href')
            .then((link) => cy.visit(link as string))
        })
    })

    cy.wait('@logout')
    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .type('user-test-1@test.fr')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .type('Password-1')
    cy.get('[data-testid="input-confirm-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .type('Password-1')

    cy.getByTestId('reset-button').click()

    cy.url({ timeout: 8000 }).should('include', '/login')

    cy.get('[data-testid="input-email"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .type('user-test-1@test.fr')
    cy.get('[data-testid="input-password"] > .MuiInputBase-root > .MuiInputBase-input')
      .should('be.visible')
      .type('Password-1')
    cy.getByTestId('login-button').click()

    cy.wait('@login')
    cy.url().should('not.include', '/login')
  })
})
