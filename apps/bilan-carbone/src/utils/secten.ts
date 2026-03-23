import { SECTEN_SECTORS, SectenSector } from '@/constants/trajectories'
import type { SectenInfo } from '@repo/db-common'

export type SectenDiffEntry = {
  year: number
  sector: SectenSector
  oldValue: number
  newValue: number
}

export type SectenAddedEntry = {
  year: number
  sector: SectenSector
  value: number
}

export type SectenVersionDiff = {
  modified: SectenDiffEntry[]
  added: SectenAddedEntry[]
}

export const compareSectenVersions = (oldData: SectenInfo[], newData: SectenInfo[]): SectenVersionDiff => {
  const modified: SectenDiffEntry[] = []
  const added: SectenAddedEntry[] = []

  const oldByYear = new Map(oldData.map((d) => [d.year, d]))

  for (const newEntry of newData) {
    const oldEntry = oldByYear.get(newEntry.year)

    if (!oldEntry) {
      for (const sector of SECTEN_SECTORS) {
        added.push({ year: newEntry.year, sector, value: newEntry[sector] })
      }
      continue
    }

    for (const sector of SECTEN_SECTORS) {
      if (newEntry[sector] !== oldEntry[sector]) {
        modified.push({ year: newEntry.year, sector, oldValue: oldEntry[sector], newValue: newEntry[sector] })
      }
    }
  }

  return { modified, added }
}
