import { storageKeys } from '@/constants/storage.constants'

const studyId = '88c93e88-7c80-4be4-905b-f0bbd2ccc779'
const initializationPath = `/etudes/${studyId}/initialisation`

describe('Transition plan initialization without an existing plan', () => {
  beforeEach(() => {
    cy.login('bc-gestionnaire-0@yopmail.com', 'password-0')
  })

  it('shows the empty state with clean browser storage', () => {
    cy.visit(initializationPath)

    cy.contains('button', 'Démarrer mon plan de transition').should('be.visible')
    cy.contains("Une erreur s'est produite").should('not.exist')
  })

  it('shows the empty state with valid saved filters', () => {
    cy.visit(initializationPath, {
      onBeforeLoad(window) {
        window.localStorage.setItem(storageKeys.studyFilterSites(studyId), JSON.stringify([]))
        window.localStorage.setItem(storageKeys.studyFilterSubposts(studyId), JSON.stringify(['CombustiblesFossiles']))
        window.localStorage.setItem(storageKeys.studyFilterTags(studyId), JSON.stringify([]))
        window.localStorage.setItem(storageKeys.studyFilterSitesAll(studyId), JSON.stringify([]))
        window.localStorage.setItem(storageKeys.studyFilterTagsAll(studyId), JSON.stringify([]))
      },
    })

    cy.contains('button', 'Démarrer mon plan de transition').should('be.visible')
    cy.contains("Une erreur s'est produite").should('not.exist')
  })

  for (const [label, key] of [
    ['sites', storageKeys.studyFilterSites(studyId)],
    ['subposts', storageKeys.studyFilterSubposts(studyId)],
    ['tags', storageKeys.studyFilterTags(studyId)],
    ['site scope', storageKeys.studyFilterSitesAll(studyId)],
    ['tag scope', storageKeys.studyFilterTagsAll(studyId)],
  ]) {
    it(`recovers from invalid saved ${label} without showing the error page`, () => {
      cy.visit(initializationPath, {
        onBeforeLoad(window) {
          window.localStorage.setItem(storageKeys.studyFilterSites(studyId), JSON.stringify(['saved-site']))
          window.localStorage.setItem(storageKeys.studyFilterTags(studyId), JSON.stringify(['saved-tag']))
          window.localStorage.setItem(key, 'invalid-json')
        },
      })

      cy.window().its('localStorage').invoke('getItem', key).should('not.equal', 'invalid-json')
      cy.contains('button', 'Démarrer mon plan de transition').should('be.visible')
      cy.contains("Une erreur s'est produite").should('not.exist')
    })
  }
})
