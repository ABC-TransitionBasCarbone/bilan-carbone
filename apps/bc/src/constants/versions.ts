import publicodesPackage from '@abc-transitionbascarbone/publicodes-packages/package.json'
import mainPackage from '../../package.json'

export const PUBLICODES_COUNT_VERSION = `@abc-transitionbascarbone/publicodes-count@${publicodesPackage.version}`
export const PUBLICODES_CLICKSON_VERSION = `@abc-transitionbascarbone/publicodes-clickson@${publicodesPackage.version}`
export const PUBLICODES_TILT_VERSION = `@abc-transitionbascarbone/publicodes-tilt@${publicodesPackage.version}`
export const PUBLICODES_ENGINE_VERSION = mainPackage.dependencies.publicodes.replace('^', '') // "1.9.1"
