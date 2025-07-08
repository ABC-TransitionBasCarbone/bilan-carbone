describe('Create emission factor', () => {
  before(() => {
    cy.resetTestDatabase()
  })

  beforeEach(() => {
    cy.intercept('POST', '/facteurs-d-emission/creer').as('create')
  })

  it('should create an emission factor with total CO2 on your organization', () => {
    cy.login()

    cy.getByTestId('navbar-facteur-demission').click({ force: true })

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-factor-name').type('My new FE')
    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('emission-factor-source').type('Magic')
    cy.getByTestId('emission-factor-totalCo2').type('12')
    cy.getByTestId('emission-source-quality-select').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Electricite"]').click()
    cy.get('body').type('{esc}')

    cy.getByTestId('emission-factor-valid-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My new FE')
    })

    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '12 kgCO₂e/GWh')

    cy.logout()
    cy.login('bc-collaborator-2@yopmail.com', 'password-2')
    cy.getByTestId('navbar-facteur-demission').click()
  })

  it('should create an emission factor with detailed CO2 on your organization', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-factor-name').type('My new detailed FE')

    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('emission-factor-source').type('Magic')

    cy.getByTestId('emission-factor-co2f').should('not.exist')
    cy.getByTestId('emission-factor-ch4f').should('not.exist')
    cy.getByTestId('emission-factor-ch4b').should('not.exist')
    cy.getByTestId('emission-factor-n2o').should('not.exist')
    cy.getByTestId('emission-factor-co2b').should('not.exist')
    cy.getByTestId('emission-factor-sf6').should('not.exist')
    cy.getByTestId('emission-factor-hfc').should('not.exist')
    cy.getByTestId('emission-factor-pfc').should('not.exist')
    cy.getByTestId('emission-factor-otherGES').should('not.exist')

    cy.getByTestId('emission-factor-detailed-switch').get('input').should('not.be.checked')
    cy.getByTestId('emission-factor-detailed-switch').click()

    cy.getByTestId('emission-factor-co2f').should('exist')
    cy.getByTestId('emission-factor-co2f').type('1')
    cy.getByTestId('emission-factor-ch4f').should('exist')
    cy.getByTestId('emission-factor-ch4f').type('2')
    cy.getByTestId('emission-factor-ch4b').should('exist')
    cy.getByTestId('emission-factor-ch4b').type('3')
    cy.getByTestId('emission-factor-n2o').should('exist')
    cy.getByTestId('emission-factor-n2o').type('4')
    cy.getByTestId('emission-factor-co2b').should('exist')
    cy.getByTestId('emission-factor-co2b').type('5')
    cy.getByTestId('emission-factor-sf6').should('exist')
    cy.getByTestId('emission-factor-sf6').type('6')
    cy.getByTestId('emission-factor-hfc').should('exist')
    cy.getByTestId('emission-factor-hfc').type('7')
    cy.getByTestId('emission-factor-pfc').should('exist')
    cy.getByTestId('emission-factor-pfc').type('8')
    cy.getByTestId('emission-factor-otherGES').should('exist')
    cy.getByTestId('emission-factor-otherGES').type('9')

    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '37')
    })

    cy.getByTestId('emission-source-quality-select').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Electricite"]').click()
    cy.get('body').type('{esc}')

    cy.getByTestId('emission-factor-valid-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My new detailed FE')
    })
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new detailed FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '37 kgCO₂e/GWh')
  })

  it('should create an emission factor with total CO2 and multiple parts on your organization', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-factor-name').type('My new multiple FE')
    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('emission-factor-source').type('Magic')

    cy.getByTestId('emission-factor-multiple-switch').get('input').should('not.be.checked')
    cy.getByTestId('emission-factor-multiple-switch').click()

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('3')
    })
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')
    cy.getByTestId('emission-part-2-header').should('be.visible')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('emission-factor-part-0-name').type('My first part')
    cy.getByTestId('emission-factor-part-0-type').click()
    cy.get('[data-value="Amont"]').click()
    cy.getByTestId('emission-factor-part-0-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-0-totalCo2').type('3')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('emission-factor-part-1-name').type('My second part')
    cy.getByTestId('emission-factor-part-1-type').click()
    cy.get('[data-value="Combustion"]').click()
    cy.getByTestId('emission-factor-part-1-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-1-totalCo2').type('6')

    cy.getByTestId('emission-part-2-expand').click()
    cy.getByTestId('emission-factor-part-2-name').type('My first part')
    cy.getByTestId('emission-factor-part-2-type').click()
    cy.get('[data-value="Incineration"]').click()
    cy.getByTestId('emission-factor-part-2-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-2-totalCo2').type('12')

    cy.getByTestId('emission-part-0-header').should('have.text', 'My first part')
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('emission-part-2-header').should('have.text', 'My first part')

    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('have.value', '21')
    })

    cy.getByTestId('emission-source-quality-select').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Electricite"]').click()
    cy.get('body').type('{esc}')

    cy.getByTestId('emission-factor-valid-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My new multiple FE')
    })

    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new multiple FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '21 kgCO₂e/GWh')
  })

  it('should create an emission factor with detailed CO2 and multiple parts on your organization', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-factor-name').type('My new multiple detailed FE')
    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('emission-factor-source').type('Magic')

    cy.getByTestId('emission-factor-detailed-switch').click()
    cy.getByTestId('emission-factor-multiple-switch').click()
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-0-header').should('have.text', 'Composante 1')
    cy.getByTestId('emission-part-1-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('have.text', 'Composante 2')
    cy.getByTestId('emission-part-2-header').should('not.exist')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('emission-factor-part-0-name').type('My first part')
    cy.getByTestId('emission-factor-part-0-type').click()
    cy.get('[data-value="Amont"]').click()
    cy.getByTestId('emission-factor-part-0-co2f').should('exist')
    cy.getByTestId('emission-factor-part-0-co2f').type('1')
    cy.getByTestId('emission-factor-part-0-ch4f').should('exist')
    cy.getByTestId('emission-factor-part-0-ch4f').type('2')
    cy.getByTestId('emission-factor-part-0-ch4b').should('exist')
    cy.getByTestId('emission-factor-part-0-ch4b').type('3')
    cy.getByTestId('emission-factor-part-0-n2o').should('exist')
    cy.getByTestId('emission-factor-part-0-n2o').type('4')
    cy.getByTestId('emission-factor-part-0-co2b').should('exist')
    cy.getByTestId('emission-factor-part-0-co2b').type('5')
    cy.getByTestId('emission-factor-part-0-sf6').should('exist')
    cy.getByTestId('emission-factor-part-0-sf6').type('6')
    cy.getByTestId('emission-factor-part-0-hfc').should('exist')
    cy.getByTestId('emission-factor-part-0-hfc').type('7')
    cy.getByTestId('emission-factor-part-0-pfc').should('exist')
    cy.getByTestId('emission-factor-part-0-pfc').type('8')
    cy.getByTestId('emission-factor-part-0-otherGES').should('exist')
    cy.getByTestId('emission-factor-part-0-otherGES').type('9')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('emission-factor-part-1-name').type('My second part')
    cy.getByTestId('emission-factor-part-1-type').click()
    cy.get('[data-value="Combustion"]').click()
    cy.getByTestId('emission-factor-part-1-co2f').should('exist')
    cy.getByTestId('emission-factor-part-1-co2f').type('2')
    cy.getByTestId('emission-factor-part-1-ch4f').should('exist')
    cy.getByTestId('emission-factor-part-1-ch4f').type('3')
    cy.getByTestId('emission-factor-part-1-ch4b').should('exist')
    cy.getByTestId('emission-factor-part-1-ch4b').type('4')
    cy.getByTestId('emission-factor-part-1-n2o').should('exist')
    cy.getByTestId('emission-factor-part-1-n2o').type('5')
    cy.getByTestId('emission-factor-part-1-co2b').should('exist')
    cy.getByTestId('emission-factor-part-1-co2b').type('6')
    cy.getByTestId('emission-factor-part-1-sf6').should('exist')
    cy.getByTestId('emission-factor-part-1-sf6').type('7')
    cy.getByTestId('emission-factor-part-1-hfc').should('exist')
    cy.getByTestId('emission-factor-part-1-hfc').type('8')
    cy.getByTestId('emission-factor-part-1-pfc').should('exist')
    cy.getByTestId('emission-factor-part-1-pfc').type('9')
    cy.getByTestId('emission-factor-part-1-otherGES').should('exist')
    cy.getByTestId('emission-factor-part-1-otherGES').type('10')

    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '81')
    })

    cy.getByTestId('emission-source-quality-select').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Electricite"]').click()
    cy.get('body').type('{esc}')

    cy.getByTestId('emission-factor-valid-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My new multiple detailed FE')
    })

    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new multiple detailed FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '81 kgCO₂e/GWh')
  })

  it('should render emission parts in accordions', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('not.be.disabled')
    })

    cy.getByTestId('emission-factor-multiple-switch').click()
    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('3')
    })
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-0-header').should('have.text', 'Composante 1')
    cy.getByTestId('emission-part-1-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('have.text', 'Composante 2')
    cy.getByTestId('emission-part-2-header').should('be.visible')
    cy.getByTestId('emission-part-2-header').should('have.text', 'Composante 3')
    cy.getByTestId('emission-part-3-header').should('not.exist')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('emission-factor-part-0-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-0-totalCo2').should('not.be.disabled')
    cy.getByTestId('emission-factor-part-0-co2f').should('not.exist')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('emission-factor-part-1-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-1-totalCo2').should('not.be.disabled')
    cy.getByTestId('emission-factor-part-1-co2f').should('not.exist')

    cy.getByTestId('emission-part-2-expand').click()
    cy.getByTestId('emission-factor-part-2-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-2-totalCo2').should('not.be.disabled')
    cy.getByTestId('emission-factor-part-2-co2f').should('not.exist')

    cy.getByTestId('emission-factor-detailed-switch').click()

    cy.getByTestId('emission-factor-part-0-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('emission-factor-part-0-co2f').should('exist')

    cy.getByTestId('emission-factor-part-1-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('emission-factor-part-1-co2f').should('exist')

    cy.getByTestId('emission-factor-part-2-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('emission-factor-part-2-co2f').should('exist')

    cy.getByTestId('emission-factor-multiple-switch').click()

    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('emission-part-1-header').should('not.exist')
    cy.getByTestId('emission-part-2-header').should('not.exist')

    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
  })

  it('should not delete parts from form when switch off detailed ges', () => {
    cy.login()
    cy.getByTestId('navbar-facteur-demission').click()

    cy.getByTestId('new-emission').click({ force: true })

    cy.getByTestId('emission-factor-name').type('My new FE without parts')
    cy.getByTestId('emission-factor-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('emission-factor-source').type('Magic')

    cy.getByTestId('emission-factor-multiple-switch').click()

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })

    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('emission-factor-part-0-name').type('My first part')
    cy.getByTestId('emission-factor-part-0-type').click()
    cy.get('[data-value="Amont"]').click()
    cy.getByTestId('emission-factor-part-0-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-0-totalCo2').type('3')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('emission-factor-part-1-name').type('My second part')
    cy.getByTestId('emission-factor-part-1-type').click()
    cy.get('[data-value="Combustion"]').click()
    cy.getByTestId('emission-factor-part-1-totalCo2').should('be.visible')
    cy.getByTestId('emission-factor-part-1-totalCo2').type('6')

    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('have.value', '9')
    })

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('1')
    })
    cy.getByTestId('emission-part-1-header').should('not.exist')
    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('have.value', '3')
    })

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('emission-factor-totalCo2').within(() => {
      cy.get('input').should('have.value', '9')
    })

    cy.getByTestId('emission-factor-multiple-switch').click()
    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('emission-factor-multiple-switch').click()
    cy.getByTestId('emission-part-0-header').should('have.text', 'My first part')
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')

    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').should('have.value', 2)
    })
    cy.getByTestId(`delete-emission-part-0`).click()
    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').should('have.value', 1)
    })
    cy.getByTestId(`delete-emission-part-0`).should('be.disabled')
    cy.getByTestId('emission-part-0-header').should('have.text', 'My second part')
    cy.getByTestId('emission-factor-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })
    cy.getByTestId(`delete-emission-part-0`).should('not.be.disabled')
    cy.getByTestId('emission-part-1-header').should('have.text', 'My first part')

    cy.getByTestId('emission-factor-multiple-switch').click()

    cy.getByTestId('emission-factor-totalCo2').clear()
    cy.getByTestId('emission-factor-totalCo2').type('144')

    cy.getByTestId('emission-source-quality-select').click()
    cy.get('[data-value="5"]').click()
    cy.getByTestId('emission-factor-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('emission-factor-subPost').click()
    cy.get('[data-value="Electricite"]').click()
    cy.get('body').type('{esc}')

    cy.getByTestId('emission-factor-valid-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('emission-factor-search-input').within(() => {
      cy.get('input').type('My new FE without parts')
    })

    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new FE without parts')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '144 kgCO₂e/GWh')
  })
})
