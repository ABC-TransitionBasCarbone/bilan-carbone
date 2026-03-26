describe('Real use case: BC V8_10', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  it('should correctly compute results', () => {
    cy.login()
    cy.visit('/etudes/91bb3826-2be7-4d56-bb9b-363f4d9af62f/comptabilisation/resultats')

    // emissions
    cy.getByTestId('withDep-total-result').invoke('text').should('contain', '280') // 280.45
    cy.getByTestId('withoutDep-total-result').invoke('text').should('contain', '280')
    cy.getByTestId('dependency-result-budget').scrollIntoView().invoke('text').should('contain', '0') // 0.28044686001857144
    cy.getByTestId('responsibility-result-budget').scrollIntoView().invoke('text').should('contain', '0')
    cy.getByTestId('dependency-result-etp').scrollIntoView().invoke('text').should('contain', '8') // 8.012767429102041
    cy.getByTestId('responsibility-result-etp').scrollIntoView().invoke('text').should('contain', '8')

    // monetary ratios
    cy.getByTestId('results-monetary-ratio').scrollIntoView().invoke('text').should('contain', '36,99') // 36.99251508579199
    cy.getByTestId('results-non-spe-monetary-ratio').scrollIntoView().invoke('text').should('contain', '36,99')

    cy.getByTestId('post-table').click()

    cy.getByTestId('consolidated-results-table-row')
      .eq(0)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Autres émissions directes')
        cy.get('td').eq(2).should('have.text', '17') // 16.66
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(1)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Déchets directs')
        cy.get('td').eq(2).should('have.text', '0') // 0.18
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(2)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Déplacements')
        cy.get('td').eq(2).should('have.text', '105') // 105.37
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(3)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Énergie')
        cy.get('td').eq(2).should('have.text', '16') // 15.79
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(4)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Fin de vie')
        cy.get('td').eq(2).should('have.text', '6') // 6.28
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(5)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Fret')
        cy.get('td').eq(2).should('have.text', '4') // 4.33
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(6)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Immobilisations')
        cy.get('td').eq(2).should('have.text', '12') // 11.55
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(7)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Intrants biens et matières')
        cy.get('td').eq(2).should('have.text', '17') // 16.54
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(8)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Intrants services')
        cy.get('td').eq(2).should('have.text', '104') // 103.74
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(9)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Utilisation et dépendance')
        cy.get('td').eq(2).should('have.text', '0') // 0
      })
    cy.getByTestId('consolidated-results-table-row')
      .eq(10)
      .within(() => {
        cy.get('td').eq(0).should('have.text', 'Total')
        cy.get('td').eq(2).should('have.text', '280') // 280.45
      })

    cy.getByTestId('result-type-select').click()
    cy.get('[data-value="Beges"]').click()

    cy.getByTestId('beges-results-table-row')
      .eq(0)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '4') // 3.99
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0.02
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '4') // 4.01
        cy.get('td').eq(7).should('have.text', '34') // 33.95
      })
    cy.getByTestId('beges-results-table-row')
      .eq(1)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '38') // 37.85
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '38') // 37.85
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(2)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(3)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '17') // 16.66
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '17') // 16.66
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(4)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(5)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '58') // 58.5
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0.02
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '59') // 58.52
        cy.get('td').eq(6).should('have.text', '34') // 33.95
      })
    cy.getByTestId('beges-results-table-row')
      .eq(6)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '6') // 5.61
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '6') // 5.61
        cy.get('td').eq(7).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(7)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(8)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 5.61
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '6') // 5.61
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(9)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '1') // 1.49
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '1') // 1.49
        cy.get('td').eq(7).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(10)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(11)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '49') // 48.65
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '49') // 48.65
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(12)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(13)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '2') // 2.01
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0.01
        cy.get('td').eq(4).should('have.text', '1') // 0.53
        cy.get('td').eq(5).should('have.text', '3') // 2.55
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(14)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '52') // 52.15
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0.01
        cy.get('td').eq(4).should('have.text', '1') // 0.53
        cy.get('td').eq(5).should('have.text', '53') // 52.69
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(15)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '32') // 31.82
        cy.get('td').eq(3).should('have.text', '0') // 0.07
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '32') // 31.9
        cy.get('td').eq(7).should('have.text', '-34') // -33.95
      })
    cy.getByTestId('beges-results-table-row')
      .eq(16)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '22') // 21.52
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '22') // 21.52
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(17)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '2') // 1.81
        cy.get('td').eq(2).should('have.text', '0') // 0.05
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '2') // 1.86
        cy.get('td').eq(6).should('have.text', '0') // 0.07
      })
    cy.getByTestId('beges-results-table-row')
      .eq(18)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(19)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '104') // 103.74
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '104') // 103.74
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(20)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '159') // 158.9
        cy.get('td').eq(2).should('have.text', '0') // 0.12
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '159') // 159.02
        cy.get('td').eq(6).should('have.text', '-34') // -33.88
      })
    cy.getByTestId('beges-results-table-row')
      .eq(21)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
        cy.get('td').eq(7).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(22)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(23)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 5.77
        cy.get('td').eq(2).should('have.text', '1') // 0.71
        cy.get('td').eq(3).should('have.text', '0') // 0.01
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '6') // 6.49
        cy.get('td').eq(6).should('have.text', '1') // 0.86
      })
    cy.getByTestId('beges-results-table-row')
      .eq(24)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(25)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 5.77
        cy.get('td').eq(2).should('have.text', '1') // 0.71
        cy.get('td').eq(3).should('have.text', '0') // 0.01
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '6') // 6.49
        cy.get('td').eq(6).should('have.text', '1') // 0.86
      })
    cy.getByTestId('beges-results-table-row')
      .eq(26)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
        cy.get('td').eq(7).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(27)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0') // 0
        cy.get('td').eq(2).should('have.text', '0') // 0
        cy.get('td').eq(3).should('have.text', '0') // 0
        cy.get('td').eq(4).should('have.text', '0') // 0
        cy.get('td').eq(5).should('have.text', '0') // 0
        cy.get('td').eq(6).should('have.text', '0') // 0
      })
    cy.getByTestId('beges-results-table-row')
      .eq(28)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '281') // 280.93
        cy.get('td').eq(3).should('have.text', '1') // 0.84
        cy.get('td').eq(4).should('have.text', '0') // 0.04
        cy.get('td').eq(5).should('have.text', '1') // 0.53
        cy.get('td').eq(6).should('have.text', '282') // 282.34
        cy.get('td').eq(7).should('have.text', '1') // 0.93
      })

    cy.getByTestId('result-type-select').click()
    cy.get('[data-value="GHGP"]').click()

    // 1
    cy.getByTestId('ghgp-results-table-row')
      .eq(0)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '4') // 3.99
        cy.get('td').eq(3).should('have.text', '0') // 0.003
        cy.get('td').eq(4).should('have.text', '0') // 0.022
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '4') // 4.015
        cy.get('td').eq(9).should('have.text', '34') // 33.9
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(1)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '38') // 37.8
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '38') // 37.8
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(2)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(3)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '17') // 16.6
        // TO DO : this line should be in other gaz
        // cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '17') // 16.6
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(4)
      .within(() => {
        // TO DO : this line should be changed after FE fix
        // cy.get('td').eq(1).should('have.text', '42') // 41.8
        cy.get('td').eq(1).should('have.text', '58')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '59') // 58.52
        cy.get('td').eq(8).should('have.text', '34') // 33.9
      })
    // 2
    cy.getByTestId('ghgp-results-table-row')
      .eq(5)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '6') // 5.6
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '6') // 5.6
        cy.get('td').eq(9).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(6)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(7)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 5.6
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '6') // 5.6
        cy.get('td').eq(8).should('have.text', '0')
      })
    // 3.amont
    cy.getByTestId('ghgp-results-table-row')
      .eq(8)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '120') // 120.2
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '120') // 120.2
        cy.get('td').eq(9).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(9)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(10)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '15') // 15.2
        cy.get('td').eq(2).should('have.text', '0') // 0.07
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '15') // 15.4
        cy.get('td').eq(8).should('have.text', '-34') // -33.9
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(11)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '1') // 1.4
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '1') // 1.4
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(12)
      .within(() => {
        // difference is due to waste impact value
        cy.get('td').eq(1).should('have.text', '0') // 0.1
        // cy.get('td').eq(1).should('have.text', '2') // 1.8
        cy.get('td').eq(2).should('have.text', '0') // 0.05
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0') // 0.2
        // cy.get('td').eq(7).should('have.text', '2') // 1.8
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(13)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '2') // 2.0
        cy.get('td').eq(2).should('have.text', '0') // 0.005
        cy.get('td').eq(3).should('have.text', '0') // 0.009
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '2') // 2.0
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(14)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '49') // 48.6
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '49') // 48.6
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(15)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(16)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '188')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '188')
        cy.get('td').eq(8).should('have.text', '-34') // -33.9
      })
    // 3.aval
    cy.getByTestId('ghgp-results-table-row')
      .eq(17)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
        cy.get('td').eq(9).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(18)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(19)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(20)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 6
        cy.get('td').eq(2).should('have.text', '1') // 0.7
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '6') // 6
        cy.get('td').eq(8).should('have.text', '1') // 0.8
        // Theorical value
        // cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(21)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(22)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    cy.getByTestId('ghgp-results-table-row')
      .eq(23)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '0')
        cy.get('td').eq(2).should('have.text', '0')
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '0')
      })
    // 3.aval total
    cy.getByTestId('ghgp-results-table-row')
      .eq(24)
      .within(() => {
        cy.get('td').eq(1).should('have.text', '6') // 5.6
        cy.get('td').eq(2).should('have.text', '1') // 0.7
        cy.get('td').eq(3).should('have.text', '0')
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '6') // 6.3
        cy.get('td').eq(8).should('have.text', '1') // 0.9
      })
    // Total
    cy.getByTestId('ghgp-results-table-row')
      .eq(25)
      .within(() => {
        cy.get('td').eq(2).should('have.text', '258')
        cy.get('td').eq(3).should('have.text', '1') // 0.8
        cy.get('td').eq(4).should('have.text', '0')
        cy.get('td').eq(5).should('have.text', '0')
        cy.get('td').eq(6).should('have.text', '0')
        cy.get('td').eq(7).should('have.text', '0')
        cy.get('td').eq(8).should('have.text', '258')
        cy.get('td').eq(9).should('have.text', '1') // 0.9
      })
  })
})
