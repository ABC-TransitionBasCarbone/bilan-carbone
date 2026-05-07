import clicksonPackage from '../../../../packages/publicodes-packages/publicodes-clickson/package.json'
import countPackage from '../../../../packages/publicodes-packages/publicodes-count/package.json'
import tiltPackage from '../../../../packages/publicodes-packages/publicodes-tilt/package.json'
import mainPackage from '../../package.json'

export const PUBLICODES_COUNT_VERSION = `${countPackage.name}@${countPackage.version}`
export const PUBLICODES_CLICKSON_VERSION = `${clicksonPackage.name}@${clicksonPackage.version}`
export const PUBLICODES_TILT_VERSION = `${tiltPackage.name}@${tiltPackage.version}`
export const PUBLICODES_ENGINE_VERSION = mainPackage.dependencies.publicodes.replace('^', '') // "1.9.1"
