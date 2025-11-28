import mainPackage from '../../package.json'

export const PUBLICODES_COUNT_VERSION = mainPackage.dependencies['@abc-transitionbascarbone/publicodes-count'].replace(
  '^',
  '',
)

export const PUBLICODES_ENGINE_VERSION = mainPackage.dependencies.publicodes.replace('^', '') // "1.9.1"
