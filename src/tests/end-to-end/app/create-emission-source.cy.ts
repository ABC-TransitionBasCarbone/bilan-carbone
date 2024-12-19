const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'

describe('Create study emission source', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
  })

  it('should create an emission source on a study', () => {
    cy.login()

    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBienEtMatieres`)
    cy.getByTestId('subpost').first().click()

    cy.getByTestId('new-emission-source').first().type('My new emission source{enter}')

    cy.getByTestId('emission-source-My new emission source').should('exist')
    cy.getByTestId('emission-source-My new emission source').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', "En attente d'un contributeur - 25%")
      cy.getByTestId('emission-source-value').should('have.text', '')
      cy.getByTestId('emission-source-quality').should('not.exist')
    })

    cy.getByTestId('emission-source-My new emission source').click()

    cy.getByTestId('emission-source-result').should('not.exist')
    cy.getByTestId('emission-source-validated').should('not.exist')

    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      'My new emission source',
    )
    cy.getByTestId('emission-source-name').clear()
    cy.getByTestId('emission-source-name').type('My emission source name')
    cy.getByTestId('emission-source-tag').type('my tag')

    cy.getByTestId('emission-source-My new emission source').should('not.exist')
    cy.getByTestId('emission-source-My emission source name').should('exist')

    cy.getByTestId('emission-source-factor').should('not.exist')
    cy.getByTestId('emission-source-factor-search').type('test 1')
    cy.getByTestId('emission-source-factor-suggestion').first().click()
    cy.getByTestId('emission-source-factor').should('exist')

    cy.getByTestId('emission-source-value-da').type('456')
    cy.getByTestId('emission-source-source').type('My source')
    cy.getByTestId('emission-source-type').click()
    cy.get('[data-value="Physical"]').click()

    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('not.exist')
    })
    cy.getByTestId('emission-source-result').should('exist')
    cy.getByTestId('emission-source-validated').should('exist')
    cy.getByTestId('emission-source-result').should('have.text', 'Résultats :Émission :50616.00 kgCO₂e')

    cy.getByTestId('emission-source-reliability').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Très bonne')
    })
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Résultats :Émission :50616.00 kgCO₂eQualité :Très bonneIntervalle de confiance à 95% :[48019.73; 53352.64]Alpha :0.05',
    )
    cy.getByTestId('emission-source-technicalRepresentativeness').click()
    cy.get('[data-value="1"]').click()
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Résultats :Émission :50616.00 kgCO₂eQualité :MauvaiseIntervalle de confiance à 95% :[25257.51; 101434.38]Alpha :1.00',
    )
    cy.getByTestId('emission-source-geographicRepresentativeness').click()
    cy.get('[data-value="2"]').click()
    cy.getByTestId('emission-source-temporalRepresentativeness').click()
    cy.get('[data-value="3"]').click()
    cy.getByTestId('emission-source-completeness').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-source-comment').type('My comment')

    cy.getByTestId('emission-source-validated').click()
    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'Validée')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })

    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('be.disabled')
    cy.getByTestId('emission-source-validated').click()

    // Editor can add source, edit but not validate
    cy.logout()
    cy.login('bc-admin-0@yopmail.com', 'password-0')
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBienEtMatieres`)
    cy.getByTestId('subpost').first().click()
    cy.getByTestId('new-emission-source').should('exist')
    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })
    cy.getByTestId('emission-source-My emission source name').click()
    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      'My emission source name',
    )
    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('not.be.disabled')
    cy.getByTestId('emission-source-name').clear()
    cy.getByTestId('emission-source-name').type('My edited emission source name')
    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').blur()

    cy.getByTestId('emission-source-validated').should('not.exist')

    // Reader can only read
    cy.logout()
    cy.login('bc-default-1@yopmail.com', 'password-1')
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBienEtMatieres`)
    cy.getByTestId('subpost').first().click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })
    cy.getByTestId('emission-source-My edited emission source name').click()
    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      'My edited emission source name',
    )
    cy.get('[data-testid="emission-source-name"] > .MuiInputBase-root > .MuiInputBase-input').should('be.disabled')
    cy.getByTestId('emission-source-validated').should('not.exist')

    // Contributor can only contribute specific field
    cy.logout()

    cy.login('bc-contributor@yopmail.com', 'password')
    cy.visit(`/etudes/${studyId}/comptabilisation/saisie-des-donnees/IntrantsBienEtMatieres`)
    cy.getByTestId('not-found-page').should('exist')

    cy.visit(`/etudes/${studyId}`)
    cy.getByTestId('subpost').first().click()
    cy.getByTestId('new-emission-source').should('not.exist')
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      cy.getByTestId('emission-source-contributor').should('not.exist')
    })
    cy.getByTestId('emission-source-My edited emission source name').click()
    cy.getByTestId('emission-source-name').should('not.exist')
    cy.getByTestId('emission-source-validated').should('not.exist')
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input').should(
      'have.value',
      '456',
    )
    cy.getByTestId('emission-source-value-da').clear()
    cy.getByTestId('emission-source-value-da').type('789')
    cy.get('[data-testid="emission-source-value-da"] > .MuiInputBase-root > .MuiInputBase-input').blur()
    cy.getByTestId('emission-source-My edited emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'À vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '87579.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
      cy.getByTestId('emission-source-contributor').should('have.text', 'bc-contributor@yopmail.com')
    })
  })
})
