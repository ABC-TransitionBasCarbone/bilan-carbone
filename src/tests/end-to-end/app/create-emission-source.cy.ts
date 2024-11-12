describe('Create study', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')
  })

  it('should create an emission source on a study', () => {
    cy.login()

    cy.getByTestId('study').first().click()
    cy.getByTestId('post-infography').first().click()
    cy.getByTestId('subpost').first().click()

    cy.getByTestId('new-emission-source').first().type('My new emission source{enter}')

    cy.getByTestId('emission-source-My new emission source').should('exist')
    cy.getByTestId('emission-source-My new emission source').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'En attente')
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
    cy.getByTestId('emission-source-caracterisation').type('My caracterisation')

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
      cy.getByTestId('emission-source-status').should('have.text', 'A vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('not.exist')
    })
    cy.getByTestId('emission-source-result').should('exist')
    cy.getByTestId('emission-source-validated').should('exist')
    cy.getByTestId('emission-source-result').should('have.text', 'Résultats :Émission :50616.00 kgCO₂e')

    cy.getByTestId('emission-source-reliability').click()
    cy.get('[data-value="4"]').click()
    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'A vérifier')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Très bonne')
    })
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Résultats :Émission :50616.00 kgCO₂eQualité :Très bonneIntervalle de confiance à 95% :[50518.29; 50713.90]Alpha :0.00',
    )
    cy.getByTestId('emission-source-technicalRepresentativeness').click()
    cy.get('[data-value="1"]').click()
    cy.getByTestId('emission-source-result').should(
      'have.text',
      'Résultats :Émission :50616.00 kgCO₂eQualité :MauvaiseIntervalle de confiance à 95% :[49242.03; 52028.31]Alpha :0.03',
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
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })

    cy.reload()

    cy.getByTestId('subpost').first().click()
    cy.getByTestId('emission-source-My emission source name').click()
    cy.getByTestId('emission-source-My emission source name').within(() => {
      cy.getByTestId('emission-source-status').should('have.text', 'Validée')
      cy.getByTestId('emission-source-value').should('have.text', '50616.00 kgCO₂e')
      cy.getByTestId('emission-source-quality').should('have.text', 'Qualité : Mauvaise')
    })
  })
})
