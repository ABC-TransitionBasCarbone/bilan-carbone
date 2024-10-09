describe("Page d'accueil", () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it("Affiche le body de l'application", () => {
    cy.get('body').should('be.visible')
  })
})
