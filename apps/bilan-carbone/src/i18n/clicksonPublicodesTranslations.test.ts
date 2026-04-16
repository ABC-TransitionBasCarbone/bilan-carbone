import { expect } from '@jest/globals'
import fs from 'fs'
import path from 'path'

describe('Clickson publicodes transport labels', () => {
  const filePath = path.join(__dirname, 'translations', 'fr', 'publicodes', 'clickson-rules.json')
  const clicksonRules = JSON.parse(fs.readFileSync(filePath, 'utf8'))['publicodes-rules']

  it('uses a distinct title for electric bus in student transport', () => {
    expect(clicksonRules.déplacements['transport des élèves']['bus électrique'].titre).toBe('Autobus électrique')
  })

  it('uses a distinct title for electric bus in staff transport', () => {
    expect(clicksonRules.déplacements['transport du personnel']['bus électrique'].titre).toBe('Autobus électrique')
  })
})
