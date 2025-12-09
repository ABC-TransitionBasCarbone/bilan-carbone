import mainPackage from '../../package.json'
import countPackage from '../../publicodes-packages/publicodes-count/package.json'

export const PUBLICODES_COUNT_VERSION = countPackage.version // "0.1.0"

export const PUBLICODES_ENGINE_VERSION = mainPackage.dependencies.publicodes.replace('^', '') // "1.9.1"
