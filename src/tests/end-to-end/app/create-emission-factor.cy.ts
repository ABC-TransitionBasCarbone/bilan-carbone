describe('Create emission factor', () => {
  beforeEach(() => {
    cy.exec('npx prisma db seed')

    cy.intercept('POST', '/facteurs-d-emission/creer').as('create')
  })

  it('should create an emission factor with total CO2 on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new FE')
    cy.getByTestId('new-emission-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('new-emission-source').type('Magic')
    cy.getByTestId('new-emission-totalCo2').type('12')
    cy.getByTestId('new-emission-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('new-emission-subPost').click()
    cy.get('[data-value="Electricite"]').click()

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)

    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '12 kgCO₂e/GWh')

    cy.logout()
    cy.login('bc-default-2@yopmail.com', 'password-2')
    cy.visit('/facteurs-d-emission')
  })

  it('should create an emission factor with detailed CO2 on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new detailed FE')

    cy.getByTestId('new-emission-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('new-emission-source').type('Magic')

    cy.getByTestId('new-emission-co2f').should('not.exist')
    cy.getByTestId('new-emission-ch4f').should('not.exist')
    cy.getByTestId('new-emission-ch4b').should('not.exist')
    cy.getByTestId('new-emission-n2o').should('not.exist')
    cy.getByTestId('new-emission-co2b').should('not.exist')
    cy.getByTestId('new-emission-sf6').should('not.exist')
    cy.getByTestId('new-emission-hfc').should('not.exist')
    cy.getByTestId('new-emission-pfc').should('not.exist')
    cy.getByTestId('new-emission-otherGES').should('not.exist')

    cy.getByTestId('new-emission-detailed-switch').get('input').should('not.be.checked')
    cy.getByTestId('new-emission-detailed-switch').click()

    cy.getByTestId('new-emission-co2f').should('exist')
    cy.getByTestId('new-emission-co2f').type('1')
    cy.getByTestId('new-emission-ch4f').should('exist')
    cy.getByTestId('new-emission-ch4f').type('2')
    cy.getByTestId('new-emission-ch4b').should('exist')
    cy.getByTestId('new-emission-ch4b').type('3')
    cy.getByTestId('new-emission-n2o').should('exist')
    cy.getByTestId('new-emission-n2o').type('4')
    cy.getByTestId('new-emission-co2b').should('exist')
    cy.getByTestId('new-emission-co2b').type('5')
    cy.getByTestId('new-emission-sf6').should('exist')
    cy.getByTestId('new-emission-sf6').type('6')
    cy.getByTestId('new-emission-hfc').should('exist')
    cy.getByTestId('new-emission-hfc').type('7')
    cy.getByTestId('new-emission-pfc').should('exist')
    cy.getByTestId('new-emission-pfc').type('8')
    cy.getByTestId('new-emission-otherGES').should('exist')
    cy.getByTestId('new-emission-otherGES').type('9')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '45')
    })

    cy.getByTestId('new-emission-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('new-emission-subPost').click()
    cy.get('[data-value="Electricite"]').click()

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new detailed FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '45 kgCO₂e/GWh')
  })

  it('should create an emission factor with total CO2 and multiple parts on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new multiple FE')
    cy.getByTestId('new-emission-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('new-emission-source').type('Magic')

    cy.getByTestId('new-emission-multiple-switch').get('input').should('not.be.checked')
    cy.getByTestId('new-emission-multiple-switch').click()

    cy.getByTestId('new-emission-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('3')
    })
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')
    cy.getByTestId('emission-part-2-header').should('be.visible')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('new-emission-part-0-name').type('My first part')
    cy.getByTestId('new-emission-part-0-type').type('Amont')
    cy.getByTestId('new-emission-part-0-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-0-totalCo2').type('3')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('new-emission-part-1-name').type('My second part')
    cy.getByTestId('new-emission-part-1-type').type('Combustion')
    cy.getByTestId('new-emission-part-1-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-1-totalCo2').type('6')

    cy.getByTestId('emission-part-2-expand').click()
    cy.getByTestId('new-emission-part-2-name').type('My first part')
    cy.getByTestId('new-emission-part-2-type').type('Incineration')
    cy.getByTestId('new-emission-part-2-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-2-totalCo2').type('12')

    cy.getByTestId('emission-part-0-header').should('have.text', 'My first part')
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('emission-part-2-header').should('have.text', 'My first part')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('have.value', '21')
    })

    cy.getByTestId('new-emission-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('new-emission-subPost').click()
    cy.get('[data-value="Electricite"]').click()

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new multiple FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '21 kgCO₂e/GWh')
  })

  it('should create an emission factor with detailed CO2 and multiple parts on your organization', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new multiple detailed FE')
    cy.getByTestId('new-emission-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('new-emission-source').type('Magic')

    cy.getByTestId('new-emission-detailed-switch').click()
    cy.getByTestId('new-emission-multiple-switch').click()
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('new-emission-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-0-header').should('have.text', 'Composante 1')
    cy.getByTestId('emission-part-1-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('have.text', 'Composante 2')
    cy.getByTestId('emission-part-2-header').should('not.exist')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('new-emission-part-0-name').type('My first part')
    cy.getByTestId('new-emission-part-0-type').type('Amont')
    cy.getByTestId('new-emission-part-0-co2f').should('exist')
    cy.getByTestId('new-emission-part-0-co2f').type('1')
    cy.getByTestId('new-emission-part-0-ch4f').should('exist')
    cy.getByTestId('new-emission-part-0-ch4f').type('2')
    cy.getByTestId('new-emission-part-0-ch4b').should('exist')
    cy.getByTestId('new-emission-part-0-ch4b').type('3')
    cy.getByTestId('new-emission-part-0-n2o').should('exist')
    cy.getByTestId('new-emission-part-0-n2o').type('4')
    cy.getByTestId('new-emission-part-0-co2b').should('exist')
    cy.getByTestId('new-emission-part-0-co2b').type('5')
    cy.getByTestId('new-emission-part-0-sf6').should('exist')
    cy.getByTestId('new-emission-part-0-sf6').type('6')
    cy.getByTestId('new-emission-part-0-hfc').should('exist')
    cy.getByTestId('new-emission-part-0-hfc').type('7')
    cy.getByTestId('new-emission-part-0-pfc').should('exist')
    cy.getByTestId('new-emission-part-0-pfc').type('8')
    cy.getByTestId('new-emission-part-0-otherGES').should('exist')
    cy.getByTestId('new-emission-part-0-otherGES').type('9')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('new-emission-part-1-name').type('My second part')
    cy.getByTestId('new-emission-part-1-type').type('Combustion')
    cy.getByTestId('new-emission-part-1-co2f').should('exist')
    cy.getByTestId('new-emission-part-1-co2f').type('2')
    cy.getByTestId('new-emission-part-1-ch4f').should('exist')
    cy.getByTestId('new-emission-part-1-ch4f').type('3')
    cy.getByTestId('new-emission-part-1-ch4b').should('exist')
    cy.getByTestId('new-emission-part-1-ch4b').type('4')
    cy.getByTestId('new-emission-part-1-n2o').should('exist')
    cy.getByTestId('new-emission-part-1-n2o').type('5')
    cy.getByTestId('new-emission-part-1-co2b').should('exist')
    cy.getByTestId('new-emission-part-1-co2b').type('6')
    cy.getByTestId('new-emission-part-1-sf6').should('exist')
    cy.getByTestId('new-emission-part-1-sf6').type('7')
    cy.getByTestId('new-emission-part-1-hfc').should('exist')
    cy.getByTestId('new-emission-part-1-hfc').type('8')
    cy.getByTestId('new-emission-part-1-pfc').should('exist')
    cy.getByTestId('new-emission-part-1-pfc').type('9')
    cy.getByTestId('new-emission-part-1-otherGES').should('exist')
    cy.getByTestId('new-emission-part-1-otherGES').type('10')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
      cy.get('input').should('have.value', '99')
    })

    cy.getByTestId('new-emission-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('new-emission-subPost').click()
    cy.get('[data-value="Electricite"]').click()

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new multiple detailed FE')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '99 kgCO₂e/GWh')
  })

  it('should render emission parts in accordions', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('not.be.disabled')
    })

    cy.getByTestId('new-emission-multiple-switch').click()
    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('new-emission-parts-count').within(() => {
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
    cy.getByTestId('new-emission-part-0-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-0-totalCo2').should('not.be.disabled')
    cy.getByTestId('new-emission-part-0-co2f').should('not.exist')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('new-emission-part-1-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-1-totalCo2').should('not.be.disabled')
    cy.getByTestId('new-emission-part-1-co2f').should('not.exist')

    cy.getByTestId('emission-part-2-expand').click()
    cy.getByTestId('new-emission-part-2-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-2-totalCo2').should('not.be.disabled')
    cy.getByTestId('new-emission-part-2-co2f').should('not.exist')

    cy.getByTestId('new-emission-detailed-switch').click()

    cy.getByTestId('new-emission-part-0-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('new-emission-part-0-co2f').should('exist')

    cy.getByTestId('new-emission-part-1-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('new-emission-part-1-co2f').should('exist')

    cy.getByTestId('new-emission-part-2-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
    cy.getByTestId('new-emission-part-2-co2f').should('exist')

    cy.getByTestId('new-emission-multiple-switch').click()

    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('emission-part-1-header').should('not.exist')
    cy.getByTestId('emission-part-2-header').should('not.exist')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('be.disabled')
    })
  })

  it('should not delete parts from form when switch off detailed ges', () => {
    cy.login()
    cy.visit('/facteurs-d-emission')

    cy.getByTestId('new-emission').click()

    cy.getByTestId('new-emission-name').type('My new FE without parts')
    cy.getByTestId('new-emission-unit').click()
    cy.get('[data-value="GWH"]').click()
    cy.getByTestId('new-emission-source').type('Magic')

    cy.getByTestId('new-emission-multiple-switch').click()

    cy.getByTestId('new-emission-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })

    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')

    cy.getByTestId('emission-part-0-expand').click()
    cy.getByTestId('new-emission-part-0-name').type('My first part')
    cy.getByTestId('new-emission-part-0-type').type('Amont')
    cy.getByTestId('new-emission-part-0-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-0-totalCo2').type('3')

    cy.getByTestId('emission-part-1-expand').click()
    cy.getByTestId('new-emission-part-1-name').type('My second part')
    cy.getByTestId('new-emission-part-1-type').type('Combustion')
    cy.getByTestId('new-emission-part-1-totalCo2').should('be.visible')
    cy.getByTestId('new-emission-part-1-totalCo2').type('6')

    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('have.value', '9')
    })

    cy.getByTestId('new-emission-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('1')
    })
    cy.getByTestId('emission-part-1-header').should('not.exist')
    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('have.value', '3')
    })

    cy.getByTestId('new-emission-parts-count').within(() => {
      cy.get('input').clear()
      cy.get('input').type('2')
    })
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('new-emission-totalCo2').within(() => {
      cy.get('input').should('have.value', '9')
    })

    cy.getByTestId('new-emission-multiple-switch').click()
    cy.getByTestId('emission-part-0-header').should('not.exist')
    cy.getByTestId('emission-part-1-header').should('not.exist')

    cy.getByTestId('new-emission-multiple-switch').click()
    cy.getByTestId('emission-part-0-header').should('have.text', 'My first part')
    cy.getByTestId('emission-part-1-header').should('have.text', 'My second part')
    cy.getByTestId('emission-part-0-header').should('be.visible')
    cy.getByTestId('emission-part-1-header').should('be.visible')

    cy.getByTestId('new-emission-multiple-switch').click()

    cy.getByTestId('new-emission-totalCo2').clear()
    cy.getByTestId('new-emission-totalCo2').type('144')
    cy.getByTestId('new-emission-post').click()
    cy.get('[data-value="Energies"]').click()
    cy.getByTestId('new-emission-subPost').click()
    cy.get('[data-value="Electricite"]').click()

    cy.getByTestId('new-emission-create-button').click()

    cy.wait('@create')

    cy.url().should('eq', `${Cypress.config().baseUrl}/facteurs-d-emission`)
    cy.getByTestId('cell-emission-name').first().should('have.text', 'My new FE without parts')
    cy.getByTestId('cell-emission-Valeur').first().should('have.text', '144 kgCO₂e/GWh')
  })
})
