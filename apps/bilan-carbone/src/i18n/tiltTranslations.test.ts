import { expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'

describe('Tilt translations', () => {
  it('uses the Cap Carbone wording on the simplified home banner title in French', () => {
    const filePath = path.join(__dirname, 'translations', 'fr', 'tilt.json')
    const translations = JSON.parse(fs.readFileSync(filePath, 'utf8'))

    expect(translations.home.title).toBe('Calculer votre empreinte carbone simplifiée avec Cap Carbone vous permettra de :')
  })
})
